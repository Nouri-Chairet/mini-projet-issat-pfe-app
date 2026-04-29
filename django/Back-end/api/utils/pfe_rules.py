"""
Shared validators for the "one PFE subject per student" business rule.

Used by both the teacher single-upload endpoint
(`teacher_panel.pfe_management_views.create_teacher_pfe_subject`)
and the admin bulk Excel import
(`admin_panel.pfe_import_views`) so that both paths reject duplicate
student assignments identically.
"""
from typing import Optional, Tuple
from api.models import PFESubjects, Students


def find_existing_pfe_for_student(student: Students) -> Optional[PFESubjects]:
    """Return the existing PFE subject linked to this student, or None."""
    if student is None:
        return None
    return (
        PFESubjects.objects
        .select_related("supervisor", "supervisor__user")
        .filter(student=student)
        .first()
    )


def enforce_one_pfe_per_student(student: Students) -> Tuple[bool, str]:
    """
    Validate that the given student does not already have a PFE subject.

    Returns:
        (ok, reason). When ok is False, reason explains why (mentions the
        existing supervisor's name when possible).
    """
    if student is None:
        return False, "Student not found"

    existing = find_existing_pfe_for_student(student)
    if existing is None:
        return True, ""

    supervisor_name = (
        existing.supervisor.user.username
        if existing.supervisor and existing.supervisor.user
        else "another teacher"
    )
    return (
        False,
        f"Student already has a PFE subject (supervised by {supervisor_name}).",
    )
