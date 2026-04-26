from __future__ import annotations

from datetime import datetime

from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.admin_panel.permissions import IsTeacher
from api.admin_panel.pfe_scheduler import persist_pfe_assignments, plan_pfe_assignments
from api.models import (
    AvailabilityContext,
    AvailabilityLevel,
    Departments,
    JuryRole,
    PFECampaignRooms,
    PFECampaigns,
    PFEJuryAssignments,
    PFESubjects,
    TeacherAvailabilityDateExceptions,
    Teachers,
)

GENERIC_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    201: OpenApiTypes.OBJECT,
    400: OpenApiTypes.OBJECT,
    403: OpenApiTypes.OBJECT,
    404: OpenApiTypes.OBJECT,
    500: OpenApiTypes.OBJECT,
}

WEEKDAYS_DEFAULT = ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi"]


def _parse_time(value: str):
    as_text = str(value).strip()
    fmt = "%H:%M:%S" if len(as_text) > 5 else "%H:%M"
    return datetime.strptime(as_text, fmt).time()


def _parse_date(value: str):
    return datetime.strptime(str(value).strip(), "%Y-%m-%d").date()


def _teacher_from_request(request):
    return Teachers.objects.select_related("user").filter(user=request.user).first()


def _latest_campaign_for_department(department: Departments):
    return (
        PFECampaigns.objects.select_related("department")
        .filter(department=department)
        .order_by("-is_active", "-updated_at")
        .first()
    )


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
        "weekdays": campaign.weekdays or [],
        "rooms": rooms,
        "daily_cap_per_teacher": campaign.daily_cap_per_teacher,
        "head_can_start": bool(campaign.head_can_start),
        "availability_open": bool(campaign.availability_open),
        "schedule_generated": bool(campaign.schedule_generated),
        "generated_at": campaign.generated_at.isoformat() if campaign.generated_at else None,
        "is_active": bool(campaign.is_active),
    }


@extend_schema(tags=["Teacher Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsTeacher])
def get_teacher_pfe_session_state(request):
    teacher = _teacher_from_request(request)
    if not teacher:
        return Response({"error": "Teacher profile not found"}, status=404)

    department = Departments.objects.select_related("head", "head__user").filter(name=teacher.department).first()
    campaign = _latest_campaign_for_department(department) if department else None
    is_department_head = bool(department and department.head_id == teacher.user_id)

    entries = []
    if campaign:
        entries = [
            {
                "id": str(item.id),
                "availability_date": str(item.availability_date),
                "start_time": str(item.start_time),
                "end_time": str(item.end_time),
                "level": item.level,
            }
            for item in TeacherAvailabilityDateExceptions.objects.filter(
                teacher=teacher,
                context=AvailabilityContext.PFE,
                campaign=campaign,
            ).order_by("availability_date", "start_time")
        ]

    return Response(
        {
            "teacher": {
                "id": str(teacher.user_id),
                "username": teacher.user.username,
                "department": teacher.department,
                "is_department_head": is_department_head,
            },
            "department": (
                {
                    "id": str(department.id),
                    "name": department.name,
                    "head_id": str(department.head_id) if department.head_id else None,
                    "head_username": department.head.user.username if department and department.head else None,
                }
                if department
                else None
            ),
            "campaign": _serialize_campaign(campaign) if campaign else None,
            "can_start_collection": bool(
                campaign
                and is_department_head
                and campaign.head_can_start
                and not campaign.availability_open
                and not campaign.schedule_generated
            ),
            "can_submit_availability": bool(campaign and campaign.availability_open and not campaign.schedule_generated),
            "my_supervised_pfe_count": PFESubjects.objects.filter(supervisor=teacher).count(),
            "my_entries": entries,
        },
        status=200,
    )


@extend_schema(tags=["Teacher Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsTeacher])
def head_start_pfe_date_collection(request):
    teacher = _teacher_from_request(request)
    if not teacher:
        return Response({"error": "Teacher profile not found"}, status=404)

    department = Departments.objects.select_related("head").filter(name=teacher.department).first()
    if not department:
        return Response({"error": "Department not found"}, status=404)
    if department.head_id != teacher.user_id:
        return Response({"error": "Only the department head can start this session"}, status=403)

    campaign = _latest_campaign_for_department(department)
    if campaign and not campaign.head_can_start:
        return Response({"error": "Session is not unlocked by admin yet"}, status=403)

    rooms = [str(item).strip() for item in (request.data.get("rooms") or []) if str(item).strip()]
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

    payload = {
        "department": department,
        "name": request.data.get("name") or f"PFE Session {department.name}",
        "start_date": start_date,
        "end_date": end_date,
        "day_start_time": day_start_time,
        "day_end_time": day_end_time,
        "slot_duration_minutes": int(request.data.get("slot_duration_minutes", 60)),
        "break_duration_minutes": int(request.data.get("break_duration_minutes", 0)),
        "weekdays": request.data.get("weekdays") or WEEKDAYS_DEFAULT,
        "daily_cap_per_teacher": request.data.get("daily_cap_per_teacher") or 3,
        "head_can_start": True,
        "availability_open": True,
        "schedule_generated": False,
        "generated_at": None,
        "is_active": True,
        "created_by": request.user,
    }

    with transaction.atomic():
        if campaign is None:
            campaign = PFECampaigns.objects.create(**payload)
        else:
            for key, value in payload.items():
                setattr(campaign, key, value)
            campaign.save()

        PFECampaignRooms.objects.filter(campaign=campaign).delete()
        PFECampaignRooms.objects.bulk_create(
            [PFECampaignRooms(campaign=campaign, room_name=room) for room in sorted(set(rooms))]
        )
        PFECampaigns.objects.filter(department=department).exclude(id=campaign.id).update(is_active=False)

    return Response(
        {
            "message": "Date collection unlocked for teachers",
            "campaign": _serialize_campaign(campaign),
        },
        status=200,
    )


@extend_schema(tags=["Teacher Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsTeacher])
def submit_teacher_pfe_availability(request):
    teacher = _teacher_from_request(request)
    if not teacher:
        return Response({"error": "Teacher profile not found"}, status=404)

    campaign_id = request.data.get("campaign_id")
    entries = request.data.get("entries") or []
    if not entries:
        return Response({"error": "entries is required"}, status=400)

    if campaign_id:
        campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    else:
        campaign = (
            PFECampaigns.objects.select_related("department")
            .filter(department__name=teacher.department, is_active=True)
            .order_by("-updated_at")
            .first()
        )
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)
    if not campaign.availability_open or campaign.schedule_generated:
        return Response({"error": "Availability submission is currently locked"}, status=403)

    rows = []
    for item in entries:
        level = item.get("level", AvailabilityLevel.AVAILABLE)
        if level not in AvailabilityLevel.values:
            return Response({"error": f"Invalid level: {level}"}, status=400)
        try:
            rows.append(
                TeacherAvailabilityDateExceptions(
                    teacher=teacher,
                    context=AvailabilityContext.PFE,
                    campaign=campaign,
                    availability_date=_parse_date(item.get("availability_date")),
                    start_time=_parse_time(item.get("start_time")),
                    end_time=_parse_time(item.get("end_time")),
                    level=level,
                )
            )
        except Exception:
            return Response({"error": "Invalid availability_date/start_time/end_time"}, status=400)

    with transaction.atomic():
        TeacherAvailabilityDateExceptions.objects.filter(
            teacher=teacher,
            context=AvailabilityContext.PFE,
            campaign=campaign,
        ).delete()
        TeacherAvailabilityDateExceptions.objects.bulk_create(rows)

    return Response(
        {
            "message": "Availability submitted successfully",
            "campaign_id": str(campaign.id),
            "entries_count": len(rows),
        },
        status=200,
    )


@extend_schema(tags=["Teacher Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsTeacher])
def head_generate_pfe_schedule(request):
    teacher = _teacher_from_request(request)
    if not teacher:
        return Response({"error": "Teacher profile not found"}, status=404)

    department = Departments.objects.select_related("head").filter(name=teacher.department).first()
    if not department:
        return Response({"error": "Department not found"}, status=404)
    if department.head_id != teacher.user_id:
        return Response({"error": "Only the department head can generate the schedule"}, status=403)

    campaign_id = request.data.get("campaign_id")
    if campaign_id:
        campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id, department=department).first()
    else:
        campaign = _latest_campaign_for_department(department)
    if not campaign:
        return Response({"error": "Campaign not found"}, status=404)
    if campaign.schedule_generated:
        return Response({"error": "Schedule already generated for this campaign"}, status=400)

    plan = plan_pfe_assignments(campaign=campaign)

    with transaction.atomic():
        persist = persist_pfe_assignments(campaign=campaign, plan=plan, assigned_by=request.user)
        campaign.availability_open = False
        campaign.schedule_generated = True
        campaign.generated_at = timezone.now()
        campaign.save(update_fields=["availability_open", "schedule_generated", "generated_at", "updated_at"])

    return Response(
        {
            "message": "PFE schedule generated",
            "campaign": _serialize_campaign(campaign),
            "plan": plan,
            "persist": persist,
        },
        status=200,
    )


@extend_schema(tags=["Teacher Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsTeacher])
def get_my_pfe_schedule(request):
    teacher = _teacher_from_request(request)
    if not teacher:
        return Response({"error": "Teacher profile not found"}, status=404)

    campaign_id = request.query_params.get("campaign_id")
    campaign = None
    if campaign_id:
        campaign = PFECampaigns.objects.select_related("department").filter(id=campaign_id).first()
    else:
        campaign = (
            PFECampaigns.objects.select_related("department")
            .filter(department__name=teacher.department, schedule_generated=True)
            .order_by("-generated_at", "-updated_at")
            .first()
        )

    if not campaign or not campaign.schedule_generated:
        return Response(
            {
                "campaign": _serialize_campaign(campaign) if campaign else None,
                "schedule": [],
            },
            status=200,
        )

    rows = (
        PFEJuryAssignments.objects.select_related(
            "pfe_subject",
            "pfe_subject__student",
            "pfe_subject__student__user",
            "slot",
        )
        .filter(
            teacher=teacher,
            role=JuryRole.ENCADREUR,
            slot__campaign=campaign,
        )
        .order_by("slot__presentation_date", "slot__start_time")
    )

    payload = []
    for row in rows:
        subject = row.pfe_subject
        student_name = subject.student.user.username if subject.student_id else subject.student_name
        payload.append(
            {
                "subject_id": str(subject.id),
                "subject_title": subject.title,
                "student_id": str(subject.student_id) if subject.student_id else None,
                "student_name": student_name,
                "slot": (
                    {
                        "date": str(row.slot.presentation_date),
                        "start_time": str(row.slot.start_time),
                        "end_time": str(row.slot.end_time),
                        "room": row.slot.room,
                    }
                    if row.slot_id
                    else None
                ),
            }
        )

    return Response(
        {
            "campaign": _serialize_campaign(campaign),
            "schedule": payload,
        },
        status=200,
    )
