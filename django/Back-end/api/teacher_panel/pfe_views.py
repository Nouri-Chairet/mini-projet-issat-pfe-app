from __future__ import annotations

from datetime import datetime

from django.db import transaction
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.admin_panel.permissions import IsTeacher
from api.models import (
    AvailabilityContext,
    AvailabilityLevel,
    CampaignStatus,
    Departments,
    PFECampaignRooms,
    PFECampaigns,
    PFECampaignTeacherSubmissions,
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
        "status": campaign.status,
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
            "can_start_collection": False,
            "can_submit_availability": bool(
                campaign
                and campaign.is_active
                and campaign.status == CampaignStatus.COLLECTING_AVAILABILITY
            ),
            "has_submitted_availability": bool(
                campaign
                and PFECampaignTeacherSubmissions.objects.filter(
                    campaign=campaign,
                    teacher=teacher,
                ).exists()
            ),
            "my_supervised_pfe_count": PFESubjects.objects.filter(supervisor=teacher).count(),
            "my_entries": entries,
        },
        status=200,
    )


@extend_schema(tags=["Teacher Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsTeacher])
def head_start_pfe_date_collection(request):
    return Response(
        {"error": "Campaign creation is managed by admin in the current workflow"},
        status=403,
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
    if campaign.status != CampaignStatus.COLLECTING_AVAILABILITY:
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
        PFECampaignTeacherSubmissions.objects.update_or_create(
            campaign=campaign,
            teacher=teacher,
            defaults={"entries_count": len(rows)},
        )

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
    return Response(
        {"error": "Schedule generation is managed by admin in the current workflow"},
        status=403,
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
            "pfe_subject__supervisor__user",
            "slot",
        )
        .prefetch_related("pfe_subject__jury_assignments__teacher__user")
        .filter(slot__campaign=campaign)
        .filter(teacher=teacher)
        .order_by("slot__presentation_date", "slot__start_time")
    )

    supervised_subjects = PFESubjects.objects.select_related(
        "student",
        "student__user",
        "supervisor__user",
    ).prefetch_related("jury_assignments__teacher__user").filter(
        supervisor=teacher,
        jury_assignments__slot__campaign=campaign,
    ).distinct()
    supervised_map = {str(subject.id): subject for subject in supervised_subjects}

    payload = []
    seen_subject_ids = set()
    for row in rows:
        subject = row.pfe_subject
        seen_subject_ids.add(str(subject.id))
        student_name = subject.student.user.username if subject.student_id else subject.student_name
        payload.append(
            {
                "subject_id": str(subject.id),
                "subject_title": subject.title,
                "description": subject.description,
                "student_id": str(subject.student_id) if subject.student_id else None,
                "student_name": student_name,
                "supervisor_name": subject.supervisor.user.username,
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
                "jury": [
                    {
                        "assignment_id": str(jury_assignment.id),
                        "teacher_id": str(jury_assignment.teacher_id),
                        "teacher_name": jury_assignment.teacher.user.username,
                        "role": jury_assignment.role,
                        "assigned_at": jury_assignment.assigned_at.isoformat(),
                    }
                    for jury_assignment in subject.jury_assignments.all()
                ],
            }
        )

    for subject_id, subject in supervised_map.items():
        if subject_id in seen_subject_ids:
            continue
        jury_rows = list(subject.jury_assignments.all())
        slot = next((item.slot for item in jury_rows if item.slot_id and item.slot and item.slot.campaign_id == campaign.id), None)
        student_name = subject.student.user.username if subject.student_id else subject.student_name
        payload.append(
            {
                "subject_id": subject_id,
                "subject_title": subject.title,
                "description": subject.description,
                "student_id": str(subject.student_id) if subject.student_id else None,
                "student_name": student_name,
                "supervisor_name": subject.supervisor.user.username,
                "slot": (
                    {
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
                        "assignment_id": str(jury_assignment.id),
                        "teacher_id": str(jury_assignment.teacher_id),
                        "teacher_name": jury_assignment.teacher.user.username,
                        "role": jury_assignment.role,
                        "assigned_at": jury_assignment.assigned_at.isoformat(),
                    }
                    for jury_assignment in jury_rows
                    if not jury_assignment.slot_id or jury_assignment.slot.campaign_id == campaign.id
                ],
            }
        )

    return Response(
        {
            "campaign": _serialize_campaign(campaign),
            "schedule": payload,
        },
        status=200,
    )
