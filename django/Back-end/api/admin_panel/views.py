from datetime import datetime, date
from io import BytesIO
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from api.models import (
    Users,
    Teachers,
    Students,
    Classes,
    Departments,
    Section,
    Schedules,
    Posts,
    PostType,
    ForumQuestions,
    ForumAnswers,
    TeacherAvailabilities,
    AvailabilityContext,
    AvailabilityLevel,
    PFECampaigns,
    ExamSessions,
    ExamSurveillanceAssignments,
    PFESubjects,
    PFEPresentationSlots,
    PFEJuryAssignments,
    JuryRole,
    UserRole,
    TimetablePublications,
    TimetableTelemetry,
    Attendance,
)
from rest_framework.response import Response
from api.admin_panel.permissions import IsAdmin,IsAdminOrTeacher,IsAdminOrStudent
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.utils import OpenApiTypes, extend_schema
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from api.utils.pdf_uploader import upload_pdf_to_gcs


GENERIC_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    201: OpenApiTypes.OBJECT,
    400: OpenApiTypes.OBJECT,
    404: OpenApiTypes.OBJECT,
    500: OpenApiTypes.OBJECT,
}


def _validate_section_level(section, level):
    if section not in Section.values:
        return "section not found"
    if level < 1:
        return "Invalid level"
    if section == Section.PREPA_MPI and level > 2:
        return "Prépa classes support niveau up to 2"
    if section != Section.PREPA_MPI and level > 3:
        return "Non-Prépa classes support niveau up to 3"
    return None


def _class_label(classe):
    return f"{classe.niveau}-{classe.classe_section}-{classe.classe_num}"


def _parse_class_token(token):
    # Format: "{niveau}-{section}-{num}"
    # niveau and num are plain integers; section may itself contain dashes (e.g. "L-LSI").
    # Strategy: take the first segment as niveau, last segment as num, everything in between is section.
    parts = str(token).strip().split("-")
    if len(parts) < 3:
        return None
    try:
        niveau = parts[0].strip()
        int(niveau)
    except ValueError:
        return None
    try:
        classe_num = parts[-1].strip()
        int(classe_num)
    except ValueError:
        return None
    section = "-".join(parts[1:-1]).strip()
    if not section:
        return None
    return niveau, section, classe_num


def _normalize_schedule_day(value):
    raw = str(value).strip().lower()
    day_map = {
        "lundi": "Lundi",
        "mardi": "Mardi",
        "mercredi": "Mercredi",
        "jeudi": "jeudi",
        "vendredi": "Vendredi",
        "samedi": "Samedi",
    }
    return day_map.get(raw)


def _normalize_schedule_time(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.time().replace(microsecond=0)
    if hasattr(value, "hour") and hasattr(value, "minute"):
        return value.replace(microsecond=0)
    try:
        as_text = str(value).strip()
        if not as_text:
            return None
        if len(as_text) == 5:
            return datetime.strptime(as_text, "%H:%M").time()
        return datetime.strptime(as_text, "%H:%M:%S").time()
    except Exception:
        return None


def _time_overlaps(start_a, end_a, start_b, end_b):
    return start_a < end_b and start_b < end_a


def _parse_schedule_dataframe(df):
    expected_columns = [
        "jour",
        "heure-debut",
        "heure-fin",
        "matiere",
        "professeur",
        "classe",
        "salle",
    ]
    if not set(expected_columns).issubset(df.columns):
        return [], ["Invalid file format: expected columns are missing"]

    parsed_rows = []
    errors = []

    for index, row in df.iterrows():
        row_number = index + 2
        teacher_username = str(row.get("professeur", "")).strip()
        class_token = str(row.get("classe", "")).strip()
        day_of_week = _normalize_schedule_day(row.get("jour"))
        start_time = _normalize_schedule_time(row.get("heure-debut"))
        end_time = _normalize_schedule_time(row.get("heure-fin"))
        subject = str(row.get("matiere", "")).strip()
        room = str(row.get("salle", "")).strip()

        if not teacher_username:
            errors.append(f"Row {row_number}: professeur is required")
            continue

        teacher_user = Users.objects.filter(username=teacher_username, role=UserRole.TEACHER.value).first()
        teacher = Teachers.objects.filter(user=teacher_user).first() if teacher_user else None
        if not teacher:
            errors.append(f"Row {row_number}: teacher '{teacher_username}' not found")
            continue

        class_chunks = _parse_class_token(class_token)
        if not class_chunks:
            errors.append(
                f"Row {row_number}: classe must match '<niveau>-<section>-<numero>'"
            )
            continue

        niveau, section, classe_num = class_chunks
        classe = Classes.objects.filter(
            niveau=str(niveau),
            classe_section=str(section),
            classe_num=str(classe_num),
        ).first()
        if not classe:
            errors.append(f"Row {row_number}: class '{class_token}' not found")
            continue

        if not day_of_week:
            errors.append(f"Row {row_number}: invalid day '{row.get('jour')}'")
            continue

        if not start_time or not end_time:
            errors.append(f"Row {row_number}: invalid start/end time")
            continue

        if start_time >= end_time:
            errors.append(f"Row {row_number}: start time must be before end time")
            continue

        if not subject:
            errors.append(f"Row {row_number}: matiere is required")
            continue

        if not room:
            errors.append(f"Row {row_number}: salle is required")
            continue

        parsed_rows.append(
            {
                "row_number": row_number,
                "teacher": teacher,
                "teacher_username": teacher.user.username,
                "classe": classe,
                "class_label": _class_label(classe),
                "day_of_week": day_of_week,
                "start_time": start_time,
                "end_time": end_time,
                "subject": subject,
                "room": room,
            }
        )

    return parsed_rows, errors


def _detect_schedule_conflicts(parsed_rows):
    conflicts = []

    for index, left in enumerate(parsed_rows):
        for right in parsed_rows[index + 1 :]:
            if left["day_of_week"] != right["day_of_week"]:
                continue
            if not _time_overlaps(
                left["start_time"],
                left["end_time"],
                right["start_time"],
                right["end_time"],
            ):
                continue

            if left["teacher"].user_id == right["teacher"].user_id:
                conflicts.append(
                    f"Rows {left['row_number']} and {right['row_number']}: teacher overlap for {left['teacher_username']}"
                )
            if left["classe"].id == right["classe"].id:
                conflicts.append(
                    f"Rows {left['row_number']} and {right['row_number']}: class overlap for {left['class_label']}"
                )
            if left["room"].strip().lower() == right["room"].strip().lower():
                conflicts.append(
                    f"Rows {left['row_number']} and {right['row_number']}: room overlap in {left['room']}"
                )

    existing = Schedules.objects.all().select_related("teacher", "class_id", "teacher__user")
    for row in parsed_rows:
        for schedule in existing:
            if row["day_of_week"] != schedule.day_of_week:
                continue
            if not _time_overlaps(
                row["start_time"], row["end_time"], schedule.start_time, schedule.end_time
            ):
                continue
            if row["teacher"].user_id == schedule.teacher.user_id:
                conflicts.append(
                    f"Row {row['row_number']}: teacher overlap with existing schedule for {row['teacher_username']}"
                )
            if row["classe"].id == schedule.class_id.id:
                conflicts.append(
                    f"Row {row['row_number']}: class overlap with existing schedule for {row['class_label']}"
                )
            if row["room"].strip().lower() == schedule.room.strip().lower():
                conflicts.append(
                    f"Row {row['row_number']}: room overlap with existing schedule in {row['room']}"
                )

    return conflicts


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def timetable_import_dry_run(request):
    try:
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=400)
        if not file.name.endswith('.xlsx'):
            return Response({"error": "Invalid file format"}, status=400)

        df = pd.read_excel(file)
        if df.empty:
            return Response({"error": "Empty file"}, status=400)

        parsed_rows, errors = _parse_schedule_dataframe(df)
        conflicts = _detect_schedule_conflicts(parsed_rows) if not errors else []

        return Response(
            {
                "valid": len(errors) == 0 and len(conflicts) == 0,
                "errors": errors,
                "conflicts": conflicts,
                "parsed_count": len(parsed_rows),
                "preview": [
                    {
                        "teacher": row["teacher_username"],
                        "class": row["class_label"],
                        "day_of_week": row["day_of_week"],
                        "start_time": str(row["start_time"]),
                        "end_time": str(row["end_time"]),
                        "room": row["room"],
                        "subject": row["subject"],
                    }
                    for row in parsed_rows[:30]
                ],
            },
            status=200,
        )
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def timetable_import_commit(request):
    try:
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=400)
        if not file.name.endswith('.xlsx'):
            return Response({"error": "Invalid file format"}, status=400)

        df = pd.read_excel(file)
        if df.empty:
            return Response({"error": "Empty file"}, status=400)

        parsed_rows, errors = _parse_schedule_dataframe(df)
        conflicts = _detect_schedule_conflicts(parsed_rows) if not errors else []

        if errors or conflicts:
            return Response(
                {
                    "error": "Validation failed",
                    "errors": errors,
                    "conflicts": conflicts,
                    "parsed_count": len(parsed_rows),
                },
                status=400,
            )

        replace_existing = str(request.data.get('replace_existing', 'false')).lower() == 'true'

        with transaction.atomic():
            if replace_existing:
                Schedules.objects.all().delete()

            created = []
            for row in parsed_rows:
                schedule = Schedules.objects.create(
                    teacher=row["teacher"],
                    class_id=row["classe"],
                    day_of_week=row["day_of_week"],
                    start_time=row["start_time"],
                    end_time=row["end_time"],
                    room=row["room"],
                    subject=row["subject"],
                )
                created.append(str(schedule.id))

        return Response(
            {
                "message": "Timetable imported successfully",
                "created_count": len(created),
                "created_ids": created,
            },
            status=201,
        )
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


def _build_exam_calendar_pdf(exams):
    pdf_buffer = BytesIO()
    pdf = canvas.Canvas(pdf_buffer, pagesize=letter)
    width, height = letter
    y = height - 50
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, y, "Calendrier des examens")
    y -= 30
    pdf.setFont("Helvetica", 10)
    for exam in exams:
        line = f"{exam.exam_date} | {exam.subject} | {_class_label(exam.class_id)} | {exam.start_time}-{exam.end_time} | {exam.room}"
        pdf.drawString(50, y, line[:120])
        y -= 16
        if y < 60:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 10)
    pdf.save()
    pdf_buffer.seek(0)
    return pdf_buffer


def _teacher_surveillance_payload(teacher):
    weekly_hours = teacher.weekly_teaching_hours
    required = teacher.required_surveillance_hours
    assigned = teacher.assigned_surveillance_hours
    return {
        "teacher_id": str(teacher.user_id),
        "teacher_name": teacher.user.username,
        "weekly_teaching_hours": weekly_hours,
        "required_surveillance_hours": required,
        "assigned_surveillance_hours": assigned,
        "remaining_surveillance_hours": round(required - assigned, 2),
    }


def _get_publication_state():
    publication = TimetablePublications.objects.order_by('-updated_at').first()
    if publication:
        return publication
    publication = TimetablePublications.objects.create(is_published=False)
    publication.save()
    return publication


def _is_timetable_published():
    return bool(_get_publication_state().is_published)


def _serialize_schedule(schedule):
    return {
        "id": str(schedule.id),
        "teacher_id": str(schedule.teacher.user_id),
        "teacher": schedule.teacher.user.username,
        "class_id": str(schedule.class_id.id),
        "class": _class_label(schedule.class_id),
        "day_of_week": schedule.day_of_week,
        "start_time": str(schedule.start_time),
        "end_time": str(schedule.end_time),
        "room": schedule.room,
        "subject": schedule.subject,
    }


def _sync_departments_from_teachers():
    teacher_departments = (
        Teachers.objects.exclude(department__isnull=True)
        .exclude(department__exact="")
        .values_list("department", flat=True)
        .distinct()
    )
    for name in teacher_departments:
        Departments.objects.get_or_create(name=name.strip())


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_timetable_publish_status(request):
    try:
        publication = _get_publication_state()
        return Response(
            {
                "is_published": publication.is_published,
                "published_at": publication.published_at,
                "published_by": str(publication.published_by_id) if publication.published_by_id else None,
                "updated_at": publication.updated_at,
            },
            status=200,
        )
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def publish_timetable(request):
    try:
        publication = _get_publication_state()
        publication.is_published = True
        publication.published_at = timezone.now()
        publication.published_by = request.user
        publication.save()
        return Response({"message": "Timetable published"}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def unpublish_timetable(request):
    try:
        publication = _get_publication_state()
        publication.is_published = False
        publication.save()
        return Response({"message": "Timetable unpublished"}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_timetable_slots(request):
    try:
        if request.user.role == UserRole.STUDENT.value:
            return Response({"error": "Forbidden"}, status=403)

        query = Schedules.objects.all().select_related('teacher', 'teacher__user', 'class_id')
        teacher_id = request.query_params.get('teacher_id')
        class_id = request.query_params.get('class_id')
        day_of_week = request.query_params.get('day_of_week')

        if teacher_id:
            query = query.filter(teacher_id=teacher_id)
        if class_id:
            query = query.filter(class_id=class_id)
        if day_of_week:
            query = query.filter(day_of_week=day_of_week)

        schedules = sorted(
            list(query),
            key=lambda s: (
                ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi", "Samedi"].index(s.day_of_week)
                if s.day_of_week in ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi", "Samedi"]
                else 99,
                s.start_time,
            ),
        )
        return Response({"schedules": [_serialize_schedule(s) for s in schedules]}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_timetable_slot(request):
    try:
        teacher_id = request.data.get('teacher_id')
        class_id = request.data.get('class_id')
        day_of_week = _normalize_schedule_day(request.data.get('day_of_week'))
        start_time = _normalize_schedule_time(request.data.get('start_time'))
        end_time = _normalize_schedule_time(request.data.get('end_time'))
        room = str(request.data.get('room', '')).strip()
        subject = str(request.data.get('subject', '')).strip()

        if not all([teacher_id, class_id, day_of_week, start_time, end_time, room, subject]):
            return Response({"error": "Missing required fields"}, status=400)
        if start_time >= end_time:
            return Response({"error": "start_time must be before end_time"}, status=400)

        teacher = Teachers.objects.filter(user_id=teacher_id).select_related('user').first()
        classe = Classes.objects.filter(id=class_id).first()
        if not teacher or not classe:
            return Response({"error": "Teacher or class not found"}, status=404)

        candidate = {
            "row_number": "manual",
            "teacher": teacher,
            "teacher_username": teacher.user.username,
            "classe": classe,
            "class_label": _class_label(classe),
            "day_of_week": day_of_week,
            "start_time": start_time,
            "end_time": end_time,
            "subject": subject,
            "room": room,
        }
        conflicts = _detect_schedule_conflicts([candidate])
        if conflicts:
            return Response({"error": "Conflict detected", "conflicts": conflicts}, status=400)

        schedule = Schedules.objects.create(
            teacher=teacher,
            class_id=classe,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
            room=room,
            subject=subject,
        )
        schedule.save()
        return Response({"message": "Slot created", "slot": _serialize_schedule(schedule)}, status=201)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def delete_timetable_slot(request):
    try:
        schedule_id = request.query_params.get('schedule_id')
        if not schedule_id:
            return Response({"error": "schedule_id is required"}, status=400)
        schedule = Schedules.objects.filter(id=schedule_id).first()
        if not schedule:
            return Response({"error": "Slot not found"}, status=404)
        schedule.delete()
        return Response({"message": "Slot deleted"}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_timetable_ics(request):
    try:
        scope = request.query_params.get('scope')
        if request.user.role == UserRole.TEACHER.value:
            teacher = Teachers.objects.filter(user=request.user).first()
            schedules = Schedules.objects.filter(teacher=teacher)
            calendar_name = f"Teacher timetable - {request.user.username}"
        elif request.user.role == UserRole.STUDENT.value:
            student = Students.objects.filter(user=request.user).select_related('class_id').first()
            if not student or not student.class_id:
                return Response({"error": "Student class not found"}, status=404)
            schedules = Schedules.objects.filter(class_id=student.class_id)
            calendar_name = f"Student timetable - {request.user.username}"
        else:
            if scope == 'teacher':
                teacher_id = request.query_params.get('teacher_id')
                schedules = Schedules.objects.filter(teacher_id=teacher_id)
                calendar_name = "Teacher timetable"
            elif scope == 'class':
                class_id = request.query_params.get('class_id')
                schedules = Schedules.objects.filter(class_id=class_id)
                calendar_name = "Class timetable"
            else:
                schedules = Schedules.objects.all()
                calendar_name = "Global timetable"

        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//GestionPFE//Timetable//EN",
            f"X-WR-CALNAME:{calendar_name}",
        ]
        for schedule in schedules.select_related('teacher', 'teacher__user', 'class_id'):
            lines.extend(
                [
                    "BEGIN:VEVENT",
                    f"UID:{schedule.id}@gestionpfe",
                    f"SUMMARY:{schedule.subject}",
                    f"DESCRIPTION:Classe {_class_label(schedule.class_id)} - {schedule.teacher.user.username}",
                    f"LOCATION:{schedule.room}",
                    f"X-DAY-OF-WEEK:{schedule.day_of_week}",
                    f"X-START-TIME:{schedule.start_time}",
                    f"X-END-TIME:{schedule.end_time}",
                    "END:VEVENT",
                ]
            )
        lines.append("END:VCALENDAR")

        response = HttpResponse("\r\n".join(lines), content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="timetable.ics"'
        return response
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_timetable_readiness(request):
    try:
        date_param = request.query_params.get('date')
        session_date = date.fromisoformat(date_param) if date_param else date.today()

        rows = []
        schedules = Schedules.objects.all().select_related('class_id', 'teacher', 'teacher__user')
        for schedule in schedules:
            students_count = Students.objects.filter(class_id=schedule.class_id, access_status=True).count()
            marked_count = Attendance.objects.filter(schedule=schedule, session_date=session_date).count()
            rows.append(
                {
                    "schedule_id": str(schedule.id),
                    "class": _class_label(schedule.class_id),
                    "teacher": schedule.teacher.user.username,
                    "day_of_week": schedule.day_of_week,
                    "start_time": str(schedule.start_time),
                    "end_time": str(schedule.end_time),
                    "students_expected": students_count,
                    "attendance_marked": marked_count,
                    "ready": students_count > 0 and marked_count >= students_count,
                }
            )

        return Response({"date": str(session_date), "rows": rows}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_timetable_telemetry(request):
    event_name = str(request.data.get('event_name', '')).strip()
    route = str(request.data.get('route', '')).strip()
    payload = request.data.get('payload', None)
    if not event_name:
        return Response({"error": "event_name is required"}, status=400)

    try:
        if payload is not None and not isinstance(payload, (dict, list, str, int, float, bool)):
            payload = str(payload)

        TimetableTelemetry.objects.create(
            user=request.user,
            role=request.user.role,
            event_name=event_name,
            route=route,
            payload=payload,
        )
        return Response({"message": "Telemetry logged"}, status=201)
    except Exception:
        # Telemetry is non-critical; avoid failing user flows if persistence fails.
        return Response({"message": "Telemetry accepted but not persisted"}, status=202)
#request under this form :  
# {
#     "level": "1A",
#     "section": "A",
#     "nb": 2
# }
@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_classes (request):
    try:
        level = int(request.data.get('level'))
        section = request.data.get('section')
        nb = int(request.data.get('nb'))
        validation_error = _validate_section_level(section, level)
        if validation_error:
            return Response({"error": validation_error}, status=400)

        if nb < 1:
            return Response({"error": "nb must be greater than 0"}, status=400)

        existing_classes = Classes.objects.filter(
            niveau=str(level),
            classe_section=section,
        )
        existing_numbers = set()
        for existing in existing_classes:
            try:
                existing_numbers.add(int(existing.classe_num))
            except (TypeError, ValueError):
                continue

        next_num = max(existing_numbers) + 1 if existing_numbers else 1
        created = []
        for i in range(next_num, next_num + nb):
            new_class = Classes.objects.create(
                niveau=str(level),
                classe_section=section,
                classe_num=str(i),
            )
            new_class.save()
            created.append(f"{level}-{section}-{i}")

        return Response(
            {
                "message": "Classes created successfully",
                "created_count": len(created),
                "created_classes": created,
            },
            status=201,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def get_classes (request):
    try:
        classes = Classes.objects.all()
        class_data = []
        for classe in classes:
            class_data.append({
                "id": classe.id,
                "niveau": classe.niveau,
                "section": classe.classe_section,
                "num": classe.classe_num,
            })
        return Response({"classes": class_data}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)
#excel file format :
#jour,heure-debut,heure-fin,matiere,professeur,classe,salle
#classes are in this format : 1-tronc commun-3
#professors are in this format : prenom nom

@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_schedule (request):
    try:
        file = request.FILES.get('file')
        
        if not file:
            return Response({"error": "No file provided"}, status=400)
        if not file.name.endswith('.xlsx'):
            return Response({"error": "Invalid file format"}, status=400)  
        df = pd.read_excel(file)
        if df.empty:
            return Response({"error": "Empty file"}, status=400)
        expected_columns =['jour','heure-debut','heure-fin','matiere','professeur','classe','salle']
        if not set(expected_columns).issubset(df.columns):
            return Response({"error": "Invalid file format"}, status=401)
        for index, row in df.iterrows():
            professeur_name = str(row['professeur']).strip()
            classe_str = str(row['classe']).strip()
            
            professeur_user = Users.objects.filter(username__icontains=professeur_name, role="teacher").first()
            professeur = Teachers.objects.filter(user=professeur_user).first()
            if not professeur:
                return Response({"error": f"Teacher '{professeur_name}' not found at row number {index}"}, status=404)
            
            try:
                niveau = str(classe_str.split("-")[0])
                section = str(classe_str.split("-")[1])
                classe_num = str(classe_str.split("-")[2])
            except IndexError:
                return Response({"error": f"Invalid class format '{classe_str}' at row {index}. Use format '1-MPI-1'"}, status=400)
                
            classe = Classes.objects.filter(niveau=niveau, section=section, num=classe_num).first() 
            if not classe:
                # also try classe_section if the model uses that
                classe = Classes.objects.filter(niveau=niveau, classe_section=section, classe_num=classe_num).first()
            if not classe:
                return Response({"error": f"Class '{classe_str}' not found at row number {index}"}, status=404)
            jour = row['jour']
            heure_debut = row['heure-debut']
            heure_fin = row['heure-fin']
            if jour not in ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']:
                return Response({"error": f"Invalid day at row number {index} "}, status=400)
            matiere = row['matiere']
            salle = row['salle']
            if not matiere:
                return Response({"error": f"Invalid subject at row number {index} "}, status=400)
            if not salle:
                return Response({"error": f"Invalid room at row number {index} "}, status=400)
            schedule = Schedules.objects.create(teacher=professeur, class_id=classe, day_of_week=jour, start_time=heure_debut, end_time=heure_fin, room=salle, subject=matiere)
            schedule.save()
        return Response({"message": "Schedule created successfully"}, status=201)



    except Exception as e:
        print("error",e)
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)

#request under this form :
# params = niveau section classe_num or just the class_id
@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrStudent])
def get_classes_schedule (request):
    try:
        if request.user.role == UserRole.STUDENT.value and not _is_timetable_published():
            return Response({"error": "Timetable not published yet"}, status=403)

        niveau= request.query_params.get('niveau')
        section= request.query_params.get('section')
        classe_num= request.query_params.get('classe_num')
        class_id = request.query_params.get('class_id')
        if (not niveau or not section or not classe_num) and (not class_id):
            return Response({"error": "Missing parameters"}, status=400)
        if class_id:
            classe = Classes.objects.filter(id=class_id).first()
        else :
            classe = Classes.objects.filter(niveau=niveau, classe_section=section, classe_num=classe_num).first()
        if not classe:
            return Response({"error": "Class not found"}, status=404)
        schedules = Schedules.objects.filter(class_id=classe).select_related('teacher', 'teacher__user', 'class_id').order_by('day_of_week','start_time')
        schedule_data = []
        for schedule in schedules:
            schedule_data.append({
                "id": str(schedule.id),
                "teacher_id": str(schedule.teacher.user_id),
                "teacher": schedule.teacher.user.username,
                "class": _class_label(schedule.class_id),
                "day_of_week": schedule.day_of_week,
                "start_time": str(schedule.start_time),
                "end_time": str(schedule.end_time),
                "room": schedule.room,
                "subject": schedule.subject,
            })
        return Response({"schedules": schedule_data}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)

#request under this form :
# params = teacher-id
@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def get_teacher_schedule (request):
    try:
        if request.user.role == UserRole.TEACHER.value and not _is_timetable_published():
            return Response({"error": "Timetable not published yet"}, status=403)

        teacher = request.query_params.get('teacher_id')
        if not teacher:
            return Response({"error": "Missing parameters"}, status=400)
        teacher = Users.objects.get(id=teacher, role="teacher")
        if not teacher:
            return Response({"error": "Teacher not found"}, status=404)
        teacher = Teachers.objects.get(user=teacher)
        schedules = Schedules.objects.filter(teacher=teacher).order_by('day_of_week','start_time')
        schedule_data = []
        for schedule in schedules:
            classe = Classes.objects.get(id=schedule.class_id.id)
            schedule_data.append({
                "id": str(schedule.id),
                "class": f"{classe.niveau}-{classe.classe_section}-{classe.classe_num}",
                "day_of_week": schedule.day_of_week,
                "start_time": str(schedule.start_time),
                "end_time": str(schedule.end_time),
                "room": schedule.room,
                "subject": schedule.subject,
            })
        return Response({"schedules": schedule_data}, status=200)
            
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_teachers(request):
    try:
        teachers = Teachers.objects.all()
        teacher_data = []
        for teacher in teachers:
            teacher_data.append({
                "id": teacher.user.id,
                "username": teacher.user.username,
                "email": teacher.user.email,
                "department": teacher.department,
            })
        print(teacher_data)
        
        return Response({"teachers": teacher_data}, status=200)
    
    except Exception as e:
        print("error",e)
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_admin_dashboard_stats(request):
    try:
        _sync_departments_from_teachers()
        teachers_count = Teachers.objects.count()
        classes_count = Classes.objects.count()
        students_count = Students.objects.count()
        departments_count = Departments.objects.count()
        heads_assigned_count = Departments.objects.exclude(head__isnull=True).count()
        return Response(
            {
                "teachers": teachers_count,
                "classes": classes_count,
                "students": students_count,
                "departments": departments_count,
                "heads_assigned": heads_assigned_count,
            },
            status=200,
        )
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_departments(request):
    try:
        _sync_departments_from_teachers()
        data = []
        departments = Departments.objects.select_related('head', 'head__user').order_by('name')
        for department in departments:
            teachers_count = Teachers.objects.filter(department=department.name).count()
            data.append(
                {
                    "id": str(department.id),
                    "name": department.name,
                    "teachers_count": teachers_count,
                    "head": {
                        "id": str(department.head.user_id),
                        "username": department.head.user.username,
                        "email": department.head.user.email,
                    }
                    if department.head
                    else None,
                }
            )
        return Response({"departments": data}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_department(request):
    try:
        name = str(request.data.get('name', '')).strip()
        if not name:
            return Response({"error": "Department name is required"}, status=400)
        department, created = Departments.objects.get_or_create(name=name)
        return Response(
            {
                "message": "Department created successfully" if created else "Department already exists",
                "department": {
                    "id": str(department.id),
                    "name": department.name,
                },
            },
            status=201 if created else 200,
        )
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def assign_department_head(request):
    try:
        department_id = request.data.get('department_id')
        teacher_id = request.data.get('teacher_id')
        if not department_id:
            return Response({"error": "department_id is required"}, status=400)

        department = Departments.objects.filter(id=department_id).first()
        if not department:
            return Response({"error": "Department not found"}, status=404)

        if not teacher_id:
            department.head = None
            department.save(update_fields=['head'])
            return Response({"message": "Department head cleared"}, status=200)

        teacher = Teachers.objects.filter(user_id=teacher_id).select_related('user').first()
        if not teacher:
            return Response({"error": "Teacher not found"}, status=404)

        if (teacher.department or '').strip() != department.name:
            return Response(
                {"error": "Teacher department must match selected department"},
                status=400,
            )

        department.head = teacher
        department.save(update_fields=['head'])
        return Response(
            {
                "message": "Department head assigned",
                "department": {
                    "id": str(department.id),
                    "name": department.name,
                },
                "head": {
                    "id": str(teacher.user_id),
                    "username": teacher.user.username,
                    "email": teacher.user.email,
                },
            },
            status=200,
        )
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)

#request under this form :
# params = niveau section classe_num
#or class_id
@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_students(request):
    try:
        niveau = request.query_params.get('niveau')
        section = request.query_params.get('section')
        classe_num = request.query_params.get('classe_num')
        class_id =request.query_params.get('class_id')
        if (not niveau or not section or not classe_num) and (not class_id):
            return Response({"error": "Missing parameters"}, status=400)
        if class_id :
            classe = Classes.objects.filter(id=class_id).first()
        else :
            classe = Classes.objects.filter(niveau=niveau, classe_section=section, classe_num=classe_num).first()
        if not classe:
            return Response({"error": "Class not found"}, status=404)
        students = Students.objects.filter(class_id=classe).order_by('user__username')
        student_data = []
        for student in students:
            student_data.append({
                "username": student.user.username,
                "parent_contact": student.parent_contact,
                "access_status": student.access_status,
                "email" : student.user.email, 
            })
        return Response({"students": student_data}, status=200)
    
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)

#request under this form :
# {
#     "student_id": 1,
#     "access_status": true, # not required
#     "parent_contact": "new_parent_contact", not required 
#     "email": "new_email", not required
#     "password": "new_password" , not required
#      but at least one of them is required
#}

@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def update_student(request):
    try:
        student_id = request.data.get('student_id')
        access_status = request.data.get('access_status')
        parent_contact = request.data.get('parent_contact')
        email = request.data.get('email')
        password= request.data.get('password')
        if not student_id:
            return Response({"error": "Missing student ID"}, status=400)
        
        student = Students.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found"}, status=404)
        if not email and not password and not parent_contact:
            if not access_status:
                return Response({"error": "Missing parameters"}, status=400)
            student.access_status = access_status
            student.save()
            return Response({"message": "Student Status updated successfully"}, status=200)
        else :
            if email:
                student.user.email = email
                student.user.save()
            if password:
                student.user.set_password(password)
                student.user.save()
            if parent_contact:
                student.parent_contact = parent_contact
                student.save()
    
            
            
            
      
        return Response({"message": "Student updated successfully"}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)

#request under this form :
# params = student_id

@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def delete_student(request):
    try:
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({"error": "Missing student ID"}, status=400)
        
        student = Students.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found"}, status=404)
        
        student.delete()
        return Response({"message": "Student deleted successfully"}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)

#request under this form :
# {
#     "title": "Announcement Title",
#    "content": "Announcement content",
#   "file": "file.pdf"
# }    
# or
# {
#     "itle": "Lesson Title",
#    "content": "Lesson content",
#      "class_id":"class_id"
@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def create_post(request):
    try:
        title = request.data.get('title')
        content = request.data.get('content')
        file = request.FILES.get('file')
        class_id = request.data.get('class_id')
        type =PostType.ANNOUNCEMENT
        if class_id:
            class_id = Classes.objects.filter(id=class_id).first()
            type=PostType.LESSON
            if not class_id:
                return Response({"error": "Class not found"}, status=404)
        else:
            if(request.user.role =="teacher"):
                return Response({'error':"not authenticated"},status=400)
            class_id = None
        if not title:
            return Response({"error": "Missing parameters"}, status=400)
        if not file or not content:
            return Response({"error": "No file provided"}, status=400)
        if not file.name.endswith('.pdf'):
            return Response({"error": "Invalid file format"}, status=400)
        if file.size > 10 * 1024 * 1024:  # 10 MB limit
            return Response({"error": "File size exceeds limit"}, status=400)
        url=upload_pdf_to_gcs(file)
        post = Posts.objects.create(title=title, content=content,url=url,type=type,author=request.user,class_id=class_id)
        if not post :
            return Response({"error": "Failed to create post"}, status=500)
        post.save()
        return Response({"message": "Post created successfully"}, status=201)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)

#request under this form :
# params = post_id
@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def delete_post(request):
    try:
        post_id = request.query_params.get('post_id')
        if not post_id:
            return Response({"error": "Missing post ID"}, status=400)
        post = Posts.objects.filter(id=post_id).first()
        if not post:
            return Response({"error": "Post not found"}, status=404)
        post.delete()
        return Response({"message": "Post deleted successfully"}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)
@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def update_post(request):
    try:
        post_id = request.data.get('post_id')
        title = request.data.get('title')
        content = request.data.get('content')
        file = request.FILES.get('file')
        if not post_id:
            return Response({"error": "Missing post ID"}, status=400)
        post = Posts.objects.filter(id=post_id).first()
        if not post:
            return Response({"error": "Post not found"}, status=404)
        post.title = title if title else post.title
        post.content = content if content else post.content
        post.url = upload_pdf_to_gcs(file) if file else post.url
        post.save()
        return Response({"message": "Post updated successfully"}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)

@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lesson_posts(request):
    classe_id =request.query_params.get("classe_id")
    posts=Posts.objects.filter(type=PostType.LESSON ,class_id=classe_id).order_by('created_at')

    posts_data=[]
    for post in posts:
        posts_data.append(
            {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "url": post.url,
                "type": post.type,
                "created_at": str(post.created_at),
                "author": post.author.username,
            }
        )
    return Response({"lessons":posts_data},status=200)
        
@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_announcement_posts(request):
    try:
        posts = Posts.objects.filter(type=PostType.ANNOUNCEMENT).order_by('-created_at')
        post_data = []
        for post in posts:
            post_data.append({
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "url": post.url,
                "type": post.type,
                "created_at": str(post.created_at),
                "author": post.author.username,
            })
        return Response({"posts": post_data}, status=200)
    except Exception as e:
        import traceback; traceback.print_exc(); return Response({"error": str(e)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_forum_question(request):
    title = request.data.get('title')
    content = request.data.get('content')
    class_id = request.data.get('class_id')
    if not title or not content:
        return Response({"error": "title and content are required"}, status=400)
    classe = None
    if class_id:
        classe = Classes.objects.filter(id=class_id).first()
        if not classe:
            return Response({"error": "Class not found"}, status=404)
    question = ForumQuestions.objects.create(
        author=request.user,
        class_id=classe,
        title=title,
        content=content,
    )
    return Response({"id": str(question.id), "message": "Question created"}, status=201)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def answer_forum_question(request):
    question_id = request.data.get('question_id')
    content = request.data.get('content')
    if not question_id or not content:
        return Response({"error": "question_id and content are required"}, status=400)
    question = ForumQuestions.objects.filter(id=question_id).first()
    if not question:
        return Response({"error": "Question not found"}, status=404)
    answer = ForumAnswers.objects.create(question=question, author=request.user, content=content)
    return Response({"id": str(answer.id), "message": "Answer added"}, status=201)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_forum_questions(request):
    class_id = request.query_params.get('class_id')
    questions = ForumQuestions.objects.all().order_by('-created_at')
    if class_id:
        questions = questions.filter(class_id=class_id)
    payload = []
    for q in questions:
        payload.append({
            "id": str(q.id),
            "title": q.title,
            "content": q.content,
            "author": q.author.username,
            "class_id": str(q.class_id_id) if q.class_id_id else None,
            "is_resolved": q.is_resolved,
            "created_at": str(q.created_at),
            "answers_count": q.answers.count(),
        })
    return Response({"questions": payload}, status=200)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def set_teacher_availability(request):
    try:
        context = request.data.get('context')
        day_of_week = request.data.get('day_of_week')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        level = request.data.get('level', AvailabilityLevel.AVAILABLE)
        campaign_id = request.data.get('campaign_id')
        teacher_id = request.data.get('teacher_id')

        if context not in AvailabilityContext.values:
            return Response({"error": "Invalid context"}, status=400)

        if level not in AvailabilityLevel.values:
            return Response({"error": "Invalid availability level"}, status=400)

        campaign = None
        if campaign_id:
            campaign = PFECampaigns.objects.filter(id=campaign_id).first()
            if not campaign:
                return Response({"error": "Campaign not found"}, status=404)

        if request.user.role == 'teacher':
            teacher = Teachers.objects.filter(user=request.user).first()
        else:
            if not teacher_id:
                return Response({"error": "teacher_id is required for admin"}, status=400)
            teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
            teacher = Teachers.objects.filter(user=teacher_user).first()

        if not teacher:
            return Response({"error": "Teacher not found"}, status=404)
        if not day_of_week or not start_time or not end_time:
            return Response({"error": "day_of_week, start_time and end_time are required"}, status=400)

        availability, _ = TeacherAvailabilities.objects.get_or_create(
            teacher=teacher,
            context=context,
            campaign=campaign,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
            defaults={"level": level},
        )
        if availability.level != level:
            availability.level = level
            availability.save(update_fields=["level"])

        return Response({"message": "Availability saved", "id": str(availability.id)}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def get_teacher_surveillance_load(request):
    teacher_id = request.query_params.get('teacher_id')
    if request.user.role == 'teacher':
        teacher = Teachers.objects.filter(user=request.user).first()
    else:
        if not teacher_id:
            return Response({"error": "teacher_id is required"}, status=400)
        teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
        teacher = Teachers.objects.filter(user=teacher_user).first()

    if not teacher:
        return Response({"error": "Teacher not found"}, status=404)
    return Response(_teacher_surveillance_payload(teacher), status=200)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_exam_calendar_manual(request):
    try:
        class_id = request.data.get('class_id')
        subject = request.data.get('subject')
        exam_date = request.data.get('exam_date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        room = request.data.get('room')
        teacher_ids = request.data.get('teacher_ids', [])

        classe = Classes.objects.filter(id=class_id).first()
        if not classe:
            return Response({"error": "Class not found"}, status=404)
        if not subject or not exam_date or not start_time or not end_time or not room:
            return Response({"error": "Missing required fields"}, status=400)

        exam = ExamSessions.objects.create(
            class_id=classe,
            subject=subject,
            exam_date=exam_date,
            start_time=start_time,
            end_time=end_time,
            room=room,
            created_by=request.user,
        )

        for teacher_id in teacher_ids:
            teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
            teacher = Teachers.objects.filter(user=teacher_user).first()
            if teacher:
                ExamSurveillanceAssignments.objects.get_or_create(exam_session=exam, teacher=teacher)

        return Response({"exam_id": str(exam.id), "message": "Exam session created"}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_exam_calendar_from_excel(request):
    try:
        file = request.FILES.get('file')
        if not file or not file.name.endswith('.xlsx'):
            return Response({"error": "A valid .xlsx file is required"}, status=400)

        df = pd.read_excel(file)
        expected_columns = ['matiere', 'classe', 'enseignants', 'date', 'heure-debut', 'heure-fin', 'salle']
        if not set(expected_columns).issubset(df.columns):
            return Response({"error": "Invalid file format"}, status=400)

        created_exams = []
        for index, row in df.iterrows():
            class_parts = _parse_class_token(row['classe'])
            if not class_parts:
                return Response({"error": f"Invalid class format at row {index + 1}"}, status=400)

            niveau, section, classe_num = class_parts
            classe = Classes.objects.filter(niveau=niveau, classe_section=section, classe_num=classe_num).first()
            if not classe:
                return Response({"error": f"Class not found at row {index + 1}"}, status=404)

            exam = ExamSessions.objects.create(
                class_id=classe,
                subject=str(row['matiere']),
                exam_date=row['date'],
                start_time=row['heure-debut'],
                end_time=row['heure-fin'],
                room=str(row['salle']),
                created_by=request.user,
            )
            created_exams.append(exam)

            for teacher_name in str(row['enseignants']).split(';'):
                teacher_user = Users.objects.filter(username=teacher_name.strip(), role='teacher').first()
                teacher = Teachers.objects.filter(user=teacher_user).first()
                if teacher:
                    ExamSurveillanceAssignments.objects.get_or_create(exam_session=exam, teacher=teacher)

        pdf_buffer = _build_exam_calendar_pdf(created_exams)
        pdf_buffer.name = 'exam_calendar.pdf'
        pdf_url = upload_pdf_to_gcs(pdf_buffer)

        return Response(
            {
                "message": "Exam calendar processed",
                "created_count": len(created_exams),
                "pdf_url": pdf_url,
            },
            status=201,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_pfe_subjects_from_excel(request):
    try:
        file = request.FILES.get('file')
        if not file or not file.name.endswith('.xlsx'):
            return Response({"error": "A valid .xlsx file is required"}, status=400)

        df = pd.read_excel(file)
        expected_columns = ['nom de sujet PFE', 'nom de l’étudiant', 'nom de l’encadreur']
        if not set(expected_columns).issubset(df.columns):
            expected_columns = ['sujet_pfe', 'etudiant', 'encadreur']
            if not set(expected_columns).issubset(df.columns):
                return Response({"error": "Invalid file format"}, status=400)

        created = 0
        for _, row in df.iterrows():
            title = str(row.get('nom de sujet PFE') or row.get('sujet_pfe'))
            student_name = str(row.get('nom de l’étudiant') or row.get('etudiant'))
            supervisor_name = str(row.get('nom de l’encadreur') or row.get('encadreur'))
            supervisor_user = Users.objects.filter(username=supervisor_name, role='teacher').first()
            supervisor = Teachers.objects.filter(user=supervisor_user).first()
            student_user = Users.objects.filter(username=student_name, role='student').first()
            student = Students.objects.filter(user=student_user).first() if student_user else None
            if not supervisor:
                continue
            PFESubjects.objects.create(
                title=title,
                student_name=student_name,
                student=student,
                supervisor=supervisor,
                created_by=request.user,
            )
            created += 1

        return Response({"message": "PFE subjects imported", "created_count": created}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def assign_pfe_jury(request):
    try:
        pfe_subject_id = request.data.get('pfe_subject_id')
        rapporteur_id = request.data.get('rapporteur_id')
        president_id = request.data.get('president_id')
        date_value = request.data.get('date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        room = request.data.get('room')

        pfe_subject = PFESubjects.objects.filter(id=pfe_subject_id).first()
        if not pfe_subject:
            return Response({"error": "PFE subject not found"}, status=404)

        slot = None
        if date_value and start_time and end_time and room:
            slot = PFEPresentationSlots.objects.create(
                presentation_date=date_value,
                start_time=start_time,
                end_time=end_time,
                room=room,
                created_by=request.user,
            )

        PFEJuryAssignments.objects.get_or_create(
            pfe_subject=pfe_subject,
            teacher=pfe_subject.supervisor,
            role=JuryRole.ENCADREUR,
            defaults={"slot": slot, "assigned_by": request.user},
        )

        for role, teacher_id in [(JuryRole.RAPPORTEUR, rapporteur_id), (JuryRole.PRESIDENT, president_id)]:
            if not teacher_id:
                continue
            teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
            teacher = Teachers.objects.filter(user=teacher_user).first()
            if teacher:
                PFEJuryAssignments.objects.get_or_create(
                    pfe_subject=pfe_subject,
                    teacher=teacher,
                    role=role,
                    defaults={"slot": slot, "assigned_by": request.user},
                )

        return Response({"message": "Jury assigned"}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def get_pfe_teacher_quota(request):
    teacher_id = request.query_params.get('teacher_id')
    if request.user.role == 'teacher':
        teacher = Teachers.objects.filter(user=request.user).first()
    else:
        if not teacher_id:
            return Response({"error": "teacher_id is required"}, status=400)
        teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
        teacher = Teachers.objects.filter(user=teacher_user).first()
    if not teacher:
        return Response({"error": "Teacher not found"}, status=404)

    assigned_count = PFEJuryAssignments.objects.filter(teacher=teacher).count()
    required_count = teacher.required_pfe_presentations
    return Response(
        {
            "teacher_id": str(teacher.user_id),
            "teacher_name": teacher.user.username,
            "supervised_subjects": required_count // 3,
            "required_presentations": required_count,
            "assigned_presentations": assigned_count,
            "remaining_presentations": max(required_count - assigned_count, 0),
        },
        status=200,
    )


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated,IsAdmin])
def resolve_absence(request):
    student_id=request.data.get("student_id")
    student =Students.objects.get(user=student_id)
    if not student :
        return Response({"error":"not found"},status=404)
    student.access_status=True
    student.save()
    return Response({"message":"student access status updated successfully"},status=200)


# ---------------------------------------------------------------------------
# Forum — detail (question + answers) and moderation endpoints
# ---------------------------------------------------------------------------

@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_forum_question_detail(request, question_id):
    """Return a single forum question with all its answers."""
    try:
        question = (
            ForumQuestions.objects
            .select_related('author')
            .prefetch_related('answers__author')
            .filter(id=question_id)
            .first()
        )
        if not question:
            return Response({"error": "Question not found"}, status=404)

        return Response(
            {
                "id": str(question.id),
                "title": question.title,
                "content": question.content,
                "author": question.author.username,
                "author_id": str(question.author_id),
                "author_role": question.author.role,
                "class_id": str(question.class_id_id) if question.class_id_id else None,
                "is_resolved": question.is_resolved,
                "created_at": str(question.created_at),
                "answers": [
                    {
                        "id": str(a.id),
                        "content": a.content,
                        "author": a.author.username,
                        "author_id": str(a.author_id),
                        "author_role": a.author.role,
                        "created_at": str(a.created_at),
                    }
                    for a in question.answers.order_by('created_at')
                ],
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_forum_answer(request, answer_id):
    """Delete an answer — owner or admin/teacher."""
    try:
        answer = ForumAnswers.objects.select_related('author').filter(id=answer_id).first()
        if not answer:
            return Response({"error": "Answer not found"}, status=404)

        is_owner = str(answer.author_id) == str(request.user.id)
        is_mod = request.user.role in (UserRole.ADMIN.value, UserRole.TEACHER.value)

        if not (is_owner or is_mod):
            return Response({"error": "Not allowed"}, status=403)

        answer.delete()
        return Response({"message": "Answer deleted"}, status=200)
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_forum_question(request, question_id):
    """Delete a forum question — owner or admin/teacher."""
    try:
        question = ForumQuestions.objects.select_related('author').filter(id=question_id).first()
        if not question:
            return Response({"error": "Question not found"}, status=404)

        is_owner = str(question.author_id) == str(request.user.id)
        is_mod = request.user.role in (UserRole.ADMIN.value, UserRole.TEACHER.value)

        if not (is_owner or is_mod):
            return Response({"error": "Not allowed"}, status=403)

        question.delete()
        return Response({"message": "Question deleted"}, status=200)
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


# ---------------------------------------------------------------------------
# Department announcements — admin creates, teachers + students in dept see them
# ---------------------------------------------------------------------------

@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_department_announcement(request):
    """Create a post broadcast to all teachers and students in a department."""
    try:
        department_id = request.data.get('department_id')
        title = str(request.data.get('title', '')).strip()
        content = str(request.data.get('content', '')).strip()

        if not title:
            return Response({"error": "title is required"}, status=400)
        if not content:
            return Response({"error": "content is required"}, status=400)

        department = None
        if department_id and department_id != 'global':
            department = Departments.objects.filter(id=department_id).first()
            if not department:
                return Response({"error": "Department not found"}, status=404)

        post = Posts.objects.create(
            author=request.user,
            department=department,
            title=title,
            content=content,
            url='',
            type=PostType.ANNOUNCEMENT,
        )

        return Response(
            {
                "message": "Announcement created",
                "post": {
                    "id": str(post.id),
                    "title": post.title,
                    "content": post.content,
                    "department_id": str(department.id) if department else None,
                    "department_name": department.name if department else "Global",
                    "created_at": str(post.created_at),
                },
            },
            status=201,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=['Admin Panel'], responses=GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_department_announcements(request):
    """List all department announcements, optionally filtered by department. Also includes global announcements."""
    try:
        from django.db.models import Q
        from api.models import UserRole, Teachers

        department_id = request.query_params.get('department_id')
        
        # Base query: Announcements have type='announcement' (implied by create logic, but we'll use department/global logic)
        qs = Posts.objects.select_related('author', 'department').order_by('-created_at')
        
        if request.user.role == UserRole.ADMIN.value:
            qs = qs.filter(Q(department__isnull=False) | Q(department__isnull=True, class_id__isnull=True))
            if department_id:
                qs = qs.filter(department_id=department_id)
        elif request.user.role == UserRole.TEACHER.value:
            teacher = Teachers.objects.filter(user=request.user).first()
            if teacher and teacher.department:
                qs = qs.filter(Q(department__name=teacher.department) | Q(department__isnull=True, class_id__isnull=True))
            else:
                qs = qs.filter(department__isnull=True, class_id__isnull=True)
        else:
            # Students only see global announcements here (or their class specific ones, but those are handled elsewhere)
            qs = qs.filter(department__isnull=True, class_id__isnull=True)

        return Response(
            {
                "announcements": [
                    {
                        "id": str(p.id),
                        "title": p.title,
                        "content": p.content,
                        "department_id": str(p.department_id) if p.department_id else None,
                        "department_name": p.department.name if p.department else "Global",
                        "author": p.author.username,
                        "created_at": str(p.created_at),
                    }
                    for p in qs
                ]
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)
