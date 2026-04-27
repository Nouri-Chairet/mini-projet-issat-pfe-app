from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from api.models import PFEJuryAssignments, Students, StudentNotifications, UserRole


GENERIC_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    400: OpenApiTypes.OBJECT,
    403: OpenApiTypes.OBJECT,
    404: OpenApiTypes.OBJECT,
}


def _student_from_request(request):
    if request.user.role != UserRole.STUDENT:
        return None
    return Students.objects.select_related("user").filter(user=request.user).first()


@extend_schema(tags=["Student Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_student_notifications(request):
    student = _student_from_request(request)
    if not student:
        return Response({"error": "Student profile not found"}, status=404)

    rows = StudentNotifications.objects.select_related(
        "pfe_subject",
        "slot",
        "campaign",
    ).filter(student=student).order_by("-created_at")

    return Response(
        {
            "notifications": [
                {
                    "id": str(row.id),
                    "title": row.title,
                    "message": row.message,
                    "is_read": row.is_read,
                    "read_at": row.read_at.isoformat() if row.read_at else None,
                    "created_at": row.created_at.isoformat(),
                    "campaign_name": row.campaign.name if row.campaign_id else None,
                    "subject_id": str(row.pfe_subject_id),
                    "subject_title": row.pfe_subject.title,
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
                for row in rows
            ],
            "unread_count": rows.filter(is_read=False).count(),
        },
        status=200,
    )


@extend_schema(tags=["Student Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_student_notification_read(request):
    student = _student_from_request(request)
    if not student:
        return Response({"error": "Student profile not found"}, status=404)

    notification_id = request.data.get("notification_id")
    if not notification_id:
        return Response({"error": "notification_id is required"}, status=400)

    notification = StudentNotifications.objects.filter(
        id=notification_id,
        student=student,
    ).first()
    if not notification:
        return Response({"error": "Notification not found"}, status=404)

    notification.is_read = True
    notification.read_at = timezone.now()
    notification.save(update_fields=["is_read", "read_at", "updated_at"])
    return Response({"message": "Notification marked as read"}, status=200)


@extend_schema(tags=["Student Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_student_pfe_overview(request):
    student = _student_from_request(request)
    if not student:
        return Response({"error": "Student profile not found"}, status=404)

    subject = student.pfe_subjects.select_related("supervisor", "supervisor__user").first()
    if not subject:
        return Response({"subject": None}, status=200)

    jury_rows = list(
        PFEJuryAssignments.objects.select_related("teacher", "teacher__user", "slot")
        .filter(pfe_subject=subject, slot_id__isnull=False)
        .order_by("assigned_at")
    )
    slot = next((item.slot for item in jury_rows if item.slot_id), None)

    return Response(
        {
            "subject": {
                "id": str(subject.id),
                "title": subject.title,
                "student_name": subject.student_name,
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
                        "teacher_id": str(row.teacher_id),
                        "teacher_name": row.teacher.user.username,
                        "role": row.role,
                    }
                    for row in jury_rows
                ],
            }
        },
        status=200,
    )
