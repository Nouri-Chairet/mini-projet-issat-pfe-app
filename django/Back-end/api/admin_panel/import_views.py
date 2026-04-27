"""
Excel import for student and teacher accounts.

Student columns  : cin, first_name, last_name, email, class (optional), phone (optional)
Teacher columns  : cin, first_name, last_name, email, department, age

Upsert logic
- Match first by CIN (ncin field), then by email.
- If both match different users  → error for that row.
- Existing user  → update profile fields, keep password unchanged.
- New user       → create account, set initial password = CIN value.
"""
import re

import pandas as pd
from django.db import transaction
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.admin_panel.permissions import IsAdmin
from api.admin_panel.views import _parse_class_token, _sync_departments_from_teachers
from api.models import Classes, Students, Teachers, UserRole, Users

GENERIC_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    400: OpenApiTypes.OBJECT,
    500: OpenApiTypes.OBJECT,
}

_CIN_RE = re.compile(r'^\d{8}$')
_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
_USERNAME_ALLOWED = re.compile(r'[^A-Za-z\s]')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean_cin(raw) -> str:
    return str(raw).strip().zfill(8) if str(raw).strip().isdigit() else str(raw).strip()


def _unique_username(base: str, exclude_pk=None) -> str:
    clean = _USERNAME_ALLOWED.sub('', base).strip() or 'User'
    candidate = clean
    counter = 1
    qs = Users.objects.filter(username=candidate)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    while qs.exists():
        candidate = f"{clean} {counter}"
        counter += 1
        qs = Users.objects.filter(username=candidate)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
    return candidate


# ---------------------------------------------------------------------------
# Student import
# ---------------------------------------------------------------------------

def _import_students_from_df(df: pd.DataFrame):
    df.columns = [str(c).strip().lower() for c in df.columns]

    required = {'cin', 'first_name', 'last_name', 'email'}
    missing = required - set(df.columns)
    if missing:
        return 0, 0, 0, [f"Missing required columns: {', '.join(sorted(missing))}"]

    created = updated = skipped = 0
    errors: list[str] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # type: ignore[arg-type]
        try:
            cin = _clean_cin(row.get('cin', ''))
            first_name = str(row.get('first_name', '')).strip()
            last_name = str(row.get('last_name', '')).strip()
            email = str(row.get('email', '')).strip().lower()
            class_token = str(row.get('class', row.get('class_name', ''))).strip()
            phone_raw = str(row.get('phone', '')).strip()
            phone = phone_raw if re.match(r'^\d{8}$', phone_raw) else None

            # --- validation ---
            if not cin:
                raise ValueError("'cin' is required")
            if not _CIN_RE.match(cin):
                raise ValueError(f"CIN '{cin}' must be exactly 8 digits")
            if not first_name:
                raise ValueError("'first_name' is required")
            if not last_name:
                raise ValueError("'last_name' is required")
            if not email:
                raise ValueError("'email' is required")
            if not _EMAIL_RE.match(email):
                raise ValueError(f"Invalid email '{email}'")

            classe = None
            if class_token and class_token.lower() not in ('', 'nan', 'none'):
                chunks = _parse_class_token(class_token)
                if not chunks:
                    raise ValueError(f"Class '{class_token}' must match '<niveau>-<section>-<num>'")
                niveau, section, num = chunks
                classe = Classes.objects.filter(
                    niveau=niveau, classe_section=section, classe_num=num
                ).first()
                if not classe:
                    raise ValueError(f"Class '{class_token}' not found in database")

            with transaction.atomic():
                student_by_cin = (
                    Students.objects.select_related('user')
                    .filter(ncin=cin)
                    .first()
                )
                user_by_email = Users.objects.filter(email=email).first()

                if (
                    student_by_cin
                    and user_by_email
                    and student_by_cin.user_id != user_by_email.pk
                ):
                    raise ValueError(
                        "CIN and email each match a different existing user — conflict"
                    )

                username_base = f"{first_name} {last_name}"

                if student_by_cin or user_by_email:
                    # --- update path ---
                    existing_user = (
                        student_by_cin.user if student_by_cin else user_by_email
                    )
                    existing_user.email = email
                    new_uname = _unique_username(username_base, exclude_pk=existing_user.pk)
                    existing_user.username = new_uname
                    existing_user.save()

                    student_obj = (
                        student_by_cin
                        if student_by_cin
                        else Students.objects.filter(user=existing_user).first()
                    )
                    if student_obj:
                        student_obj.ncin = cin
                        if classe:
                            student_obj.class_id = classe
                        if phone:
                            student_obj.parent_contact = phone
                        student_obj.save()
                    else:
                        Students.objects.create(
                            user=existing_user,
                            ncin=cin,
                            class_id=classe,
                            parent_contact=phone,
                        )
                    updated += 1
                else:
                    # --- create path ---
                    uname = _unique_username(username_base)
                    user = Users(email=email, username=uname, role=UserRole.STUDENT)
                    user.set_password(cin)
                    user.save()
                    Students.objects.create(
                        user=user,
                        ncin=cin,
                        class_id=classe,
                        parent_contact=phone,
                    )
                    created += 1

        except Exception as exc:
            errors.append(f"Row {row_num}: {exc}")
            skipped += 1

    return created, updated, skipped, errors


# ---------------------------------------------------------------------------
# Teacher import
# ---------------------------------------------------------------------------

def _import_teachers_from_df(df: pd.DataFrame):
    df.columns = [str(c).strip().lower() for c in df.columns]

    required = {'cin', 'first_name', 'last_name', 'email', 'department', 'age'}
    missing = required - set(df.columns)
    if missing:
        return 0, 0, 0, [f"Missing required columns: {', '.join(sorted(missing))}"]

    created = updated = skipped = 0
    errors: list[str] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # type: ignore[arg-type]
        try:
            cin = _clean_cin(row.get('cin', ''))
            first_name = str(row.get('first_name', '')).strip()
            last_name = str(row.get('last_name', '')).strip()
            email = str(row.get('email', '')).strip().lower()
            department = str(row.get('department', '')).strip()

            try:
                age = int(float(str(row.get('age', '')).strip()))
            except (ValueError, TypeError):
                raise ValueError("'age' must be a whole number")

            # --- validation ---
            if not cin:
                raise ValueError("'cin' is required")
            if not _CIN_RE.match(cin):
                raise ValueError(f"CIN '{cin}' must be exactly 8 digits")
            if not first_name:
                raise ValueError("'first_name' is required")
            if not last_name:
                raise ValueError("'last_name' is required")
            if not email:
                raise ValueError("'email' is required")
            if not _EMAIL_RE.match(email):
                raise ValueError(f"Invalid email '{email}'")
            if not department:
                raise ValueError("'department' is required")
            if not (23 <= age <= 65):
                raise ValueError(f"'age' must be between 23 and 65 (got {age})")

            with transaction.atomic():
                teacher_by_cin = (
                    Teachers.objects.select_related('user')
                    .filter(ncin=cin)
                    .first()
                )
                user_by_email = Users.objects.filter(email=email).first()

                if (
                    teacher_by_cin
                    and user_by_email
                    and teacher_by_cin.user_id != user_by_email.pk
                ):
                    raise ValueError(
                        "CIN and email each match a different existing user — conflict"
                    )

                username_base = f"{first_name} {last_name}"

                if teacher_by_cin or user_by_email:
                    # --- update path ---
                    existing_user = (
                        teacher_by_cin.user if teacher_by_cin else user_by_email
                    )
                    existing_user.email = email
                    new_uname = _unique_username(username_base, exclude_pk=existing_user.pk)
                    existing_user.username = new_uname
                    existing_user.save()

                    teacher_obj = (
                        teacher_by_cin
                        if teacher_by_cin
                        else Teachers.objects.filter(user=existing_user).first()
                    )
                    if teacher_obj:
                        teacher_obj.ncin = cin
                        teacher_obj.department = department
                        teacher_obj.age = age
                        teacher_obj.save()
                    else:
                        Teachers.objects.create(
                            user=existing_user,
                            ncin=cin,
                            department=department,
                            age=age,
                        )
                    updated += 1
                else:
                    # --- create path ---
                    uname = _unique_username(username_base)
                    user = Users(email=email, username=uname, role=UserRole.TEACHER)
                    user.set_password(cin)
                    user.save()
                    Teachers.objects.create(
                        user=user, ncin=cin, department=department, age=age
                    )
                    created += 1

        except Exception as exc:
            errors.append(f"Row {row_num}: {exc}")
            skipped += 1

    _sync_departments_from_teachers()
    return created, updated, skipped, errors


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def import_students(request):
    try:
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=400)
        if not file.name.endswith('.xlsx'):
            return Response({"error": "File must be .xlsx format"}, status=400)

        df = pd.read_excel(file)
        if df.empty:
            return Response({"error": "File is empty"}, status=400)

        created, updated, skipped, errors = _import_students_from_df(df)

        return Response(
            {
                "message": "Import completed",
                "created": created,
                "updated": updated,
                "skipped": skipped,
                "total_rows": created + updated + skipped,
                "errors": errors,
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@extend_schema(tags=['Admin Panel'], request=OpenApiTypes.OBJECT, responses=GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def import_teachers(request):
    try:
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=400)
        if not file.name.endswith('.xlsx'):
            return Response({"error": "File must be .xlsx format"}, status=400)

        df = pd.read_excel(file)
        if df.empty:
            return Response({"error": "File is empty"}, status=400)

        created, updated, skipped, errors = _import_teachers_from_df(df)

        return Response(
            {
                "message": "Import completed",
                "created": created,
                "updated": updated,
                "skipped": skipped,
                "total_rows": created + updated + skipped,
                "errors": errors,
            },
            status=200,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)
