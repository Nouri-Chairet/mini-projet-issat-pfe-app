# StudyWithUs - Backend & Frontend Routing Documentation

## 1) Project Scope

This platform supports ISSAT university operations for:

- Account management (admin, teacher, student)
- Class and schedule management
- Attendance and access control
- Lesson/announcement publishing
- Student-teacher discussion forum
- Exam calendar processing from Excel with PDF output
- PFE subject import, jury planning, and quota tracking

## 2) Core Business Rules

- If `classe_section = Prépa`, then `niveau <= 2`
- If `classe_section != Prépa`, then `niveau <= 3`
- Teacher required surveillance hours = teacher weekly teaching hours
- Teacher required PFE presentation participation = `3 x supervised_subjects`

---

## 3) Authentication Endpoints (`/api/auth/...`)

### 3.1 POST `/api/auth/login/`

**Purpose**

- Authenticates user by email/password and returns JWT tokens.

**Auth required**

- No

**Request body**

```json
{
  "email": "user@issat.tn",
  "password": "secret"
}
```

**Success response**

```json
{
  "refresh": "...",
  "access": "..."
}
```

**Error cases**

- `400`: invalid credentials
- `404`: user not found

---

### 3.2 POST `/api/auth/register/`

**Purpose**

- Admin creates new users (admin/teacher/student).

**Auth required**

- Yes (`IsAuthenticated + IsAdmin`)

**Request body (base)**

```json
{
  "email": "new@issat.tn",
  "password": "secret",
  "username": "Full Name",
  "role": "admin|teacher|student"
}
```

**Additional fields by role**

- `student`: `class_id`, `parent_contact`
- `teacher`: `department`, `ncin`, `age`

**Success response**

- Returns token pair for created user.

**Error cases**

- `400`: email exists, invalid role
- `404`: class not found (student)

---

### 3.3 PATCH `/api/auth/update-pass/`

**Purpose**

- Changes password using `old_password` and `new_password`.

**Auth required**

- Backend currently expects authenticated `request.user`.

**Request body**

```json
{
  "old_password": "old",
  "new_password": "new"
}
```

**Success response**

```json
{ "detail": "Password updated successfully" }
```

**Error cases**

- `400`: old password incorrect

---

### 3.4 PATCH `/api/auth/update-account/`

**Purpose**

- Updates current profile based on user role.

**Auth required**

- Yes (`IsAuthenticated`)

**Notes**

- Admin updates directly on `Users`
- Teacher updates through `TeacherSerializer`
- Student uses user serializer path

---

### 3.5 POST `/api/auth/forgot-password/`

**Purpose**

- Sends reset email with tokenized URL.

**Auth required**

- No

**Request body**

```json
{ "email": "user@issat.tn" }
```

**Success response**

```json
{ "detail": "Password reset link sent." }
```

---

### 3.6 GET `/api/auth/forget-password/confirme/?uid=<uid>&token=<token>`

**Purpose**

- Verifies reset link and redirects to frontend page:
- `http://localhost:5173/change-password?uid=...&token=...`

**Auth required**

- No

---

### 3.7 POST `/api/auth/forget_password/reset/`

**Purpose**

- Final reset password with `uid`, `token`, `new_password`.

**Auth required**

- No

**Request body**

```json
{
  "uid": "...",
  "token": "...",
  "new_password": "new"
}
```

---

### 3.8 POST `/api/auth/refresh/`

**Purpose**

- Creates fresh access/refresh tokens from refresh token.

**Auth required**

- No

**Request body**

```json
{ "refresh": "..." }
```

---

### 3.9 GET `/api/auth/user/student/`

**Purpose**

- Returns current authenticated student profile.

**Auth required**

- Yes (`IsAuthenticated`)

**Error cases**

- `403`: user is not student
- `404`: student profile missing

---

### 3.10 GET `/api/auth/user/teacher/`

**Purpose**

- Returns current authenticated teacher profile.

**Auth required**

- Yes (`IsAuthenticated`)

**Error cases**

- `403`: user is not teacher
- `404`: teacher profile missing

---

## 4) Admin & Academic Endpoints (`/api/admin/...`)

### 4.1 POST `/api/admin/add-classes/`

**Purpose**

- Batch creates classes with section-level constraints.

**Auth required**

- Yes (`IsAuthenticated + IsAdmin`)

**Request body**

```json
{
  "level": 2,
  "section": "Prépa",
  "nb": 3
}
```

**Behavior**

- Creates classes `classe_num = 1..nb`
- Validates `section` and `level`

---

### 4.2 GET `/api/admin/get-classes/`

**Purpose**

- Lists all classes.

**Auth required**

- Yes (`IsAdminOrTeacher`)

---

### 4.3 POST `/api/admin/upload/schedule/`

**Purpose**

- Imports schedule rows from Excel.

**Auth required**

- Yes (`IsAdmin`)

**Excel columns required**

- `jour, heure-debut, heure-fin, matiere, professeur, classe, salle`

**Class token format**

- `niveau-section-classe_num`

---

### 4.4 GET `/api/admin/classes/schedule/`

**Purpose**

- Retrieves schedule for one class.

**Auth required**

- Yes (`IsAdminOrStudent`)

**Query options**

- Option A: `class_id`
- Option B: `niveau`, `section`, `classe_num`

---

### 4.5 GET `/api/admin/teacher/schedule/?teacher_id=<uuid>`

**Purpose**

- Retrieves one teacher schedule.

**Auth required**

- Yes (`IsAdminOrTeacher`)

---

### 4.6 GET `/api/admin/teacher/get/`

**Purpose**

- Lists teachers.

**Auth required**

- Yes (`IsAdmin`)

---

### 4.7 GET `/api/admin/students/get/`

**Purpose**

- Lists students for one class.

**Auth required**

- Yes (`IsAuthenticated`)

**Query options**

- Option A: `class_id`
- Option B: `niveau`, `section`, `classe_num`

---

### 4.8 PATCH `/api/admin/students/update/`

**Purpose**

- Updates student account/profile fields.

**Auth required**

- Yes (`IsAdmin`)

**Request body**

```json
{
  "student_id": "...",
  "access_status": true,
  "parent_contact": "...",
  "email": "...",
  "password": "..."
}
```

---

### 4.9 DELETE `/api/admin/students/delete/?student_id=<uuid>`

**Purpose**

- Deletes student record.

**Auth required**

- Yes (`IsAdmin`)

---

### 4.10 POST `/api/admin/post/upload/`

**Purpose**

- Creates lesson or announcement post with PDF upload.

**Auth required**

- Yes (`IsAdminOrTeacher`)

**Behavior**

- If `class_id` is provided => `type = lesson`
- If `class_id` omitted => `type = announcement` (teacher blocked)

**Request**

- Multipart form-data: `title`, `content`, `file(.pdf)`, optional `class_id`

---

### 4.11 DELETE `/api/admin/post/delete/?post_id=<uuid>`

**Purpose**

- Deletes post.

**Auth required**

- Yes (`IsAdmin`)

---

### 4.12 PATCH `/api/admin/posts/update/`

**Purpose**

- Updates post title/content/file.

**Auth required**

- Yes (`IsAdmin`)

---

### 4.13 GET `/api/admin/posts/get/announcement/`

**Purpose**

- Lists announcement posts.

**Auth required**

- Yes (`IsAuthenticated`)

---

### 4.14 GET `/api/admin/posts/get/lessons/?classe_id=<uuid>`

**Purpose**

- Lists lesson posts for one class.

**Auth required**

- Yes (`IsAuthenticated`)

---

### 4.15 PATCH `/api/admin/resolve_absence/` _(view exists; route not currently exposed)_

**Purpose**

- Reactivates student access (`access_status=true`).

**Auth required**

- Yes (`IsAdmin`)

---

## 5) Forum Endpoints (`/api/admin/forum/...`)

### 5.1 POST `/api/admin/forum/questions/create/`

**Purpose**

- Creates forum question (student/teacher/admin).

**Auth required**

- Yes (`IsAuthenticated`)

**Request body**

```json
{
  "title": "Question title",
  "content": "Question details",
  "class_id": "optional-class-uuid"
}
```

---

### 5.2 POST `/api/admin/forum/questions/answer/`

**Purpose**

- Adds answer to an existing question.

**Auth required**

- Yes (`IsAuthenticated`)

**Request body**

```json
{
  "question_id": "question-uuid",
  "content": "Answer text"
}
```

---

### 5.3 GET `/api/admin/forum/questions/?class_id=<uuid>`

**Purpose**

- Lists forum questions (optionally filtered by class).

**Auth required**

- Yes (`IsAuthenticated`)

---

## 6) Surveillance Endpoints (`/api/admin/teacher/...`)

### 6.1 POST `/api/admin/teacher/availability/set/`

**Purpose**

- Saves teacher availability slots for surveillance or PFE presentations.

**Auth required**

- Yes (`IsAdminOrTeacher`)

**Request body**

```json
{
  "context": "surveillance|pfe",
  "day_of_week": "Lundi",
  "start_time": "08:30:00",
  "end_time": "10:30:00",
  "teacher_id": "required only for admin"
}
```

---

### 6.2 GET `/api/admin/teacher/surveillance-load/?teacher_id=<uuid>`

**Purpose**

- Returns computed load summary:
  - `weekly_teaching_hours`
  - `required_surveillance_hours`
  - `assigned_surveillance_hours`
  - `remaining_surveillance_hours`

**Auth required**

- Yes (`IsAdminOrTeacher`)

---

## 7) Exam Calendar Endpoints (`/api/admin/exam-calendar/...`)

### 7.1 POST `/api/admin/exam-calendar/manual/`

**Purpose**

- Creates one exam session manually + optional invigilator assignments.

**Auth required**

- Yes (`IsAdmin`)

**Request body**

```json
{
  "class_id": "class-uuid",
  "subject": "Math",
  "exam_date": "2026-05-20",
  "start_time": "09:00:00",
  "end_time": "11:00:00",
  "room": "B12",
  "teacher_ids": ["teacher-user-uuid-1", "teacher-user-uuid-2"]
}
```

---

### 7.2 POST `/api/admin/exam-calendar/excel/`

**Purpose**

- Imports exam sessions from Excel, assigns listed teachers, then builds and uploads PDF.

**Auth required**

- Yes (`IsAdmin`)

**Excel columns**

- `matiere, classe, enseignants, date, heure-debut, heure-fin, salle`

**Formats**

- `classe`: `niveau-section-classe_num`
- `enseignants`: semicolon-separated usernames

**Success response**

```json
{
  "message": "Exam calendar processed",
  "created_count": 12,
  "pdf_url": "https://..."
}
```

---

## 8) PFE Endpoints (`/api/admin/pfe/...`)

### 8.1 POST `/api/admin/pfe/excel/`

**Purpose**

- Imports PFE subjects and supervisors from Excel.

**Auth required**

- Yes (`IsAdmin`)

**Accepted column sets**

1. `nom de sujet PFE`, `nom de l’étudiant`, `nom de l’encadreur`
2. `sujet_pfe`, `etudiant`, `encadreur`

---

### 8.2 POST `/api/admin/pfe/jury/assign/`

**Purpose**

- Assigns jury members for a PFE subject.
- Automatically ensures encadreur assignment (supervisor role).

**Auth required**

- Yes (`IsAdmin`)

**Request body**

```json
{
  "pfe_subject_id": "subject-uuid",
  "rapporteur_id": "teacher-user-uuid",
  "president_id": "teacher-user-uuid",
  "date": "2026-06-10",
  "start_time": "14:00:00",
  "end_time": "15:00:00",
  "room": "Salle Soutenance 1"
}
```

---

### 8.3 GET `/api/admin/pfe/teacher-quota/?teacher_id=<uuid>`

**Purpose**

- Returns quota and progress for one teacher:
  - `supervised_subjects`
  - `required_presentations`
  - `assigned_presentations`
  - `remaining_presentations`

**Auth required**

- Yes (`IsAdminOrTeacher`)

---

## 9) Teacher Endpoints (`/api/teacher/...`)

### 9.1 POST `/api/teacher/make_presence/`

**Purpose**

- Teacher marks attendance for students in one schedule.

**Auth required**

- Yes (`IsTeacher`)

**Request body**

```json
{
  "schedule_id": "schedule-uuid",
  "students": [
    { "student_id": "student-user-uuid", "presence": true },
    { "student_id": "student-user-uuid", "presence": false }
  ]
}
```

---

### 9.2 GET `/api/teacher/get_absence_made/`

**Purpose**

- Lists attendance rows marked by teacher where status is absent.

**Auth required**

- Yes (`IsTeacher`)

---

### 9.3 GET `/api/teacher/get_current_session/`

**Purpose**

- Returns session currently active for teacher according to current day/time.

**Auth required**

- Yes (`IsTeacher`)

---

### 9.4 GET `/api/teacher/get_classes/`

**Purpose**

- Returns distinct classes assigned to teacher from schedules.

**Auth required**

- Yes (`IsTeacher`)

---

## 10) Frontend Routes to Create (Exact Project Blueprint)

> Suggested base: React Router style path design for your current backend.

### 10.1 Public Routes

- `/login` -> Login page (`POST /api/auth/login/`)
- `/forgot-password` -> Request reset email (`POST /api/auth/forgot-password/`)
- `/change-password` -> Reset form (`POST /api/auth/forget_password/reset/`)

### 10.2 Shared Authenticated Routes

- `/profile` -> Current user profile (`GET /api/auth/user/student/` or `/user/teacher/`)
- `/account/settings` -> Update account/password (`PATCH /api/auth/update-account/`, `/update-pass/`)
- `/announcements` -> Announcements feed (`GET /api/admin/posts/get/announcement/`)
- `/forum` -> Questions list (`GET /api/admin/forum/questions/`)
- `/forum/new` -> Create question (`POST /api/admin/forum/questions/create/`)
- `/forum/:questionId` -> Question details + answers (`GET /api/admin/forum/questions/` + `POST /answer/`)

### 10.3 Student Routes

- `/student/dashboard`
- `/student/schedule` -> class schedule (`GET /api/admin/classes/schedule/`)
- `/student/lessons` -> class lessons (`GET /api/admin/posts/get/lessons/`)
- `/student/attendance` -> attendance status (from teacher marking outcomes)

### 10.4 Teacher Routes

- `/teacher/dashboard`
- `/teacher/current-session` -> (`GET /api/teacher/get_current_session/`)
- `/teacher/classes` -> (`GET /api/teacher/get_classes/`)
- `/teacher/attendance/mark` -> (`POST /api/teacher/make_presence/`)
- `/teacher/attendance/history` -> (`GET /api/teacher/get_absence_made/`)
- `/teacher/schedule` -> (`GET /api/admin/teacher/schedule/?teacher_id=...`)
- `/teacher/surveillance/load` -> (`GET /api/admin/teacher/surveillance-load/`)
- `/teacher/availability` -> (`POST /api/admin/teacher/availability/set/`)
- `/teacher/pfe-quota` -> (`GET /api/admin/pfe/teacher-quota/`)

### 10.5 Admin Routes

- `/admin/dashboard`
- `/admin/users/register` -> (`POST /api/auth/register/`)
- `/admin/classes` -> list/create (`GET/POST` on class APIs)
- `/admin/classes/schedule/import` -> (`POST /api/admin/upload/schedule/`)
- `/admin/classes/:classId/schedule` -> (`GET /api/admin/classes/schedule/`)
- `/admin/teachers` -> (`GET /api/admin/teacher/get/`)
- `/admin/teachers/:teacherId/schedule` -> (`GET /api/admin/teacher/schedule/`)
- `/admin/students` -> (`GET /api/admin/students/get/`)
- `/admin/students/:studentId/edit` -> (`PATCH /api/admin/students/update/`)
- `/admin/students/:studentId/delete` -> (`DELETE /api/admin/students/delete/`)
- `/admin/posts/new` -> (`POST /api/admin/post/upload/`)
- `/admin/posts/:postId/edit` -> (`PATCH /api/admin/posts/update/`)
- `/admin/posts/:postId/delete` -> (`DELETE /api/admin/post/delete/`)
- `/admin/exams/manual` -> (`POST /api/admin/exam-calendar/manual/`)
- `/admin/exams/import` -> (`POST /api/admin/exam-calendar/excel/`)
- `/admin/pfe/import` -> (`POST /api/admin/pfe/excel/`)
- `/admin/pfe/jury` -> (`POST /api/admin/pfe/jury/assign/`)
- `/admin/pfe/quotas` -> (`GET /api/admin/pfe/teacher-quota/`)

### 10.6 Route Guards (Recommended)

- `PublicOnlyGuard`: `/login`, `/forgot-password`, `/change-password`
- `AuthGuard`: all authenticated routes
- `RoleGuard('student')`: `/student/**`
- `RoleGuard('teacher')`: `/teacher/**`
- `RoleGuard('admin')`: `/admin/**`

---

## 11) Response & Error Conventions

Common success codes:

- `200`, `201`

Common error codes:

- `400` invalid input
- `403` forbidden by role
- `404` not found
- `500` server error

Typical error shape:

```json
{ "error": "message" }
```

or

```json
{ "detail": "message" }
```

---

## 12) Delivery Notes

- This documentation reflects the current backend routes in:
  - `api/auth/urls.py`
  - `api/admin_panel/urls.py`
  - `api/teacher_panel/urls.py`
- Frontend route plan is intentionally aligned 1:1 with existing APIs for fast implementation.
