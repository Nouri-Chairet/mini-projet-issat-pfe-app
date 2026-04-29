"""
Admin: bulk-import PFE subjects from an Excel file.

Pattern mirrors the timetable importer — one dry-run endpoint that returns
errors + preview, and a commit endpoint that re-validates inside a
transaction.
"""
from typing import List

import pandas as pd
from django.db import transaction
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.admin_panel.permissions import IsAdmin
from api.models import (
    Departments,
    PFESubjects,
    Students,
    Teachers,
    Users,
    UserRole,
)
from api.utils.excel_templates import build_pfe_bulk_template
from api.utils.pfe_rules import enforce_one_pfe_per_student


GENERIC_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    201: OpenApiTypes.OBJECT,
    400: OpenApiTypes.OBJECT,
    500: OpenApiTypes.OBJECT,
}


REQUIRED_COLUMNS = {"title"}
STUDENT_KEYS = ("student_email", "student_name")
SUPERVISOR_KEYS = ("supervisor_email", "supervisor_name")


def _cell(row, key) -> str:
    value = row.get(key)
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none"}:
        return ""
    return text


def _resolve_student(row) -> "tuple[Students | None, str]":
    """Return (student, label) where label is what we'll show in the preview."""
    email = _cell(row, "student_email")
    name = _cell(row, "student_name")
    student = None
    if email:
        student_user = Users.objects.filter(email__iexact=email, role=UserRole.STUDENT).first()
        if student_user:
            student = Students.objects.filter(user=student_user).first()
    if not student and name:
        student_user = Users.objects.filter(username=name, role=UserRole.STUDENT).first()
        if student_user:
            student = Students.objects.filter(user=student_user).first()
    label = name or email or "—"
    return student, label


def _resolve_supervisor(row) -> "tuple[Teachers | None, str]":
    email = _cell(row, "supervisor_email")
    name = _cell(row, "supervisor_name")
    teacher = None
    if email:
        teacher_user = Users.objects.filter(email__iexact=email, role=UserRole.TEACHER).first()
        if teacher_user:
            teacher = Teachers.objects.filter(user=teacher_user).first()
    if not teacher and name:
        teacher_user = Users.objects.filter(username=name, role=UserRole.TEACHER).first()
        if teacher_user:
            teacher = Teachers.objects.filter(user=teacher_user).first()
    label = name or email or "—"
    return teacher, label


def _parse_dataframe(df) -> "tuple[list[dict], list[str]]":
    """Validate and translate dataframe rows. Returns (parsed_rows, errors)."""
    if df.empty:
        return [], ["The Excel file is empty."]

    cols = {str(c).strip().lower() for c in df.columns}
    if not REQUIRED_COLUMNS.issubset(cols):
        return [], [
            "Missing required column: title. The file must contain at least the columns "
            "'title', a student identifier (student_email or student_name) and a "
            "supervisor identifier (supervisor_email or supervisor_name)."
        ]

    parsed: List[dict] = []
    errors: List[str] = []
    seen_student_ids: dict = {}

    for index, row in df.iterrows():
        row_number = index + 2
        title = _cell(row, "title")
        description = _cell(row, "description")

        if not title:
            errors.append(f"Row {row_number}: title is required.")
            continue

        student, student_label = _resolve_student(row)
        supervisor, supervisor_label = _resolve_supervisor(row)

        row_errors = []
        if not student:
            row_errors.append(f"student '{student_label}' not found")
        if not supervisor:
            row_errors.append(f"supervisor '{supervisor_label}' not found")

        action = "create"
        if not row_errors and student:
            ok, reason = enforce_one_pfe_per_student(student)
            if not ok:
                row_errors.append(reason)
                action = "reject"
            elif student.user_id in seen_student_ids:
                first_row = seen_student_ids[student.user_id]
                row_errors.append(
                    f"student '{student_label}' is already assigned earlier in the file (row {first_row})"
                )
                action = "reject"
            else:
                seen_student_ids[student.user_id] = row_number

        if row_errors:
            errors.append(f"Row {row_number}: " + "; ".join(row_errors))

        parsed.append(
            {
                "row_number": row_number,
                "title": title,
                "description": description,
                "student": student,
                "student_label": student_label,
                "supervisor": supervisor,
                "supervisor_label": supervisor_label,
                "action": action if not row_errors else "reject",
                "errors": row_errors,
            }
        )

    return parsed, errors


def _preview_payload(parsed):
    return [
        {
            "row": row["row_number"],
            "title": row["title"],
            "student_name": row["student_label"],
            "supervisor_name": row["supervisor_label"],
            "action": row["action"],
            "errors": row["errors"],
        }
        for row in parsed[:200]
    ]


def _stats(parsed):
    create = sum(1 for r in parsed if r["action"] == "create")
    reject = sum(1 for r in parsed if r["action"] == "reject")
    return {"create": create, "reject": reject, "total": len(parsed)}


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def pfe_import_dry_run(request):
    try:
        file = request.FILES.get("file")
        if not file or not file.name.endswith(".xlsx"):
            return Response({"error": "A valid .xlsx file is required"}, status=400)

        df = pd.read_excel(file)
        parsed, errors = _parse_dataframe(df)
        return Response(
            {
                "valid": len(errors) == 0,
                "errors": errors,
                "preview": _preview_payload(parsed),
                "stats": _stats(parsed),
                "parsed_count": len(parsed),
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=["Admin Panel"], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def pfe_import_commit(request):
    try:
        file = request.FILES.get("file")
        if not file or not file.name.endswith(".xlsx"):
            return Response({"error": "A valid .xlsx file is required"}, status=400)

        df = pd.read_excel(file)
        parsed, errors = _parse_dataframe(df)

        created_ids = []
        skipped = []
        with transaction.atomic():
            for row in parsed:
                if row["action"] != "create":
                    skipped.append(
                        {
                            "row": row["row_number"],
                            "student_name": row["student_label"],
                            "reason": "; ".join(row["errors"]) or "rejected by validation",
                        }
                    )
                    continue
                # Re-check inside the transaction to be safe against races.
                ok, reason = enforce_one_pfe_per_student(row["student"])
                if not ok:
                    skipped.append(
                        {
                            "row": row["row_number"],
                            "student_name": row["student_label"],
                            "reason": reason,
                        }
                    )
                    continue

                department = (
                    Departments.objects
                    .filter(name=row["supervisor"].department)
                    .first()
                )
                subject = PFESubjects.objects.create(
                    title=row["title"],
                    student_name=row["student_label"],
                    student=row["student"],
                    supervisor=row["supervisor"],
                    department=department,
                    description=row["description"] or None,
                    created_by=request.user,
                )
                created_ids.append(str(subject.id))

        return Response(
            {
                "message": "PFE bulk import done.",
                "created_count": len(created_ids),
                "skipped_count": len(skipped),
                "errors": errors,
                "skipped": skipped,
                "created_ids": created_ids,
                "stats": _stats(parsed),
            },
            status=201,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=["Admin Panel"], responses={200: OpenApiTypes.BINARY})
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def pfe_import_template(request):
    return build_pfe_bulk_template()


@extend_schema(tags=["Admin Panel"], responses={200: OpenApiTypes.BINARY})
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def timetable_template(request):
    from api.utils.excel_templates import build_timetable_template
    return build_timetable_template()
