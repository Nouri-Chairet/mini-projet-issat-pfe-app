from __future__ import annotations

import random
import csv
from datetime import datetime, timedelta

from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.admin_panel.permissions import IsAdmin
from collections import defaultdict

from api.admin_panel.pfe_scheduler import (
    _build_date_exception_map,
    _build_weekly_availability_map,
    _generate_candidate_slots,
    _is_teacher_free,
    _resolve_teacher_level_for_slot,
    _slot_key,
    persist_pfe_assignments,
    plan_pfe_assignments,
)
from api.models import (
    AvailabilityContext,
    AvailabilityLevel,
    CampaignStatus,
    Departments,
    JuryRole,
    PFECampaignRooms,
    PFECampaigns,
    PFECampaignTeacherSubmissions,
    PFEJuryAssignments,
    PFEPresentationSlots,
    PFESubjects,
    PFETeacherQuotaOverrides,
    StudentNotifications,
    Students,
    TeacherAvailabilities,
    TeacherAvailabilityDateExceptions,
    Teachers,
    UserRole,
    Users,
)

GENERIC_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    201: OpenApiTypes.OBJECT,
    400: OpenApiTypes.OBJECT,
    404: OpenApiTypes.OBJECT,
    500: OpenApiTypes.OBJECT,
}

WEEKDAYS_DEFAULT = ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi"]
ROOMS_DEFAULT = ["A1", "A2", "A3", "A4"]

ROLE_ORDER = {
    JuryRole.ENCADREUR: 0,
    JuryRole.RAPPORTEUR: 1,
    JuryRole.PRESIDENT: 2,
}


def _as_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _serialize_campaign(campaign: PFECampaigns) -> dict:
    rooms = list(
        PFECampaignRooms.objects.filter(campaign=campaign)
        .order_by("room_name")
        .values_list("room_name", flat=True)
    )
    return {
        "id": str(campaign.id),
        "department_id": str(campaign.department_id),
        "department_name": campaign.department.name,
        "name": campaign.name,
        "start_date": str(campaign.start_date),
        "end_date": str(campaign.end_date),
        "day_start_time": str(campaign.day_start_time),
        "day_end_time": str(campaign.day_end_time),
        "slot_duration_minutes": int(campaign.slot_duration_minutes),
        "break_duration_minutes": int(campaign.break_duration_minutes),
        "status": campaign.status,
        "weekdays": campaign.weekdays or [],
        "rooms": rooms,
        "daily_cap_per_teacher": campaign.daily_cap_per_teacher,
        "head_can_start": bool(campaign.head_can_start),
        "availability_open": bool(campaign.availability_open),
        "schedule_generated": bool(campaign.schedule_generated),
        "generated_at": campaign.generated_at.isoformat() if campaign.generated_at else None,
        "is_active": bool(campaign.is_active),
        "created_by": str(campaign.created_by_id) if campaign.created_by_id else None,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
        "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else None,
    }


def _campaign_teachers(campaign: PFECampaigns):
    return Teachers.objects.select_related("user").filter(
        department=campaign.department.name
    ).order_by("user__username")


def _campaign_subjects_query(campaign: PFECampaigns):
    return PFESubjects.objects.select_related(
        "supervisor",
        "supervisor__user",
        "student",
        "student__user",
    ).filter(supervisor__department=campaign.department.name)


def _time_overlaps(start_a, end_a, start_b, end_b) -> bool:
    return start_a < end_b and start_b < end_a


def _emit_student_notification(subject: PFESubjects, campaign: PFECampaigns, slot: PFEPresentationSlots):
    if not subject.student_id:
        return None

    return StudentNotifications.objects.update_or_create(
        student=subject.student,
        pfe_subject=subject,
        campaign=campaign,
        defaults={
            "slot": slot,
            "title": "PFE presentation scheduled",
            "message": (
                f"Your PFE '{subject.title}' is scheduled on "
                f"{slot.presentation_date} from {slot.start_time} to {slot.end_time} in room {slot.room}."
            ),
            "is_read": False,
            "read_at": None,
        },
    )


def _serialize_assignment_rows(subjects, assignment_rows):
    grouped = {}
    for row in assignment_rows:
        key = str(row.pfe_subject_id)
        grouped.setdefault(key, []).append(row)

    payload = []
    scheduled_subject_ids = set()
    for subject in subjects:
        rows = grouped.get(str(subject.id), [])
        rows = sorted(rows, key=lambda item: ROLE_ORDER.get(item.role, 99))
        slot = next((item.slot for item in rows if item.slot_id), None)
        if slot:
            scheduled_subject_ids.add(str(subject.id))

        payload.append(
            {
                "subject_id": str(subject.id),
                "subject_title": subject.title,
                "student_id": str(subject.student_id) if subject.student_id else None,
                "student_name": subject.student.user.username if subject.student_id else subject.student_name,
                "supervisor_id": str(subject.supervisor_id),
                "supervisor_name": subject.supervisor.user.username,
                "slot": (
                    {
                        "id": str(slot.id),
                        "date": str(slot.presentation_date),
                        "start_time": str(slot.start_time),
                        "end_time": str(slot.end_time),
                        "room": slot.room,
                    }
                    if slot
                    else None
                ),
                "jury": [
                    {
                        "assignment_id": str(item.id),
                        "teacher_id": str(item.teacher_id),
                        "teacher_name": item.teacher.user.username,
                        "role": item.role,
                        "assigned_at": item.assigned_at.isoformat() if item.assigned_at else None,
                    }
                    for item in rows
                ],
            }
        )

    return payload, scheduled_subject_ids


def _build_campaign_detail(campaign: PFECampaigns) -> dict:
    teachers = list(_campaign_teachers(campaign))
    submissions = {
        str(row.teacher_id): row
        for row in PFECampaignTeacherSubmissions.objects.filter(campaign=campaign)
    }

    teacher_progress = []
    submitted_count = 0
    for teacher in teachers:
        submission = submissions.get(str(teacher.user_id))
        if submission:
            submitted_count += 1
        teacher_progress.append(
            {
                "teacher_id": str(teacher.user_id),
                "teacher_name": teacher.user.username,
                "email": teacher.user.email,
                "submitted": bool(submission),
                "submitted_at": submission.submitted_at.isoformat() if submission else None,
                "entries_count": int(submission.entries_count) if submission else 0,
            }
        )

    subjects = list(_campaign_subjects_query(campaign).order_by("title"))
    subject_ids = [item.id for item in subjects]
    assignment_rows = list(
        PFEJuryAssignments.objects.filter(pfe_subject_id__in=subject_ids, slot__campaign=campaign)
        .select_related("teacher", "teacher__user", "slot")
        .order_by("slot__presentation_date", "slot__start_time", "assigned_at")
    )
    assignments_payload, scheduled_subject_ids = _serialize_assignment_rows(subjects, assignment_rows)

    unresolved = [
        {
            "subject_id": str(subject.id),
            "subject_title": subject.title,
            "student_name": subject.student.user.username if subject.student_id else subject.student_name,
            "supervisor_id": str(subject.supervisor_id),
            "supervisor_name": subject.supervisor.user.username,
            "reason": "manual_assignment_required",
        }
        for subject in subjects
        if str(subject.id) not in scheduled_subject_ids
    ]

    return {
        "campaign": _serialize_campaign(campaign),
        "progress": {
            "submitted_count": submitted_count,
            "total_count": len(teachers),
            "percent": int((submitted_count / len(teachers)) * 100) if teachers else 100,
        },
        "teachers_submitted": [row for row in teacher_progress if row["submitted"]],
        "teachers_pending": [row for row in teacher_progress if not row["submitted"]],
        "assignments": assignments_payload,
        "unresolved": unresolved,
    }


def _sync_campaign_status_after_assignment(campaign: PFECampaigns):
    campaign.status = (
        CampaignStatus.GENERATED
        if len(_build_campaign_detail(campaign)["unresolved"]) == 0
        else CampaignStatus.NEEDS_MANUAL_ASSIGNMENT
    )
    _sync_campaign_flags(campaign)
    if campaign.generated_at is None:
        campaign.generated_at = timezone.now()
    campaign.save(
        update_fields=[
            "status",
            "availability_open",
            "schedule_generated",
            "generated_at",
            "updated_at",
        ]
    )


def _campaign_assignment_state(campaign: PFECampaigns):
    assignment_rows = list(
        PFEJuryAssignments.objects.select_related("slot")
        .filter(slot__campaign=campaign, slot_id__isnull=False)
    )
    teacher_load = defaultdict(int)
    teacher_busy = defaultdict(list)
    used_slots = set()

    for assignment in assignment_rows:
        slot = assignment.slot
        teacher_id = str(assignment.teacher_id)
        teacher_load[teacher_id] += 1
        teacher_busy[teacher_id].append((slot.presentation_date, slot.start_time, slot.end_time))
        used_slots.add((str(slot.presentation_date), str(slot.start_time), str(slot.end_time), slot.room))

    return assignment_rows, teacher_load, teacher_busy, used_slots


def _pick_auto_fit_assignment(
    *,
    subject,
    slots,
    teachers,
    teacher_load,
    teacher_daily_load,
    teacher_busy,
    weekly_map,
    exception_map,
    daily_cap,
    require_available,
    enforce_daily_cap,
):
    supervisor_id = str(subject.supervisor_id)
    non_supervisors = [teacher for teacher in teachers if str(teacher.user_id) != supervisor_id]

    best_choice = None
    best_score = None

    for slot_index, slot in enumerate(slots):
        supervisor_level = _resolve_teacher_level_for_slot(
            supervisor_id, slot, weekly_map, exception_map
        )
        if require_available and supervisor_level == AvailabilityLevel.UNAVAILABLE:
            continue
        if not _is_teacher_free(teacher_busy, supervisor_id, slot):
            continue

        day_key = str(slot.presentation_date)
        if (
            enforce_daily_cap
            and daily_cap is not None
            and teacher_daily_load[(supervisor_id, day_key)] >= daily_cap
        ):
            continue

        eligible_others = []
        for teacher in non_supervisors:
            teacher_id = str(teacher.user_id)
            teacher_level = _resolve_teacher_level_for_slot(
                teacher_id, slot, weekly_map, exception_map
            )
            if require_available and teacher_level == AvailabilityLevel.UNAVAILABLE:
                continue
            if not _is_teacher_free(teacher_busy, teacher_id, slot):
                continue
            if (
                enforce_daily_cap
                and daily_cap is not None
                and teacher_daily_load[(teacher_id, day_key)] >= daily_cap
            ):
                continue

            availability_penalty = 0 if teacher_level != AvailabilityLevel.UNAVAILABLE else 100
            eligible_others.append(
                (
                    teacher_daily_load[(teacher_id, day_key)],
                    teacher_load[teacher_id],
                    availability_penalty,
                    teacher.user.username.lower(),
                    teacher,
                )
            )

        if len(eligible_others) < 2:
            continue

        eligible_others.sort(key=lambda item: (item[0], item[1], item[2], item[3]))
        rapporteur = eligible_others[0][4]
        president = next(
            (item[4] for item in eligible_others[1:] if item[4].user_id != rapporteur.user_id),
            None,
        )
        if president is None:
            continue

        rapporteur_id = str(rapporteur.user_id)
        president_id = str(president.user_id)
        rapporteur_level = _resolve_teacher_level_for_slot(
            rapporteur_id, slot, weekly_map, exception_map
        )
        president_level = _resolve_teacher_level_for_slot(
            president_id, slot, weekly_map, exception_map
        )

        availability_penalty = 0
        if supervisor_level == AvailabilityLevel.UNAVAILABLE:
            availability_penalty += 100
        if rapporteur_level == AvailabilityLevel.UNAVAILABLE:
            availability_penalty += 100
        if president_level == AvailabilityLevel.UNAVAILABLE:
            availability_penalty += 100

        score = (
            availability_penalty,
            teacher_daily_load[(supervisor_id, day_key)]
            + teacher_daily_load[(rapporteur_id, day_key)]
            + teacher_daily_load[(president_id, day_key)],
            teacher_load[supervisor_id]
            + teacher_load[rapporteur_id]
            + teacher_load[president_id],
            slot_index,
        )
        if best_score is None or score < best_score:
            best_score = score
            best_choice = (slot, rapporteur, president)

    return best_choice


def _latest_campaign_for_department(department: Departments) -> PFECampaigns | None:
    return (
        PFECampaigns.objects.select_related("department")
        .filter(department=department)
        .order_by("-is_active", "-updated_at")
        .first()
    )


def _parse_time(value: str):
    as_text = str(value).strip()
    fmt = "%H:%M:%S" if len(as_text) > 5 else "%H:%M"
    return datetime.strptime(as_text, fmt).time()


def _parse_date(value: str):
    return datetime.strptime(str(value).strip(), "%Y-%m-%d").date()


def _sync_campaign_flags(campaign: PFECampaigns):
    campaign.availability_open = campaign.status == CampaignStatus.COLLECTING_AVAILABILITY
    campaign.schedule_generated = campaign.status == CampaignStatus.GENERATED


def _compute_availability_counts(target: int, total_slots: int, rng: random.Random) -> tuple[int, int]:
    if target == 6:
        preferred_min = 10
        preferred_max = 12
        available_min = 6
        available_max = 10
    else:
        preferred_min = max(target + 4, 10)
        preferred_max = max(preferred_min, target + 12)
        available_min = max(target, 6)
        available_max = max(available_min, target + 10)

    preferred_max = min(preferred_max, total_slots)
    preferred_min = min(preferred_min, preferred_max)
    preferred_count = rng.randint(preferred_min, preferred_max)

    remaining = max(0, total_slots - preferred_count)
    available_max = min(available_max, remaining)
    available_min = min(available_min, available_max)
    available_count = rng.randint(available_min, available_max) if available_max >= 0 else 0
    return preferred_count, available_count


@extend_schema(tags=["Admin Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def list_pfe_session_departments(request):
    rows = []
    departments = Departments.objects.select_related("head", "head__user").order_by("name")
    for department in departments:
        campaign = _latest_campaign_for_department(department)
        rows.append(
            {
                "department_id": str(department.id),
                "department_name": department.name,
                "head": (
                    {
                        "id": str(department.head.user_id),
                        "username": department.head.user.username,
                        "email": department.head.user.email,
                    }
                    if department.head
                    else None
                ),
                "campaign": _serialize_campaign(campaign) if campaign else None,
            }
        )
    return Response({"departments": rows}, status=200)


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def unlock_pfe_session_for_head(request):
    department_id = request.data.get("department_id")
    if not department_id:
        return Response({"error": "department_id is required"}, status=400)

    department = Departments.objects.select_related("head", "head__user").filter(id=department_id).first()
    if not department:
        return Response({"error": "Department not found"}, status=404)
    if not department.head:
        return Response({"error": "Department has no head assigned"}, status=400)

    campaign = _latest_campaign_for_department(department)
    default_start = timezone.localdate() + timedelta(days=1)
    default_end = default_start + timedelta(days=13)

    with transaction.atomic():
        if campaign is None:
            campaign = PFECampaigns.objects.create(
                department=department,
                name=f"PFE Session {department.name}",
                start_date=default_start,
                end_date=default_end,
                day_start_time=_parse_time("08:00"),
                day_end_time=_parse_time("16:00"),
                slot_duration_minutes=60,
                break_duration_minutes=15,
                weekdays=WEEKDAYS_DEFAULT,
                daily_cap_per_teacher=3,
                head_can_start=True,
                availability_open=False,
                schedule_generated=False,
                generated_at=None,
                is_active=True,
                created_by=request.user,
            )
            PFECampaignRooms.objects.bulk_create(
                [
                    PFECampaignRooms(campaign=campaign, room_name="A1"),
                    PFECampaignRooms(campaign=campaign, room_name="A2"),
                ]
            )
        else:
            campaign.head_can_start = True
            campaign.availability_open = False
            campaign.schedule_generated = False
            campaign.generated_at = None
            campaign.is_active = True
            campaign.save(
                update_fields=[
                    "head_can_start",
                    "availability_open",
                    "schedule_generated",
                    "generated_at",
                    "is_active",
                    "updated_at",
                ]
            )

        PFECampaigns.objects.filter(department=department).exclude(id=campaign.id).update(is_active=False)

    return Response(
        {
            "message": "Department head unlocked to start PFE date collection",
            "department": {
                "id": str(department.id),
                "name": department.name,
                "head": {
                    "id": str(department.head.user_id),
                    "username": department.head.user.username,
                },
            },
            "campaign": _serialize_campaign(campaign),
        },
        status=200,
    )


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def seed_pfe_session_demo(request):
    department_name = str(request.data.get("department_name") or "PFE Demo Department").strip()

    def _ensure_user(email: str, username: str, password: str, role: str) -> Users:
        user, created = Users.objects.get_or_create(
            email=email,
            defaults={"username": username, "password": password, "role": role},
        )
        dirty = False
        if user.username != username:
            user.username = username
            dirty = True
        if user.role != role:
            user.role = role
            dirty = True
        # Keep demo credentials deterministic.
        user.password = password
        if created:
            user.save()
        else:
            fields = ["username", "role", "password"]
            if dirty:
                user.save(update_fields=fields)
            else:
                user.save(update_fields=["password"])
        return user

    def _ensure_teacher(
        *,
        email: str,
        username: str,
        password: str,
        department: str,
        ncin: str,
        age: int,
    ) -> Teachers:
        user = _ensure_user(email=email, username=username, password=password, role=UserRole.TEACHER)
        teacher, _ = Teachers.objects.get_or_create(
            user=user,
            defaults={"department": department, "ncin": ncin, "age": age},
        )
        updates = []
        if teacher.department != department:
            teacher.department = department
            updates.append("department")
        if updates:
            teacher.save(update_fields=updates)
        return teacher

    def _ensure_student(email: str, username: str, password: str) -> Students:
        user = _ensure_user(email=email, username=username, password=password, role=UserRole.STUDENT)
        student, _ = Students.objects.get_or_create(
            user=user,
            defaults={"class_id": None, "parent_contact": None, "access_status": True},
        )
        return student

    with transaction.atomic():
        department, _ = Departments.objects.get_or_create(name=department_name)

        head_teacher = _ensure_teacher(
            email="chef.department.demo@issat.local",
            username="Chef Department Demo",
            password="DemoPfe123",
            department=department.name,
            ncin="92000001",
            age=45,
        )
        main_teacher = _ensure_teacher(
            email="teacher.demo@issat.local",
            username="Teacher Demo",
            password="DemoPfe123",
            department=department.name,
            ncin="92000002",
            age=38,
        )
        jury_one = _ensure_teacher(
            email="jury.one.demo@issat.local",
            username="Jury One Demo",
            password="DemoPfe123",
            department=department.name,
            ncin="92000003",
            age=41,
        )
        jury_two = _ensure_teacher(
            email="jury.two.demo@issat.local",
            username="Jury Two Demo",
            password="DemoPfe123",
            department=department.name,
            ncin="92000004",
            age=40,
        )

        department.head = head_teacher
        department.save(update_fields=["head"])

        start_date = timezone.localdate() + timedelta(days=1)
        end_date = start_date + timedelta(days=14)

        campaign, _ = PFECampaigns.objects.update_or_create(
            department=department,
            name=f"PFE Session Demo {department.name}",
            defaults={
                "start_date": start_date,
                "end_date": end_date,
                "day_start_time": _parse_time("08:00"),
                "day_end_time": _parse_time("16:00"),
                "slot_duration_minutes": 60,
                "break_duration_minutes": 0,
                "weekdays": WEEKDAYS_DEFAULT,
                "daily_cap_per_teacher": 3,
                "head_can_start": True,
                "availability_open": False,
                "schedule_generated": False,
                "generated_at": None,
                "is_active": True,
                "created_by": request.user,
            },
        )
        PFECampaigns.objects.filter(department=department).exclude(id=campaign.id).update(is_active=False)

        PFECampaignRooms.objects.filter(campaign=campaign).delete()
        PFECampaignRooms.objects.bulk_create(
            [
                PFECampaignRooms(campaign=campaign, room_name="A1"),
                PFECampaignRooms(campaign=campaign, room_name="A2"),
            ]
        )

        TeacherAvailabilities.objects.filter(
            teacher__in=[head_teacher, jury_one, jury_two],
            context=AvailabilityContext.PFE,
            campaign=campaign,
        ).delete()
        default_availabilities = []
        for teacher in [head_teacher, jury_one, jury_two]:
            for day in WEEKDAYS_DEFAULT:
                default_availabilities.append(
                    TeacherAvailabilities(
                        teacher=teacher,
                        context=AvailabilityContext.PFE,
                        campaign=campaign,
                        day_of_week=day,
                        start_time=_parse_time("08:00"),
                        end_time=_parse_time("16:00"),
                        level=AvailabilityLevel.PREFERRED,
                    )
                )
        TeacherAvailabilities.objects.bulk_create(default_availabilities)

        PFEJuryAssignments.objects.filter(pfe_subject__supervisor=main_teacher).delete()
        PFESubjects.objects.filter(supervisor=main_teacher, title__startswith="Demo PFE ").delete()

        demo_students = [
            _ensure_student("student.demo.one@issat.local", "Student Demo One", "DemoPfe123"),
            _ensure_student("student.demo.two@issat.local", "Student Demo Two", "DemoPfe123"),
            _ensure_student("student.demo.three@issat.local", "Student Demo Three", "DemoPfe123"),
        ]

        PFESubjects.objects.bulk_create(
            [
                PFESubjects(
                    title=f"Demo PFE {idx + 1}",
                    student_name=student.user.username,
                    student=student,
                    supervisor=main_teacher,
                    created_by=request.user,
                )
                for idx, student in enumerate(demo_students)
            ]
        )

    return Response(
        {
            "message": "Demo PFE session data seeded successfully",
            "department": {
                "id": str(department.id),
                "name": department.name,
            },
            "campaign": _serialize_campaign(campaign),
            "accounts": {
                "head": {
                    "email": "chef.department.demo@issat.local",
                    "password": "DemoPfe123",
                    "role": "teacher_head",
                    "username": head_teacher.user.username,
                },
                "teacher": {
                    "email": "teacher.demo@issat.local",
                    "password": "DemoPfe123",
                    "role": "teacher",
                    "username": main_teacher.user.username,
                    "assigned_supervised_pfe_count": 3,
                },
            },
        },
        status=201,
    )


@extend_schema(tags=["Admin Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def list_pfe_subjects(request):
    department_id = request.query_params.get("department_id")
    query = PFESubjects.objects.select_related(
        "supervisor",
        "supervisor__user",
        "student",
        "student__user",
    ).order_by("-created_at")
    if department_id:
        department = Departments.objects.filter(id=department_id).first()
        if not department:
            return Response({"error": "Department not found"}, status=404)
        query = query.filter(supervisor__department=department.name)

    return Response(
        {
            "subjects": [
                {
                    "id": str(item.id),
                    "title": item.title,
                    "student_id": str(item.student_id) if item.student_id else None,
                    "student_name": item.student.user.username if item.student_id else item.student_name,
                    "student_email": item.student.user.email if item.student_id else None,
                    "supervisor_id": str(item.supervisor_id),
                    "supervisor_name": item.supervisor.user.username,
                    "created_at": item.created_at.isoformat() if item.created_at else None,
                }
                for item in query
            ]
        },
        status=200,
    )


@extend_schema(tags=["Admin Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def list_pfe_students(request):
    unassigned_only = _as_bool(request.query_params.get("unassigned_only"), False)

    assigned_ids = set(
        PFESubjects.objects.filter(student_id__isnull=False).values_list("student_id", flat=True)
    )
    assigned_ids_str = {str(item) for item in assigned_ids}

    query = Students.objects.select_related("user", "class_id").order_by("user__username")
    if unassigned_only and assigned_ids:
        query = query.exclude(user_id__in=list(assigned_ids))

    payload = []
    for row in query:
        class_label = None
        if row.class_id:
            class_label = f"{row.class_id.niveau}-{row.class_id.classe_section}-{row.class_id.classe_num}"
        payload.append(
            {
                "id": str(row.user_id),
                "username": row.user.username,
                "email": row.user.email,
                "class_id": str(row.class_id_id) if row.class_id_id else None,
                "class_label": class_label,
                "assigned_to_pfe": str(row.user_id) in assigned_ids_str,
            }
        )

    return Response({"students": payload}, status=200)


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def assign_student_to_pfe_subject(request):
    subject_id = request.data.get("subject_id")
    student_id = request.data.get("student_id")

    if not subject_id:
        return Response({"error": "subject_id is required"}, status=400)

    subject = PFESubjects.objects.select_related("student", "student__user").filter(id=subject_id).first()
    if not subject:
        return Response({"error": "PFE subject not found"}, status=404)

    # Empty student_id clears assignment while preserving legacy student_name text.
    if student_id in (None, "", "null"):
        subject.student = None
        subject.save(update_fields=["student"])
        return Response(
            {
                "message": "Student unassigned from subject",
                "subject": {
                    "id": str(subject.id),
                    "student_id": None,
                    "student_name": subject.student_name,
                },
            },
            status=200,
        )

    student = Students.objects.select_related("user").filter(user_id=student_id).first()
    if not student:
        return Response({"error": "Student not found"}, status=404)

    existing = PFESubjects.objects.filter(student=student).exclude(id=subject.id).first()
    if existing:
        return Response(
            {
                "error": "Student is already assigned to another PFE subject",
                "assigned_subject_id": str(existing.id),
            },
            status=400,
        )

    subject.student = student
    subject.student_name = student.user.username
    subject.save(update_fields=["student", "student_name"])

    return Response(
        {
            "message": "Student assigned to subject",
            "subject": {
                "id": str(subject.id),
                "student_id": str(student.user_id),
                "student_name": student.user.username,
            },
        },
        status=200,
    )


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def upsert_pfe_campaign(request):
    campaign_id = request.data.get("campaign_id")
    department_id = request.data.get("department_id")

    campaign = PFECampaigns.objects.filter(id=campaign_id).first() if campaign_id else None
    if campaign_id and not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    if campaign:
        department = campaign.department
    else:
        if not department_id:
            return Response({"error": "department_id is required"}, status=400)
        department = Departments.objects.filter(id=department_id).first()
        if not department:
            return Response({"error": "Department not found"}, status=404)

    rooms = [str(room).strip() for room in (request.data.get("rooms") or []) if str(room).strip()]
    if not rooms:
        return Response({"error": "At least one room is required"}, status=400)

    weekdays = request.data.get("weekdays") or WEEKDAYS_DEFAULT

    payload = {
        "department": department,
        "name": request.data.get("name") or f"PFE Campaign {department.name}",
        "start_date": request.data.get("start_date"),
        "end_date": request.data.get("end_date"),
        "day_start_time": _parse_time(request.data.get("day_start_time", "08:00")),
        "day_end_time": _parse_time(request.data.get("day_end_time", "16:00")),
        "slot_duration_minutes": int(request.data.get("slot_duration_minutes", 60)),
        "break_duration_minutes": int(request.data.get("break_duration_minutes", 15)),
        "status": request.data.get("status") or CampaignStatus.DRAFT,
        "weekdays": weekdays,
        "daily_cap_per_teacher": request.data.get("daily_cap_per_teacher"),
        "head_can_start": _as_bool(request.data.get("head_can_start"), True),
        "availability_open": _as_bool(request.data.get("availability_open"), False),
        "schedule_generated": _as_bool(request.data.get("schedule_generated"), False),
        "generated_at": request.data.get("generated_at") or None,
        "is_active": _as_bool(request.data.get("is_active"), False),
        "created_by": request.user,
    }

    with transaction.atomic():
        if campaign is None:
            campaign = PFECampaigns(**payload)
            _sync_campaign_flags(campaign)
            campaign.save()
        else:
            for key, value in payload.items():
                setattr(campaign, key, value)
            _sync_campaign_flags(campaign)
            campaign.save()

        PFECampaignRooms.objects.filter(campaign=campaign).delete()
        PFECampaignRooms.objects.bulk_create(
            [PFECampaignRooms(campaign=campaign, room_name=room) for room in sorted(set(rooms))]
        )

        if campaign.is_active:
            PFECampaigns.objects.filter(department=campaign.department).exclude(id=campaign.id).update(is_active=False)

    return Response({"campaign": _serialize_campaign(campaign)}, status=200)


@extend_schema(tags=["Admin Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def get_pfe_campaign(request):
    campaign_id = request.query_params.get("campaign_id")
    department_id = request.query_params.get("department_id")

    campaign = None
    if campaign_id:
        campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    elif department_id:
        campaign = (
            PFECampaigns.objects.select_related("department")
            .filter(department_id=department_id)
            .order_by("-is_active", "-updated_at")
            .first()
        )
    else:
        campaign = PFECampaigns.objects.select_related("department").order_by("-is_active", "-updated_at").first()

    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    return Response({"campaign": _serialize_campaign(campaign)}, status=200)


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def manage_pfe_campaigns(request):
    if request.method == "GET":
        campaigns = list(
            PFECampaigns.objects.select_related("department")
            .order_by("-created_at", "-updated_at")
        )
        cards = []
        for campaign in campaigns:
            detail = _build_campaign_detail(campaign)
            cards.append(
                {
                    **detail["campaign"],
                    "progress": detail["progress"],
                    "unresolved_count": len(detail["unresolved"]),
                    "scheduled_count": sum(1 for row in detail["assignments"] if row["slot"]),
                }
            )
        return Response({"campaigns": cards}, status=200)

    department_id = request.data.get("department_id")
    if not department_id:
        return Response({"error": "department_id is required"}, status=400)

    department = Departments.objects.filter(id=department_id).first()
    if not department:
        return Response({"error": "Department not found"}, status=404)

    rooms = [str(room).strip() for room in (request.data.get("rooms") or []) if str(room).strip()]
    if not rooms:
        return Response({"error": "At least one room is required"}, status=400)

    try:
        start_date = _parse_date(request.data.get("start_date"))
        end_date = _parse_date(request.data.get("end_date"))
        day_start_time = _parse_time(request.data.get("day_start_time", "08:00"))
        day_end_time = _parse_time(request.data.get("day_end_time", "16:00"))
    except Exception:
        return Response({"error": "Invalid date/time format"}, status=400)

    if end_date < start_date:
        return Response({"error": "end_date must be after or equal to start_date"}, status=400)
    if day_end_time <= day_start_time:
        return Response({"error": "day_end_time must be after day_start_time"}, status=400)

    campaign = PFECampaigns(
        department=department,
        name=request.data.get("name") or f"PFE Campaign {department.name}",
        start_date=start_date,
        end_date=end_date,
        day_start_time=day_start_time,
        day_end_time=day_end_time,
        slot_duration_minutes=int(request.data.get("slot_duration_minutes", 60)),
        break_duration_minutes=int(request.data.get("break_duration_minutes", 15)),
        weekdays=request.data.get("weekdays") or WEEKDAYS_DEFAULT,
        daily_cap_per_teacher=request.data.get("daily_cap_per_teacher") or 3,
        status=CampaignStatus.COLLECTING_AVAILABILITY,
        head_can_start=False,
        generated_at=None,
        is_active=True,
        created_by=request.user,
    )
    _sync_campaign_flags(campaign)

    with transaction.atomic():
        campaign.save()
        PFECampaignRooms.objects.bulk_create(
            [PFECampaignRooms(campaign=campaign, room_name=room) for room in sorted(set(rooms))]
        )
        PFECampaigns.objects.filter(department=department).exclude(id=campaign.id).update(is_active=False)

    return Response(
        {
            "message": "Campaign created and availability collection opened",
            "campaign": _serialize_campaign(campaign),
        },
        status=201,
    )


@extend_schema(tags=["Admin Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def get_manage_pfe_campaign_detail(request):
    campaign_id = request.query_params.get("campaign_id")
    if not campaign_id:
        return Response({"error": "campaign_id is required"}, status=400)

    campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    return Response(_build_campaign_detail(campaign), status=200)


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def generate_manage_pfe_campaign_schedule(request):
    campaign_id = request.data.get("campaign_id")
    campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    teachers = list(_campaign_teachers(campaign))
    submitted_teacher_ids = set(
        PFECampaignTeacherSubmissions.objects.filter(campaign=campaign).values_list("teacher_id", flat=True)
    )
    pending = [teacher for teacher in teachers if teacher.user_id not in submitted_teacher_ids]
    if pending:
        return Response(
            {
                "error": "Not all concerned teachers have submitted availability",
                "pending_teachers": [
                    {"teacher_id": str(teacher.user_id), "teacher_name": teacher.user.username}
                    for teacher in pending
                ],
            },
            status=400,
        )

    plan = plan_pfe_assignments(campaign=campaign)
    with transaction.atomic():
        persist = persist_pfe_assignments(campaign=campaign, plan=plan, assigned_by=request.user)
        slot_map = {
            str(assignment.pfe_subject_id): assignment.slot
            for assignment in PFEJuryAssignments.objects.select_related("slot").filter(
                pfe_subject_id__in=[row["subject_id"] for row in plan.get("assigned", [])],
                role=JuryRole.ENCADREUR,
                slot__campaign=campaign,
            )
        }
        for subject in _campaign_subjects_query(campaign).filter(id__in=list(slot_map.keys())):
            slot = slot_map.get(str(subject.id))
            if slot:
                _emit_student_notification(subject, campaign, slot)

        campaign.status = (
            CampaignStatus.NEEDS_MANUAL_ASSIGNMENT
            if plan.get("unresolved")
            else CampaignStatus.GENERATED
        )
        campaign.generated_at = timezone.now()
        _sync_campaign_flags(campaign)
        campaign.save(
            update_fields=[
                "status",
                "availability_open",
                "schedule_generated",
                "generated_at",
                "updated_at",
            ]
        )

    detail = _build_campaign_detail(campaign)
    return Response(
        {
            "message": "Schedule generation completed",
            "plan": plan,
            "persist": persist,
            **detail,
        },
        status=200,
    )


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def manual_assign_pfe_presentation(request):
    campaign_id = request.data.get("campaign_id")
    subject_id = request.data.get("subject_id")
    rapporteur_id = request.data.get("rapporteur_id")
    president_id = request.data.get("president_id")
    encadreur_id = request.data.get("encadreur_id")
    room = str(request.data.get("room") or "").strip()

    if not all([campaign_id, subject_id, rapporteur_id, president_id, room]):
        return Response(
            {
                "error": "campaign_id, subject_id, room, rapporteur_id and president_id are required"
            },
            status=400,
        )

    campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    subject = _campaign_subjects_query(campaign).filter(id=subject_id).first()
    if not subject:
        return Response({"error": "PFE subject not found for this campaign"}, status=404)

    try:
        presentation_date = _parse_date(request.data.get("presentation_date"))
        start_time = _parse_time(request.data.get("start_time"))
        end_time = _parse_time(request.data.get("end_time"))
    except Exception:
        return Response({"error": "Invalid date/time format"}, status=400)

    if end_time <= start_time:
        return Response({"error": "end_time must be after start_time"}, status=400)
    if presentation_date < campaign.start_date or presentation_date > campaign.end_date:
        return Response({"error": "presentation_date must be inside campaign range"}, status=400)
    if room not in set(PFECampaignRooms.objects.filter(campaign=campaign).values_list("room_name", flat=True)):
        return Response({"error": "Room is not available for this campaign"}, status=400)

    teacher_ids = [encadreur_id or str(subject.supervisor_id), rapporteur_id, president_id]
    if len(set(teacher_ids)) != 3:
        return Response(
            {
                "error": "Jury members must be three distinct teachers",
                "details": {
                    "encadreur_id": teacher_ids[0],
                    "rapporteur_id": teacher_ids[1],
                    "president_id": teacher_ids[2],
                },
            },
            status=400,
        )

    teachers = {
        str(teacher.user_id): teacher
        for teacher in _campaign_teachers(campaign).filter(user_id__in=teacher_ids)
    }
    if len(teachers) != 3:
        return Response({"error": "All jury members must belong to the campaign department"}, status=400)

    conflicting_room_slots = PFEPresentationSlots.objects.filter(
        presentation_date=presentation_date,
        room=room,
    ).exclude(
        id__in=PFEJuryAssignments.objects.filter(pfe_subject=subject, slot_id__isnull=False).values_list("slot_id", flat=True)
    )
    for existing_slot in conflicting_room_slots:
        if _time_overlaps(start_time, end_time, existing_slot.start_time, existing_slot.end_time):
            return Response(
                {
                    "error": "Room conflict detected",
                    "conflict": {
                        "date": str(existing_slot.presentation_date),
                        "start_time": str(existing_slot.start_time),
                        "end_time": str(existing_slot.end_time),
                        "room": existing_slot.room,
                    },
                },
                status=400,
            )

    for teacher_id in teacher_ids:
        existing_assignments = PFEJuryAssignments.objects.select_related("slot").filter(
            teacher_id=teacher_id,
            slot__presentation_date=presentation_date,
            slot_id__isnull=False,
        ).exclude(pfe_subject=subject)
        for assignment in existing_assignments:
            if _time_overlaps(start_time, end_time, assignment.slot.start_time, assignment.slot.end_time):
                return Response(
                    {
                        "error": "Teacher overlap detected",
                        "conflict": {
                            "teacher_id": teacher_id,
                            "teacher_name": teachers[teacher_id].user.username,
                            "subject_id": str(assignment.pfe_subject_id),
                        },
                    },
                    status=400,
                )

    current_slot_ids = list(
        PFEJuryAssignments.objects.filter(pfe_subject=subject, slot_id__isnull=False).values_list("slot_id", flat=True)
    )

    with transaction.atomic():
        slot = PFEPresentationSlots.objects.create(
            presentation_date=presentation_date,
            start_time=start_time,
            end_time=end_time,
            room=room,
            campaign=campaign,
            created_by=request.user,
        )

        for role, teacher_id in [
            (JuryRole.ENCADREUR, encadreur_id or str(subject.supervisor_id)),
            (JuryRole.RAPPORTEUR, rapporteur_id),
            (JuryRole.PRESIDENT, president_id),
        ]:
            PFEJuryAssignments.objects.update_or_create(
                pfe_subject=subject,
                role=role,
                defaults={
                    "teacher": teachers[teacher_id],
                    "slot": slot,
                    "assigned_by": request.user,
                },
            )

        for slot_id in current_slot_ids:
            if slot_id and not PFEJuryAssignments.objects.filter(slot_id=slot_id).exists():
                PFEPresentationSlots.objects.filter(id=slot_id).delete()

        _emit_student_notification(subject, campaign, slot)

        _sync_campaign_status_after_assignment(campaign)

    return Response(
        {
            "message": "Presentation assigned successfully",
            **_build_campaign_detail(campaign),
        },
        status=200,
    )


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def auto_fit_unresolved_presentations(request):
    campaign_id = request.data.get("campaign_id")
    campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    detail = _build_campaign_detail(campaign)
    unresolved_ids = [row["subject_id"] for row in detail["unresolved"]]
    if not unresolved_ids:
        return Response({"message": "No unresolved presentations left", **detail}, status=200)

    unresolved_subjects = list(
        _campaign_subjects_query(campaign).filter(id__in=unresolved_ids).order_by("title")
    )
    teachers = list(_campaign_teachers(campaign))
    teachers_by_id = {str(teacher.user_id): teacher for teacher in teachers}
    weekly_map = _build_weekly_availability_map(campaign, teachers)
    exception_map = _build_date_exception_map(campaign, teachers)
    _, teacher_load, teacher_busy, used_slots = _campaign_assignment_state(campaign)
    teacher_daily_load = defaultdict(int)
    for teacher_id, busy_rows in teacher_busy.items():
        for busy_date, _busy_start, _busy_end in busy_rows:
            teacher_daily_load[(teacher_id, str(busy_date))] += 1

    candidates = _generate_candidate_slots(campaign)
    remaining_slots = [slot for slot in candidates if _slot_key(slot) not in used_slots]
    if not remaining_slots:
        return Response({"error": "No free slots remain for unresolved presentations"}, status=400)

    created_subject_ids = []
    daily_cap = campaign.daily_cap_per_teacher if campaign.daily_cap_per_teacher else None

    with transaction.atomic():
        for subject in unresolved_subjects:
            selected = None

            for require_available, enforce_daily_cap in [
                (True, True),
                (True, False),
                (False, True),
                (False, False),
            ]:
                candidate = _pick_auto_fit_assignment(
                    subject=subject,
                    slots=remaining_slots,
                    teachers=teachers,
                    teacher_load=teacher_load,
                    teacher_daily_load=teacher_daily_load,
                    teacher_busy=teacher_busy,
                    weekly_map=weekly_map,
                    exception_map=exception_map,
                    daily_cap=daily_cap,
                    require_available=require_available,
                    enforce_daily_cap=enforce_daily_cap,
                )
                if candidate is not None:
                    slot, rapporteur, president = candidate
                    selected = (
                        slot,
                        teachers_by_id[str(subject.supervisor_id)],
                        rapporteur,
                        president,
                    )
                    break

            if selected is None:
                continue

            slot, supervisor, rapporteur, president = selected
            slot_row = PFEPresentationSlots.objects.create(
                presentation_date=slot.presentation_date,
                start_time=slot.start_time,
                end_time=slot.end_time,
                room=slot.room,
                campaign=campaign,
                created_by=request.user,
            )

            for role, teacher in [
                (JuryRole.ENCADREUR, supervisor),
                (JuryRole.RAPPORTEUR, rapporteur),
                (JuryRole.PRESIDENT, president),
            ]:
                PFEJuryAssignments.objects.update_or_create(
                    pfe_subject=subject,
                    role=role,
                    defaults={
                        "teacher": teacher,
                        "slot": slot_row,
                        "assigned_by": request.user,
                    },
                )
                teacher_load[str(teacher.user_id)] += 1
                teacher_daily_load[(str(teacher.user_id), str(slot.presentation_date))] += 1
                teacher_busy[str(teacher.user_id)].append(
                    (slot.presentation_date, slot.start_time, slot.end_time)
                )

            used_slots.add(_slot_key(slot))
            remaining_slots = [candidate for candidate in remaining_slots if _slot_key(candidate) != _slot_key(slot)]
            _emit_student_notification(subject, campaign, slot_row)
            created_subject_ids.append(str(subject.id))

        _sync_campaign_status_after_assignment(campaign)

    refreshed_detail = _build_campaign_detail(campaign)
    unresolved_after = len(refreshed_detail["unresolved"])
    return Response(
        {
            "message": (
                f"Auto-fit assigned {len(created_subject_ids)} leftover presentation(s). "
                f"{unresolved_after} still unresolved."
            ),
            "assigned_subject_ids": created_subject_ids,
            **refreshed_detail,
        },
        status=200,
    )


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def activate_pfe_campaign(request):
    campaign_id = request.data.get("campaign_id")
    campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    with transaction.atomic():
        PFECampaigns.objects.filter(department=campaign.department).update(is_active=False)
        campaign.is_active = True
        campaign.save(update_fields=["is_active", "updated_at"])

    return Response({"campaign": _serialize_campaign(campaign)}, status=200)


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def set_pfe_campaign_quota_overrides(request):
    campaign_id = request.data.get("campaign_id")
    quotas = request.data.get("quotas") or []

    campaign = PFECampaigns.objects.filter(id=campaign_id).first()
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    with transaction.atomic():
        PFETeacherQuotaOverrides.objects.filter(campaign=campaign).delete()
        rows = []
        for item in quotas:
            teacher_id = item.get("teacher_id")
            target = int(item.get("target_presentations", 0))
            teacher = Teachers.objects.filter(user_id=teacher_id).first()
            if not teacher or target <= 0:
                continue
            rows.append(
                PFETeacherQuotaOverrides(
                    campaign=campaign,
                    teacher=teacher,
                    target_presentations=target,
                )
            )
        if rows:
            PFETeacherQuotaOverrides.objects.bulk_create(rows)

    return Response({"message": "Quota overrides saved", "count": len(rows)}, status=200)


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def set_teacher_availability_date_exception(request):
    context = request.data.get("context", AvailabilityContext.PFE)
    teacher_id = request.data.get("teacher_id")
    campaign_id = request.data.get("campaign_id")
    availability_date = request.data.get("availability_date")
    start_time = request.data.get("start_time")
    end_time = request.data.get("end_time")
    level = request.data.get("level", AvailabilityLevel.AVAILABLE)

    if context not in AvailabilityContext.values:
        return Response({"error": "Invalid context"}, status=400)
    if level not in AvailabilityLevel.values:
        return Response({"error": "Invalid level"}, status=400)
    if not teacher_id or not availability_date or not start_time or not end_time:
        return Response({"error": "teacher_id, availability_date, start_time and end_time are required"}, status=400)

    teacher = Teachers.objects.filter(user_id=teacher_id).first()
    if not teacher:
        return Response({"error": "Teacher not found"}, status=404)

    campaign = None
    if campaign_id:
        campaign = PFECampaigns.objects.filter(id=campaign_id).first()
        if not campaign:
            return Response({"error": "Campaign not found"}, status=404)

    row, _ = TeacherAvailabilityDateExceptions.objects.update_or_create(
        teacher=teacher,
        context=context,
        campaign=campaign,
        availability_date=availability_date,
        start_time=start_time,
        end_time=end_time,
        defaults={"level": level},
    )

    return Response({"message": "Date exception saved", "id": str(row.id)}, status=201)


@extend_schema(tags=["Admin Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def get_teacher_availability(request):
    context = request.query_params.get("context", AvailabilityContext.PFE)
    teacher_id = request.query_params.get("teacher_id")
    campaign_id = request.query_params.get("campaign_id")

    if context not in AvailabilityContext.values:
        return Response({"error": "Invalid context"}, status=400)
    if not teacher_id:
        return Response({"error": "teacher_id is required"}, status=400)

    teacher = Teachers.objects.select_related("user").filter(user_id=teacher_id).first()
    if not teacher:
        return Response({"error": "Teacher not found"}, status=404)

    weekly_query = TeacherAvailabilities.objects.filter(teacher=teacher, context=context)
    date_query = TeacherAvailabilityDateExceptions.objects.filter(teacher=teacher, context=context)

    if campaign_id:
        weekly_query = weekly_query.filter(campaign_id=campaign_id)
        date_query = date_query.filter(campaign_id=campaign_id)

    weekly = list(weekly_query.order_by("day_of_week", "start_time"))
    date_exceptions = list(date_query.order_by("availability_date", "start_time"))

    return Response(
        {
            "teacher": {"id": str(teacher.user_id), "username": teacher.user.username},
            "context": context,
            "campaign_id": campaign_id,
            "weekly": [
                {
                    "id": str(item.id),
                    "teacher_id": str(item.teacher_id),
                    "context": item.context,
                    "campaign_id": str(item.campaign_id) if item.campaign_id else None,
                    "day_of_week": item.day_of_week,
                    "start_time": str(item.start_time),
                    "end_time": str(item.end_time),
                    "level": item.level,
                }
                for item in weekly
            ],
            "date_exceptions": [
                {
                    "id": str(item.id),
                    "teacher_id": str(item.teacher_id),
                    "context": item.context,
                    "campaign_id": str(item.campaign_id) if item.campaign_id else None,
                    "availability_date": str(item.availability_date),
                    "start_time": str(item.start_time),
                    "end_time": str(item.end_time),
                    "level": item.level,
                }
                for item in date_exceptions
            ],
        },
        status=200,
    )


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def pfe_auto_assign_dry_run(request):
    campaign_id = request.data.get("campaign_id")
    subject_ids = request.data.get("subject_ids")

    campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    plan = plan_pfe_assignments(campaign=campaign, subject_ids=subject_ids)
    return Response(plan, status=200)


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def pfe_auto_assign_commit(request):
    campaign_id = request.data.get("campaign_id")
    subject_ids = request.data.get("subject_ids")
    block_on_unresolved = _as_bool(request.data.get("block_on_unresolved"), False)

    campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)

    plan = plan_pfe_assignments(campaign=campaign, subject_ids=subject_ids)
    if block_on_unresolved and plan.get("unresolved"):
        return Response({"error": "Plan has unresolved subjects", "plan": plan}, status=400)

    with transaction.atomic():
        persist = persist_pfe_assignments(campaign=campaign, plan=plan, assigned_by=request.user)
        campaign.availability_open = False
        campaign.schedule_generated = True
        campaign.generated_at = timezone.now()
        campaign.save(update_fields=["availability_open", "schedule_generated", "generated_at", "updated_at"])

    response = {
        "message": "Auto scheduling committed",
        **plan,
        "persist": persist,
    }
    return Response(response, status=200)


@extend_schema(tags=["Admin Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def list_pfe_assignments(request):
    campaign_id = request.query_params.get("campaign_id")

    campaign = None
    query = PFESubjects.objects.select_related(
        "supervisor",
        "supervisor__user",
        "student",
        "student__user",
    ).order_by("title")
    if campaign_id:
        campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
        if not campaign:
            return Response({"error": "Campaign not found"}, status=404)
        query = query.filter(supervisor__department=campaign.department.name)

    subjects = list(query)
    subject_ids = [item.id for item in subjects]

    assignment_rows = list(
        PFEJuryAssignments.objects.filter(pfe_subject_id__in=subject_ids)
        .select_related("teacher", "teacher__user", "slot")
        .order_by("assigned_at")
    )
    if campaign:
        assignment_rows = [row for row in assignment_rows if row.slot_id and row.slot and row.slot.campaign_id == campaign.id]

    grouped = {}
    for row in assignment_rows:
        key = str(row.pfe_subject_id)
        grouped.setdefault(key, []).append(row)

    payload = []
    for subject in subjects:
        rows = grouped.get(str(subject.id), [])
        rows = sorted(rows, key=lambda item: ROLE_ORDER.get(item.role, 99))
        slot = next((item.slot for item in rows if item.slot_id), None)

        payload.append(
            {
                "subject_id": str(subject.id),
                "subject_title": subject.title,
                "student_id": str(subject.student_id) if subject.student_id else None,
                "student_name": subject.student.user.username if subject.student_id else subject.student_name,
                "supervisor_id": str(subject.supervisor_id),
                "supervisor_name": subject.supervisor.user.username,
                "slot": (
                    {
                        "id": str(slot.id),
                        "date": str(slot.presentation_date),
                        "start_time": str(slot.start_time),
                        "end_time": str(slot.end_time),
                        "room": slot.room,
                    }
                    if slot
                    else None
                ),
                "jury": [
                    {
                        "assignment_id": str(item.id),
                        "teacher_id": str(item.teacher_id),
                        "teacher_name": item.teacher.user.username,
                        "role": item.role,
                        "assigned_at": item.assigned_at.isoformat() if item.assigned_at else None,
                    }
                    for item in rows
                ],
            }
        )

    return Response({"assignments": payload}, status=200)


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdmin])
def unassign_pfe_jury(request):
    assignment_id = request.data.get("assignment_id") or request.query_params.get("assignment_id")
    if not assignment_id:
        return Response({"error": "assignment_id is required"}, status=400)

    assignment = PFEJuryAssignments.objects.filter(id=assignment_id).first()
    if not assignment:
        return Response({"error": "Assignment not found"}, status=404)

    assignment.delete()
    return Response({"message": "Assignment removed"}, status=200)


@extend_schema(tags=["Admin Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def export_pfe_assignments(request):
    campaign_id = request.query_params.get("campaign_id")
    query = PFESubjects.objects.select_related(
        "supervisor",
        "supervisor__user",
        "student",
        "student__user",
    ).order_by("title")
    if campaign_id:
        campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
        if not campaign:
            return Response({"error": "Campaign not found"}, status=404)
        query = query.filter(supervisor__department=campaign.department.name)

    subjects = list(query)
    assignment_rows = list(
        PFEJuryAssignments.objects.filter(pfe_subject__in=subjects)
        .select_related("teacher", "teacher__user", "slot")
        .order_by("assigned_at")
    )
    if campaign_id:
        assignment_rows = [
            row for row in assignment_rows if row.slot_id and row.slot and str(row.slot.campaign_id) == str(campaign_id)
        ]

    grouped = {}
    for row in assignment_rows:
        grouped.setdefault(str(row.pfe_subject_id), []).append(row)

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="pfe_assignments.csv"'

    writer = csv.writer(response)
    writer.writerow([
        "subject_id",
        "subject_title",
        "student_id",
        "student_name",
        "supervisor",
        "slot_date",
        "slot_start",
        "slot_end",
        "room",
        "encadreur",
        "rapporteur",
        "president",
    ])

    for subject in subjects:
        rows = grouped.get(str(subject.id), [])
        role_map = {item.role: item for item in rows}
        slot = next((item.slot for item in rows if item.slot_id), None)
        writer.writerow([
            str(subject.id),
            subject.title,
            str(subject.student_id) if subject.student_id else "",
            subject.student.user.username if subject.student_id else subject.student_name,
            subject.supervisor.user.username,
            str(slot.presentation_date) if slot else "",
            str(slot.start_time) if slot else "",
            str(slot.end_time) if slot else "",
            slot.room if slot else "",
            role_map.get(JuryRole.ENCADREUR).teacher.user.username if role_map.get(JuryRole.ENCADREUR) else "",
            role_map.get(JuryRole.RAPPORTEUR).teacher.user.username if role_map.get(JuryRole.RAPPORTEUR) else "",
            role_map.get(JuryRole.PRESIDENT).teacher.user.username if role_map.get(JuryRole.PRESIDENT) else "",
        ])

    return response


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def seed_pfe_simulation_dataset(request):
    seed = int(request.data.get("seed", 20260420))
    teachers_count = int(request.data.get("teachers", 30))
    presentations_count = int(request.data.get("presentations", 112))
    department_name = str(request.data.get("department_name", "Département PFE Simulation")).strip()
    reset_existing = _as_bool(request.data.get("reset_existing"), True)

    if teachers_count < 3:
        return Response({"error": "teachers must be >= 3"}, status=400)
    if presentations_count < 1:
        return Response({"error": "presentations must be >= 1"}, status=400)

    rng = random.Random(seed)

    with transaction.atomic():
        department, _ = Departments.objects.get_or_create(name=department_name)

        teachers = []
        for i in range(1, teachers_count + 1):
            email = f"sim.teacher.{i:02d}@issat.local"
            username = f"Sim Teacher {i:02d}"
            user, created = Users.objects.get_or_create(
                email=email,
                defaults={
                    "username": username,
                    "password": "SimTeacher123",
                    "role": UserRole.TEACHER,
                },
            )
            if not created:
                dirty = False
                if user.username != username:
                    user.username = username
                    dirty = True
                if user.role != UserRole.TEACHER:
                    user.role = UserRole.TEACHER
                    dirty = True
                if dirty:
                    user.save(update_fields=["username", "role"])

            teacher, _ = Teachers.objects.get_or_create(
                user=user,
                defaults={
                    "department": department.name,
                    "ncin": f"{81000000 + i:08d}",
                    "age": 35,
                },
            )
            if teacher.department != department.name:
                teacher.department = department.name
                teacher.save(update_fields=["department"])
            teachers.append(teacher)

        if teachers:
            department.head = teachers[0]
            department.save(update_fields=["head"])

        students = []
        for i in range(1, presentations_count + 1):
            email = f"sim.student.{i:03d}@issat.local"
            username = f"Student {i:03d}"
            user, created = Users.objects.get_or_create(
                email=email,
                defaults={
                    "username": username,
                    "password": "SimStudent123",
                    "role": UserRole.STUDENT,
                },
            )
            if not created:
                dirty = False
                if user.username != username:
                    user.username = username
                    dirty = True
                if user.role != UserRole.STUDENT:
                    user.role = UserRole.STUDENT
                    dirty = True
                if dirty:
                    user.save(update_fields=["username", "role"])

            student, _ = Students.objects.get_or_create(
                user=user,
                defaults={
                    "class_id": None,
                    "parent_contact": None,
                    "access_status": True,
                },
            )
            students.append(student)

        campaign_name = f"Simulation PFE {seed}"
        campaign, _ = PFECampaigns.objects.update_or_create(
            department=department,
            name=campaign_name,
            defaults={
                "start_date": _parse_date(request.data.get("start_date", "2026-06-01")),
                "end_date": _parse_date(request.data.get("end_date", "2026-06-30")),
                "day_start_time": _parse_time(request.data.get("day_start_time", "08:00")),
                "day_end_time": _parse_time(request.data.get("day_end_time", "16:00")),
                "slot_duration_minutes": int(request.data.get("slot_duration_minutes", 60)),
                "break_duration_minutes": int(request.data.get("break_duration_minutes", 15)),
                "weekdays": WEEKDAYS_DEFAULT,
                "daily_cap_per_teacher": request.data.get("daily_cap_per_teacher"),
                "head_can_start": True,
                "availability_open": True,
                "schedule_generated": False,
                "generated_at": None,
                "is_active": True,
                "created_by": request.user,
            },
        )
        PFECampaigns.objects.filter(department=department).exclude(id=campaign.id).update(is_active=False)

        PFECampaignRooms.objects.filter(campaign=campaign).delete()
        PFECampaignRooms.objects.bulk_create(
            [PFECampaignRooms(campaign=campaign, room_name=room) for room in ROOMS_DEFAULT]
        )

        if reset_existing:
            department_teacher_ids = [teacher.user_id for teacher in teachers]
            PFEJuryAssignments.objects.filter(pfe_subject__supervisor_id__in=department_teacher_ids).delete()
            PFESubjects.objects.filter(supervisor_id__in=department_teacher_ids).delete()
            TeacherAvailabilities.objects.filter(
                teacher_id__in=department_teacher_ids,
                context=AvailabilityContext.PFE,
                campaign=campaign,
            ).delete()
            TeacherAvailabilityDateExceptions.objects.filter(
                teacher_id__in=department_teacher_ids,
                context=AvailabilityContext.PFE,
                campaign=campaign,
            ).delete()
            PFETeacherQuotaOverrides.objects.filter(campaign=campaign).delete()

        slots = _generate_candidate_slots(campaign)
        if not slots:
            return Response({"error": "Campaign generated zero slots"}, status=400)

        availability_windows = {}
        for slot in slots:
            key = (slot.presentation_date, slot.start_time, slot.end_time)
            if key not in availability_windows:
                availability_windows[key] = slot
        availability_slots = list(availability_windows.values())

        teacher_seed_summary = []
        slot_indexes = list(range(len(availability_slots)))

        for teacher in teachers:
            target = rng.randint(6, 14)
            preferred_count, available_count = _compute_availability_counts(target, len(availability_slots), rng)

            preferred_indexes = set(rng.sample(slot_indexes, preferred_count))
            remaining = [idx for idx in slot_indexes if idx not in preferred_indexes]
            available_indexes = set(rng.sample(remaining, available_count))

            PFETeacherQuotaOverrides.objects.update_or_create(
                campaign=campaign,
                teacher=teacher,
                defaults={"target_presentations": target},
            )

            date_rows = []
            for idx in preferred_indexes:
                slot = availability_slots[idx]
                date_rows.append(
                    TeacherAvailabilityDateExceptions(
                        teacher=teacher,
                        context=AvailabilityContext.PFE,
                        campaign=campaign,
                        availability_date=slot.presentation_date,
                        start_time=slot.start_time,
                        end_time=slot.end_time,
                        level=AvailabilityLevel.PREFERRED,
                    )
                )
            for idx in available_indexes:
                slot = availability_slots[idx]
                date_rows.append(
                    TeacherAvailabilityDateExceptions(
                        teacher=teacher,
                        context=AvailabilityContext.PFE,
                        campaign=campaign,
                        availability_date=slot.presentation_date,
                        start_time=slot.start_time,
                        end_time=slot.end_time,
                        level=AvailabilityLevel.AVAILABLE,
                    )
                )
            TeacherAvailabilityDateExceptions.objects.bulk_create(date_rows)

            teacher_seed_summary.append(
                {
                    "teacher_id": str(teacher.user_id),
                    "teacher_name": teacher.user.username,
                    "target": target,
                    "preferred_sessions": preferred_count,
                    "available_not_preferred_sessions": available_count,
                    "rule_target_6_ok": (
                        target != 6 or (10 <= preferred_count <= 12 and available_count >= 6)
                    ),
                }
            )

        PFESubjects.objects.bulk_create(
            [
                PFESubjects(
                    title=f"SIM-PFE-{i:03d}",
                    student_name=students[i - 1].user.username,
                    student=students[i - 1],
                    supervisor=rng.choice(teachers),
                    created_by=request.user,
                )
                for i in range(1, presentations_count + 1)
            ]
        )

        plan = plan_pfe_assignments(campaign=campaign)
        persist = persist_pfe_assignments(campaign=campaign, plan=plan, assigned_by=request.user)
        campaign.availability_open = False
        campaign.schedule_generated = True
        campaign.generated_at = timezone.now()
        campaign.save(update_fields=["availability_open", "schedule_generated", "generated_at", "updated_at"])

    return Response(
        {
            "message": "Simulation data generated and committed to database",
            "seed": seed,
            "teachers": teachers_count,
            "head_department": {
                "id": str(department.head_id) if department.head_id else None,
                "name": department.head.user.username if department.head_id else None,
            },
            "presentations": presentations_count,
            "campaign": _serialize_campaign(campaign),
            "seed_summary": teacher_seed_summary,
            "plan": plan,
            "persist": persist,
        },
        status=201,
    )
