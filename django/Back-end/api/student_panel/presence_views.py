"""
Student-side presence summary.

Returns one item per subject the student's class has scheduled, with
total recorded sessions, absences, and a `warning` boolean (absences
percent > 20%).
"""
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import (
    Attendance,
    Schedules,
    Students,
    UserRole,
)


GENERIC_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    404: OpenApiTypes.OBJECT,
    500: OpenApiTypes.OBJECT,
}


WARNING_THRESHOLD_PERCENT = 20.0


def _percent(absences: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((absences / total) * 100, 1)


@extend_schema(tags=["Student Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_presence_summary(request):
    """One row per subject for the student's class, with absence stats."""
    try:
        if request.user.role != UserRole.STUDENT:
            return Response({"error": "Forbidden"}, status=403)

        student = (
            Students.objects
            .select_related("user", "class_id")
            .filter(user=request.user)
            .first()
        )
        if not student:
            return Response({"error": "Student profile not found"}, status=404)
        if not student.class_id_id:
            return Response(
                {
                    "subjects": [],
                    "threshold_percent": WARNING_THRESHOLD_PERCENT,
                    "totals": {"sessions": 0, "absences": 0, "percent": 0.0},
                },
                status=200,
            )

        # All subjects scheduled for the student's class.
        subjects = list(
            Schedules.objects
            .filter(class_id=student.class_id)
            .values_list("subject", flat=True)
            .distinct()
        )

        items = []
        total_sessions = 0
        total_absences = 0

        for subject in subjects:
            schedule_ids = list(
                Schedules.objects
                .filter(class_id=student.class_id, subject=subject)
                .values_list("id", flat=True)
            )
            attendance_qs = Attendance.objects.filter(
                student=student,
                schedule_id__in=schedule_ids,
            )
            sessions_total = attendance_qs.count()
            absences = attendance_qs.filter(status=False).count()
            percent = _percent(absences, sessions_total)
            total_sessions += sessions_total
            total_absences += absences

            items.append(
                {
                    "subject": subject,
                    "sessions_total": sessions_total,
                    "absences": absences,
                    "percent": percent,
                    "warning": percent > WARNING_THRESHOLD_PERCENT,
                }
            )

        items.sort(key=lambda x: (-x["percent"], x["subject"]))

        return Response(
            {
                "class_label": (
                    f"{student.class_id.niveau}-"
                    f"{student.class_id.classe_section}-"
                    f"{student.class_id.classe_num}"
                ),
                "subjects": items,
                "threshold_percent": WARNING_THRESHOLD_PERCENT,
                "totals": {
                    "sessions": total_sessions,
                    "absences": total_absences,
                    "percent": _percent(total_absences, total_sessions),
                },
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)
