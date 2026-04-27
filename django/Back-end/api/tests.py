import io

import pandas as pd
from django.contrib.auth.hashers import check_password
from django.test import TestCase
from rest_framework.test import APIClient

from api.models import Classes, Departments, ForumAnswers, ForumQuestions, Students, Teachers, UserRole, Users
from api.admin_panel.import_views import _import_students_from_df, _import_teachers_from_df


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_admin(**kwargs):
    return Users.objects.create(
        email=kwargs.get("email", "admin@test.com"),
        username=kwargs.get("username", "Admin Test"),
        password="admin123",
        role=UserRole.ADMIN,
    )


def _make_student_user(**kwargs):
    u = Users.objects.create(
        email=kwargs.get("email", "student@test.com"),
        username=kwargs.get("username", "Student One"),
        password="pass123",
        role=UserRole.STUDENT,
    )
    return u


def _student_df(**overrides):
    row = {
        "cin": "12345678",
        "first_name": "Alice",
        "last_name": "Dupont",
        "email": "alice@test.com",
        **overrides,
    }
    return pd.DataFrame([row])


def _teacher_df(**overrides):
    row = {
        "cin": "87654321",
        "first_name": "Bob",
        "last_name": "Martin",
        "email": "bob@test.com",
        "department": "Informatique",
        "age": 35,
        **overrides,
    }
    return pd.DataFrame([row])


# ---------------------------------------------------------------------------
# Existing M4 tests (unchanged)
# ---------------------------------------------------------------------------

class Milestone4ApiTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # TimetablePublications and TimetableTelemetry use managed=False so Django
        # never creates their tables. Create them manually for the test run.
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS timetable_publications (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    is_published boolean NOT NULL DEFAULT false,
                    published_at timestamptz,
                    published_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
                    updated_at timestamptz NOT NULL DEFAULT now()
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS timetable_telemetry (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
                    role varchar(20),
                    event_name varchar(120) NOT NULL,
                    route varchar(180),
                    payload jsonb,
                    created_at timestamptz NOT NULL DEFAULT now()
                )
            """)

    def setUp(self):
        self.client = APIClient()
        self.admin = _make_admin(email="admin-m4@test.com", username="Admin M4")
        self.client.force_authenticate(user=self.admin)

    def test_timetable_status_endpoint_returns_payload(self):
        response = self.client.get("/api/admin/timetable/status/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("is_published", response.data)

    def test_timetable_telemetry_requires_event_name(self):
        response = self.client.post("/api/admin/timetable/telemetry/", {}, format="json")
        self.assertEqual(response.status_code, 400)


# ---------------------------------------------------------------------------
# Student import tests
# ---------------------------------------------------------------------------

class StudentImportTests(TestCase):
    def test_creates_user_with_hashed_cin_password(self):
        created, updated, skipped, errors = _import_students_from_df(_student_df())
        self.assertEqual(created, 1, errors)
        self.assertEqual(updated, 0)
        self.assertEqual(skipped, 0)
        self.assertEqual(errors, [])

        user = Users.objects.get(email="alice@test.com")
        self.assertEqual(user.role, UserRole.STUDENT)
        self.assertTrue(check_password("12345678", user.password))
        student = Students.objects.get(user=user)
        self.assertEqual(student.ncin, "12345678")

    def test_updates_existing_user_by_email(self):
        # pre-create user
        u = Users.objects.create(email="alice@test.com", username="Old Name", password="old", role=UserRole.STUDENT)
        Students.objects.create(user=u, ncin="12345678")

        created, updated, skipped, errors = _import_students_from_df(_student_df())
        self.assertEqual(created, 0, errors)
        self.assertEqual(updated, 1)
        u.refresh_from_db()
        self.assertEqual(u.username, "Alice Dupont")

    def test_updates_existing_user_by_cin(self):
        u = Users.objects.create(email="other@test.com", username="Alice Dupont", password="old", role=UserRole.STUDENT)
        Students.objects.create(user=u, ncin="12345678")

        df = _student_df(email="alice@new.com")
        created, updated, skipped, errors = _import_students_from_df(df)
        self.assertEqual(created, 0, errors)
        self.assertEqual(updated, 1)
        u.refresh_from_db()
        self.assertEqual(u.email, "alice@new.com")

    def test_rejects_invalid_cin(self):
        created, updated, skipped, errors = _import_students_from_df(_student_df(cin="ABC"))
        self.assertEqual(skipped, 1)
        self.assertTrue(any("CIN" in e for e in errors))

    def test_rejects_invalid_email(self):
        created, updated, skipped, errors = _import_students_from_df(_student_df(email="not-an-email"))
        self.assertEqual(skipped, 1)
        self.assertTrue(any("email" in e.lower() for e in errors))

    def test_missing_required_column_returns_error(self):
        df = pd.DataFrame([{"first_name": "X", "last_name": "Y", "email": "x@t.com"}])
        created, updated, skipped, errors = _import_students_from_df(df)
        self.assertEqual(created, 0)
        self.assertTrue(any("Missing" in e for e in errors))

    def test_bad_row_does_not_block_good_rows(self):
        df = pd.DataFrame([
            {"cin": "BADCIN!!", "first_name": "Bad", "last_name": "Row", "email": "bad@test.com"},
            {"cin": "11223344", "first_name": "Good", "last_name": "Row", "email": "good@test.com"},
        ])
        created, updated, skipped, errors = _import_students_from_df(df)
        self.assertEqual(created, 1)
        self.assertEqual(skipped, 1)

    def test_resolves_class_from_token(self):
        classe = Classes.objects.create(niveau="1", classe_section="Prépa", classe_num="1")
        df = _student_df(**{"class": "1-Prépa-1"})
        created, updated, skipped, errors = _import_students_from_df(df)
        self.assertEqual(created, 1, errors)
        student = Students.objects.get(ncin="12345678")
        self.assertEqual(student.class_id_id, classe.id)

    def test_invalid_class_token_skips_row(self):
        df = _student_df(**{"class": "NOT-VALID"})
        created, updated, skipped, errors = _import_students_from_df(df)
        self.assertEqual(skipped, 1)

    def test_class_not_found_skips_row(self):
        df = _student_df(**{"class": "9-Prépa-99"})
        created, updated, skipped, errors = _import_students_from_df(df)
        self.assertEqual(skipped, 1)

    def test_cin_email_conflict_skips_row(self):
        u1 = Users.objects.create(email="u1@test.com", username="User One", password="x", role=UserRole.STUDENT)
        u2 = Users.objects.create(email="alice@test.com", username="User Two", password="x", role=UserRole.STUDENT)
        Students.objects.create(user=u1, ncin="12345678")
        # same CIN matches u1, email matches u2 → conflict
        created, updated, skipped, errors = _import_students_from_df(_student_df())
        self.assertEqual(skipped, 1)
        self.assertTrue(any("conflict" in e.lower() for e in errors))


# ---------------------------------------------------------------------------
# Teacher import tests
# ---------------------------------------------------------------------------

class TeacherImportTests(TestCase):
    def test_creates_teacher_with_hashed_cin_password(self):
        created, updated, skipped, errors = _import_teachers_from_df(_teacher_df())
        self.assertEqual(created, 1, errors)
        self.assertEqual(skipped, 0)

        user = Users.objects.get(email="bob@test.com")
        self.assertEqual(user.role, UserRole.TEACHER)
        self.assertTrue(check_password("87654321", user.password))
        teacher = Teachers.objects.get(user=user)
        self.assertEqual(teacher.ncin, "87654321")
        self.assertEqual(teacher.department, "Informatique")
        self.assertEqual(teacher.age, 35)

    def test_auto_syncs_department(self):
        _import_teachers_from_df(_teacher_df())
        self.assertTrue(Departments.objects.filter(name="Informatique").exists())

    def test_rejects_age_out_of_range(self):
        _, _, skipped, errors = _import_teachers_from_df(_teacher_df(age=15))
        self.assertEqual(skipped, 1)
        self.assertTrue(any("age" in e.lower() for e in errors))

    def test_rejects_missing_department(self):
        _, _, skipped, errors = _import_teachers_from_df(_teacher_df(department=""))
        self.assertEqual(skipped, 1)

    def test_updates_existing_teacher_by_cin(self):
        u = Users.objects.create(email="bob@test.com", username="Bob Martin", password="x", role=UserRole.TEACHER)
        Teachers.objects.create(user=u, ncin="87654321", department="Old Dept", age=30)
        created, updated, skipped, errors = _import_teachers_from_df(_teacher_df(age=40))
        self.assertEqual(updated, 1, errors)
        u.refresh_from_db()
        t = Teachers.objects.get(user=u)
        self.assertEqual(t.age, 40)

    def test_bad_row_does_not_block_good_rows(self):
        df = pd.DataFrame([
            {"cin": "BADCIN", "first_name": "X", "last_name": "Y", "email": "x@t.com", "department": "CS", "age": 30},
            {"cin": "11223355", "first_name": "Good", "last_name": "T", "email": "good@t.com", "department": "CS", "age": 30},
        ])
        created, updated, skipped, _ = _import_teachers_from_df(df)
        self.assertEqual(created, 1)
        self.assertEqual(skipped, 1)


# ---------------------------------------------------------------------------
# Schedule conflict detection tests
# ---------------------------------------------------------------------------

class ScheduleConflictTests(TestCase):
    """Test the existing _detect_schedule_conflicts helper via the import endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.admin = _make_admin(email="admin-sched@test.com", username="Admin Sched")
        self.client.force_authenticate(user=self.admin)

    def _make_xlsx(self, rows):
        df = pd.DataFrame(rows)
        buf = io.BytesIO()
        df.to_excel(buf, index=False)
        buf.seek(0)
        buf.name = "schedule.xlsx"
        return buf

    def test_teacher_overlap_detected(self):
        teacher_user = Users.objects.create(
            email="t1@test.com", username="Teacher One", password="x", role=UserRole.TEACHER
        )
        Teachers.objects.create(user=teacher_user, ncin="55667788", department="CS", age=35)
        Classes.objects.create(niveau="1", classe_section="Prépa", classe_num="1")
        Classes.objects.create(niveau="1", classe_section="Prépa", classe_num="2")

        rows = [
            {"jour": "Lundi", "heure-debut": "08:00", "heure-fin": "10:00",
             "matiere": "Maths", "professeur": "Teacher One", "classe": "1-Prépa-1", "salle": "A101"},
            {"jour": "Lundi", "heure-debut": "09:00", "heure-fin": "11:00",
             "matiere": "Info", "professeur": "Teacher One", "classe": "1-Prépa-2", "salle": "B202"},
        ]
        response = self.client.post(
            "/api/admin/timetable/import/dry-run/",
            {"file": self._make_xlsx(rows)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["valid"])
        self.assertTrue(len(response.data["conflicts"]) > 0)

    def test_no_conflict_passes(self):
        teacher_user = Users.objects.create(
            email="t2@test.com", username="Teacher Two", password="x", role=UserRole.TEACHER
        )
        Teachers.objects.create(user=teacher_user, ncin="99887766", department="CS", age=40)
        Classes.objects.create(niveau="1", classe_section="Prépa", classe_num="3")

        rows = [
            {"jour": "Lundi", "heure-debut": "08:00", "heure-fin": "10:00",
             "matiere": "Maths", "professeur": "Teacher Two", "classe": "1-Prépa-3", "salle": "A101"},
            {"jour": "Mardi", "heure-debut": "08:00", "heure-fin": "10:00",
             "matiere": "Info", "professeur": "Teacher Two", "classe": "1-Prépa-3", "salle": "A101"},
        ]
        response = self.client.post(
            "/api/admin/timetable/import/dry-run/",
            {"file": self._make_xlsx(rows)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["valid"])
        self.assertEqual(response.data["conflicts"], [])


# ---------------------------------------------------------------------------
# Student comment permission tests
# ---------------------------------------------------------------------------

class ForumPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student_user = Users.objects.create(
            email="stu@test.com", username="Stu Dent", password="x", role=UserRole.STUDENT
        )
        self.other_student = Users.objects.create(
            email="stu2@test.com", username="Stu Two", password="x", role=UserRole.STUDENT
        )
        self.teacher_user = Users.objects.create(
            email="teach@test.com", username="Teach Er", password="x", role=UserRole.TEACHER
        )
        self.question = ForumQuestions.objects.create(
            author=self.student_user, title="Q1", content="Content"
        )
        self.answer = ForumAnswers.objects.create(
            question=self.question, author=self.student_user, content="My answer"
        )

    def test_owner_can_delete_own_answer(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.delete(f"/api/admin/forum/answers/{self.answer.id}/delete/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(ForumAnswers.objects.filter(id=self.answer.id).exists())

    def test_other_student_cannot_delete_answer(self):
        self.client.force_authenticate(user=self.other_student)
        response = self.client.delete(f"/api/admin/forum/answers/{self.answer.id}/delete/")
        self.assertEqual(response.status_code, 403)
        self.assertTrue(ForumAnswers.objects.filter(id=self.answer.id).exists())

    def test_teacher_can_moderate_answer(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(f"/api/admin/forum/answers/{self.answer.id}/delete/")
        self.assertEqual(response.status_code, 200)

    def test_student_can_post_question(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            "/api/admin/forum/questions/create/",
            {"title": "New Q", "content": "Body"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_student_can_answer_question(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            "/api/admin/forum/questions/answer/",
            {"question_id": str(self.question.id), "content": "Reply"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_forum_question_detail_returns_answers(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f"/api/admin/forum/questions/{self.question.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("answers", response.data)
        self.assertEqual(len(response.data["answers"]), 1)


# ---------------------------------------------------------------------------
# Import via HTTP endpoint tests
# ---------------------------------------------------------------------------

class ImportEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = _make_admin(email="admin-imp@test.com", username="Admin Imp")
        self.client.force_authenticate(user=self.admin)

    def _xlsx(self, rows):
        buf = io.BytesIO()
        pd.DataFrame(rows).to_excel(buf, index=False)
        buf.seek(0)
        buf.name = "import.xlsx"
        return buf

    def test_student_import_endpoint_returns_report(self):
        rows = [{"cin": "22334455", "first_name": "Jean", "last_name": "Paul", "email": "jp@test.com"}]
        response = self.client.post(
            "/api/admin/import/students/",
            {"file": self._xlsx(rows)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("created", response.data)
        self.assertEqual(response.data["created"], 1)

    def test_teacher_import_endpoint_returns_report(self):
        rows = [{"cin": "66778899", "first_name": "Marie", "last_name": "Curie",
                 "email": "mc@test.com", "department": "Physique", "age": 45}]
        response = self.client.post(
            "/api/admin/import/teachers/",
            {"file": self._xlsx(rows)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["created"], 1)

    def test_non_xlsx_file_rejected(self):
        buf = io.BytesIO(b"col1,col2\na,b")
        buf.name = "data.csv"
        response = self.client.post(
            "/api/admin/import/students/",
            {"file": buf},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)

    def test_non_admin_cannot_import(self):
        student_user = Users.objects.create(
            email="student-imp@test.com", username="Stu Imp", password="x", role=UserRole.STUDENT
        )
        self.client.force_authenticate(user=student_user)
        rows = [{"cin": "11111111", "first_name": "A", "last_name": "B", "email": "ab@t.com"}]
        response = self.client.post(
            "/api/admin/import/students/",
            {"file": self._xlsx(rows)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 403)
