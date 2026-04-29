"""
Teacher-side presence tracking endpoints.

Schema reminder:
- `Schedules` is one slot per (teacher, class, day, time, subject).
- `Attendance` rows are unique per (student, schedule, session_date) and
  store a boolean `status` (true = present, false = absent). We treat a
  missing row as "no record yet".
"""
from datetime import date, datetime
from typing import Tuple

from django.utils import timezone
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.admin_panel.permissions import IsTeacher
from api.models import (
    Attendance,
    Classes,
    Schedules,
    Students,
    Teachers,
    TimetablePublications,
)
from api.utils.convert_to_french import convert_to_french


PRESENCE_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    400: OpenApiTypes.OBJECT,
    403: OpenApiTypes.OBJECT,
    404: OpenApiTypes.OBJECT,
    500: OpenApiTypes.OBJECT,
}


WARNING_THRESHOLD_PERCENT = 20.0


def _class_label(classe: Classes) -> str:
    return f"{classe.niveau}-{classe.classe_section}-{classe.classe_num}"


def _parse_session_date(value) -> date:
    if not value:
        return timezone.now().date()
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        return timezone.now().date()


def _percent(absences: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((absences / total) * 100, 1)


def _absence_summary(student: Students, class_id, subject: str) -> Tuple[int, int]:
    """
    Returns (sessions_total, absences) for a student on a given (class,
    subject). The denominator is the count of distinct attendance rows
    that already exist for any schedule with that class+subject (i.e.
    sessions actually held so far).
    """
    relevant_schedules = Schedules.objects.filter(
        class_id_id=class_id, subject=subject
    ).values_list("id", flat=True)
    attendance_qs = Attendance.objects.filter(
        student=student,
        schedule_id__in=list(relevant_schedules),
    )
    sessions_total = attendance_qs.count()
    absences = attendance_qs.filter(status=False).count()
    return sessions_total, absences


@extend_schema(tags=["Teacher Panel"], responses=PRESENCE_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsTeacher])
def get_today_classes(request):
    """All schedules of the calling teacher for today (publish-aware)."""
    try:
        teacher = Teachers.objects.filter(user=request.user).first()
        if not teacher:
            return Response({"error": "Teacher profile not found"}, status=404)

        publication = TimetablePublications.objects.order_by("-updated_at").first()
        if publication and not publication.is_published:
            return Response({"is_published": False, "schedules": []}, status=200)

        today_fr = convert_to_french(timezone.now().strftime("%A").lower())
        schedules = (
            Schedules.objects
            .select_related("class_id")
            .filter(teacher=teacher, day_of_week__iexact=today_fr)
            .order_by("start_time")
        )
        return Response(
            {
                "is_published": True,
                "today": today_fr,
                "schedules": [
                    {
                        "id": str(s.id),
                        "class_id": str(s.class_id.id),
                        "class_label": _class_label(s.class_id),
                        "subject": s.subject,
                        "room": s.room,
                        "start_time": str(s.start_time),
                        "end_time": str(s.end_time),
                    }
                    for s in schedules
                ],
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=["Teacher Panel"], responses=PRESENCE_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsTeacher])
def get_presence_students(request):
    """
    Roster for a given schedule + date, with the saved status (or null
    if not yet marked). Defaults to today.
    """
    try:
        schedule_id = request.query_params.get("schedule_id")
        if not schedule_id:
            return Response({"error": "schedule_id is required"}, status=400)

        teacher = Teachers.objects.filter(user=request.user).first()
        schedule = (
            Schedules.objects
            .select_related("class_id", "teacher")
            .filter(id=schedule_id, teacher=teacher)
            .first()
        )
        if not schedule:
            return Response({"error": "Schedule not found"}, status=404)

        session_date = _parse_session_date(request.query_params.get("date"))

        roster = (
            Students.objects
            .select_related("user", "class_id")
            .filter(class_id=schedule.class_id)
            .order_by("user__username")
        )
        existing = {
            row.student_id: row.status
            for row in Attendance.objects.filter(
                schedule=schedule,
                session_date=session_date,
            )
        }

        students_payload = [
            {
                "id": str(s.user_id),
                "username": s.user.username,
                "email": s.user.email,
                "ncin": s.ncin,
                # null until the teacher saves; UI defaults to "present".
                "presence": existing.get(s.user_id),
            }
            for s in roster
        ]

        return Response(
            {
                "schedule": {
                    "id": str(schedule.id),
                    "class_id": str(schedule.class_id.id),
                    "class_label": _class_label(schedule.class_id),
                    "subject": schedule.subject,
                    "room": schedule.room,
                    "day_of_week": schedule.day_of_week,
                    "start_time": str(schedule.start_time),
                    "end_time": str(schedule.end_time),
                },
                "session_date": str(session_date),
                "students": students_payload,
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=["Teacher Panel"], responses=PRESENCE_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsTeacher])
def get_class_presence_history(request):
    """
    Per-student summary for one (class, subject) the teacher teaches.
    Each item includes a `warning` flag set when absences > 20%.
    """
    try:
        class_id = request.query_params.get("class_id")
        subject = request.query_params.get("subject")
        if not class_id or not subject:
            return Response(
                {"error": "class_id and subject are required"},
                status=400,
            )

        teacher = Teachers.objects.filter(user=request.user).first()
        if not teacher:
            return Response({"error": "Teacher profile not found"}, status=404)

        # Confirm the teacher actually teaches this class+subject.
        teaches = Schedules.objects.filter(
            teacher=teacher, class_id_id=class_id, subject=subject
        ).exists()
        if not teaches:
            return Response(
                {"error": "You do not teach this class for this subject."},
                status=403,
            )

        roster = (
            Students.objects
            .select_related("user")
            .filter(class_id_id=class_id)
            .order_by("user__username")
        )

        items = []
        for student in roster:
            sessions_total, absences = _absence_summary(student, class_id, subject)
            percent = _percent(absences, sessions_total)
            items.append(
                {
                    "student_id": str(student.user_id),
                    "student_name": student.user.username,
                    "sessions_total": sessions_total,
                    "absences": absences,
                    "percent": percent,
                    "warning": percent > WARNING_THRESHOLD_PERCENT,
                }
            )

        items.sort(key=lambda x: (-x["percent"], x["student_name"]))

        return Response(
            {
                "subject": subject,
                "class_id": class_id,
                "threshold_percent": WARNING_THRESHOLD_PERCENT,
                "students": items,
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)
