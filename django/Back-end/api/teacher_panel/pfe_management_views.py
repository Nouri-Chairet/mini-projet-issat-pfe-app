"""
Teacher: assign one PFE subject to one supervised student.

The "one PFE per student" guarantee is enforced through
`api.utils.pfe_rules.enforce_one_pfe_per_student`, the same helper used
by the admin bulk importer.
"""
from django.db import transaction
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.admin_panel.permissions import IsTeacher
from api.models import (
    Departments,
    PFESubjects,
    Students,
    Teachers,
    UserRole,
)
from api.utils.pfe_rules import enforce_one_pfe_per_student


GENERIC_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    201: OpenApiTypes.OBJECT,
    400: OpenApiTypes.OBJECT,
    404: OpenApiTypes.OBJECT,
    409: OpenApiTypes.OBJECT,
    500: OpenApiTypes.OBJECT,
}


def _class_label(classe):
    if not classe:
        return None
    return f"{classe.niveau}-{classe.classe_section}-{classe.classe_num}"


def _serialize_subject(subject: PFESubjects) -> dict:
    student = subject.student
    return {
        "id": str(subject.id),
        "title": subject.title,
        "description": subject.description or "",
        "student_id": str(student.user_id) if student else None,
        "student_name": subject.student_name,
        "student_email": student.user.email if student else None,
        "class_label": _class_label(student.class_id) if student and student.class_id else None,
        "supervisor_id": str(subject.supervisor.user_id),
        "supervisor_name": subject.supervisor.user.username,
        "department": subject.department.name if subject.department_id else None,
        "created_at": subject.created_at.isoformat(),
    }


@extend_schema(tags=["Teacher Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsTeacher])
def list_eligible_students(request):
    """
    Students that don't have a PFE subject yet — eligible to be picked
    when the teacher is creating a new PFE.
    """
    try:
        students = (
            Students.objects
            .select_related("user", "class_id")
            .filter(user__role=UserRole.STUDENT)
            .exclude(pfe_subjects__isnull=False)
            .order_by("user__username")
        )
        payload = [
            {
                "id": str(s.user_id),
                "username": s.user.username,
                "email": s.user.email,
                "ncin": s.ncin,
                "class_label": _class_label(s.class_id),
            }
            for s in students
        ]
        return Response({"students": payload, "count": len(payload)}, status=200)
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=["Teacher Panel"], responses=GENERIC_RESPONSES)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsTeacher])
def list_my_supervised_subjects(request):
    """All PFE subjects supervised by the calling teacher."""
    try:
        teacher = Teachers.objects.filter(user=request.user).first()
        if not teacher:
            return Response({"error": "Teacher profile not found"}, status=404)

        subjects = (
            PFESubjects.objects
            .select_related("student", "student__user", "student__class_id", "supervisor", "supervisor__user", "department")
            .filter(supervisor=teacher)
            .order_by("-created_at")
        )
        return Response(
            {
                "subjects": [_serialize_subject(s) for s in subjects],
                "count": subjects.count(),
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=["Teacher Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsTeacher])
def create_pfe_subject(request):
    """Create a single PFE subject for one student under the calling teacher."""
    try:
        student_id = request.data.get("student_id")
        title = str(request.data.get("title", "")).strip()
        description = str(request.data.get("description", "")).strip()

        if not student_id:
            return Response({"error": "student_id is required"}, status=400)
        if not title:
            return Response({"error": "title is required"}, status=400)

        teacher = Teachers.objects.filter(user=request.user).first()
        if not teacher:
            return Response({"error": "Teacher profile not found"}, status=404)

        with transaction.atomic():
            student = (
                Students.objects
                .select_for_update()
                .select_related("user", "class_id")
                .filter(user_id=student_id)
                .first()
            )
            if not student:
                return Response({"error": "Student not found"}, status=404)

            ok, reason = enforce_one_pfe_per_student(student)
            if not ok:
                return Response({"error": reason}, status=409)

            department = Departments.objects.filter(name=teacher.department).first()
            subject = PFESubjects.objects.create(
                title=title,
                student_name=student.user.username,
                student=student,
                supervisor=teacher,
                department=department,
                description=description or None,
                created_by=request.user,
            )

        return Response(
            {
                "message": "PFE subject created",
                "subject": _serialize_subject(subject),
            },
            status=201,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)
