#!/usr/bin/env python3

from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def build_pdf(output_path: Path):
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontSize=22,
        textColor=colors.HexColor("#1f4e79"),
        spaceAfter=18,
    )
    h_style = ParagraphStyle(
        "HCustom",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#1f4e79"),
        spaceBefore=12,
        spaceAfter=8,
    )
    p_style = ParagraphStyle(
        "PCustom",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        spaceAfter=6,
    )
    table_text = ParagraphStyle(
        "TableText",
        parent=styles["BodyText"],
        fontSize=8.2,
        leading=10,
    )

    def build_table(rows, col_widths):
        normalized = []
        for row in rows:
            normalized.append([Paragraph(str(cell), table_text) for cell in row])
        table = Table(normalized, colWidths=col_widths, repeatRows=1)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f4e79")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        return table

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    story = []
    story.append(Paragraph("StudyWithUs - API & Frontend Route Maps", title_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", p_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("1. Domain Rules", h_style))
    for line in [
        "- section = Prépa => niveau max 2",
        "- section != Prépa => niveau max 3",
        "- Required teacher surveillance hours = weekly teaching hours",
        "- Required teacher PFE presentations = 3 x number of supervised subjects",
    ]:
        story.append(Paragraph(line, p_style))

    story.append(Paragraph("2. Main Models", h_style))
    models_table = build_table(
        [
            ["Group", "Models"],
            ["Core", "Users, Teachers, Students, Classes, Schedules, Posts, Attendance"],
            ["Forum", "ForumQuestions, ForumAnswers"],
            ["Department", "Departments"],
            ["Availability", "TeacherAvailabilities"],
            ["Exam", "ExamSessions, ExamSurveillanceAssignments"],
            ["PFE", "PFESubjects, PFEPresentationSlots, PFEJuryAssignments"],
        ],
        col_widths=[4 * cm, 12.5 * cm],
    )
    story.append(models_table)

    story.append(PageBreak())
    story.append(Paragraph("3. Backend API Endpoint Map", h_style))
    story.append(Paragraph("All endpoints are mapped below by module, including method and main use-case.", p_style))

    auth_rows = [
        ["Method", "Path", "Use-case"],
        ["POST", "/api/auth/login/", "Authenticate and issue JWT tokens"],
        ["POST", "/api/auth/register/", "Admin registers admin/teacher/student accounts"],
        ["PATCH", "/api/auth/update-pass/", "Change current user password"],
        ["PATCH", "/api/auth/update-account/", "Update authenticated user profile"],
        ["POST", "/api/auth/forgot-password/", "Send password reset email"],
        ["GET", "/api/auth/forget-password/confirme/", "Validate reset link and redirect frontend"],
        ["POST", "/api/auth/forget_password/reset/", "Reset password with uid/token"],
        ["POST", "/api/auth/refresh/", "Refresh access/refresh tokens"],
        ["GET", "/api/auth/user/student/", "Read authenticated student profile"],
        ["GET", "/api/auth/user/teacher/", "Read authenticated teacher profile"],
    ]
    story.append(Paragraph("3.1 Authentication", h_style))
    story.append(build_table(auth_rows, [2 * cm, 7.2 * cm, 7.3 * cm]))

    admin_rows = [
        ["Method", "Path", "Use-case"],
        ["POST", "/api/admin/add-classes/", "Create classes with section-level constraints"],
        ["GET", "/api/admin/get-classes/", "List classes"],
        ["POST", "/api/admin/upload/schedule/", "Import teaching schedule from Excel"],
        ["GET", "/api/admin/classes/schedule/", "Get schedule for one class"],
        ["GET", "/api/admin/teacher/schedule/", "Get one teacher schedule"],
        ["GET", "/api/admin/teacher/get/", "List teachers"],
        ["GET", "/api/admin/students/get/", "List students for a class"],
        ["PATCH", "/api/admin/students/update/", "Update student account/profile/status"],
        ["DELETE", "/api/admin/students/delete/", "Delete student"],
        ["POST", "/api/admin/post/upload/", "Create lesson/announcement post with PDF"],
        ["DELETE", "/api/admin/post/delete/", "Delete post"],
        ["PATCH", "/api/admin/posts/update/", "Update post"],
        ["GET", "/api/admin/posts/get/announcement/", "List announcements"],
        ["GET", "/api/admin/posts/get/lessons/", "List lesson posts by class"],
        ["POST", "/api/admin/forum/questions/create/", "Create forum question"],
        ["POST", "/api/admin/forum/questions/answer/", "Add forum answer"],
        ["GET", "/api/admin/forum/questions/", "List forum questions"],
        ["POST", "/api/admin/teacher/availability/set/", "Set teacher availability (surveillance/PFE)"],
        ["GET", "/api/admin/teacher/surveillance-load/", "Get computed surveillance load"],
        ["POST", "/api/admin/exam-calendar/manual/", "Create one exam session manually"],
        ["POST", "/api/admin/exam-calendar/excel/", "Import exam calendar and output PDF URL"],
        ["POST", "/api/admin/pfe/excel/", "Import PFE subjects from Excel"],
        ["POST", "/api/admin/pfe/jury/assign/", "Assign PFE jury and optional slot"],
        ["GET", "/api/admin/pfe/teacher-quota/", "Get teacher PFE quota progress"],
    ]
    story.append(Paragraph("3.2 Admin Panel", h_style))
    story.append(build_table(admin_rows, [2 * cm, 7.2 * cm, 7.3 * cm]))

    teacher_rows = [
        ["Method", "Path", "Use-case"],
        ["POST", "/api/teacher/make_presence/", "Record attendance for students in one schedule"],
        ["GET", "/api/teacher/get_absence_made/", "List absences marked by current teacher"],
        ["GET", "/api/teacher/get_current_session/", "Get active session by day/time"],
        ["GET", "/api/teacher/get_classes/", "List classes taught by current teacher"],
    ]
    story.append(Paragraph("3.3 Teacher Panel", h_style))
    story.append(build_table(teacher_rows, [2 * cm, 7.2 * cm, 7.3 * cm]))

    story.append(PageBreak())
    story.append(Paragraph("4. Frontend Route Map", h_style))
    story.append(Paragraph("Recommended frontend routes aligned 1:1 with available backend APIs.", p_style))

    frontend_rows = [
        ["Area", "Frontend Route", "Primary backend API"],
        ["Public", "/login", "POST /api/auth/login/"],
        ["Public", "/forgot-password", "POST /api/auth/forgot-password/"],
        ["Public", "/change-password", "POST /api/auth/forget_password/reset/"],
        ["Shared", "/profile", "GET /api/auth/user/student/ or /user/teacher/"],
        ["Shared", "/account/settings", "PATCH /api/auth/update-account/ and /update-pass/"],
        ["Shared", "/announcements", "GET /api/admin/posts/get/announcement/"],
        ["Shared", "/forum", "GET /api/admin/forum/questions/"],
        ["Shared", "/forum/new", "POST /api/admin/forum/questions/create/"],
        ["Shared", "/forum/:questionId", "POST /api/admin/forum/questions/answer/"],
        ["Student", "/student/dashboard", "Dashboard aggregate calls"],
        ["Student", "/student/schedule", "GET /api/admin/classes/schedule/"],
        ["Student", "/student/lessons", "GET /api/admin/posts/get/lessons/"],
        ["Student", "/student/attendance", "Attendance-related views"],
        ["Teacher", "/teacher/dashboard", "Dashboard aggregate calls"],
        ["Teacher", "/teacher/current-session", "GET /api/teacher/get_current_session/"],
        ["Teacher", "/teacher/classes", "GET /api/teacher/get_classes/"],
        ["Teacher", "/teacher/attendance/mark", "POST /api/teacher/make_presence/"],
        ["Teacher", "/teacher/attendance/history", "GET /api/teacher/get_absence_made/"],
        ["Teacher", "/teacher/schedule", "GET /api/admin/teacher/schedule/"],
        ["Teacher", "/teacher/surveillance/load", "GET /api/admin/teacher/surveillance-load/"],
        ["Teacher", "/teacher/availability", "POST /api/admin/teacher/availability/set/"],
        ["Teacher", "/teacher/pfe-quota", "GET /api/admin/pfe/teacher-quota/"],
        ["Admin", "/admin/dashboard", "Dashboard aggregate calls"],
        ["Admin", "/admin/users/register", "POST /api/auth/register/"],
        ["Admin", "/admin/classes", "GET/POST classes endpoints"],
        ["Admin", "/admin/classes/schedule/import", "POST /api/admin/upload/schedule/"],
        ["Admin", "/admin/classes/:classId/schedule", "GET /api/admin/classes/schedule/"],
        ["Admin", "/admin/teachers", "GET /api/admin/teacher/get/"],
        ["Admin", "/admin/teachers/:teacherId/schedule", "GET /api/admin/teacher/schedule/"],
        ["Admin", "/admin/students", "GET /api/admin/students/get/"],
        ["Admin", "/admin/students/:studentId/edit", "PATCH /api/admin/students/update/"],
        ["Admin", "/admin/students/:studentId/delete", "DELETE /api/admin/students/delete/"],
        ["Admin", "/admin/posts/new", "POST /api/admin/post/upload/"],
        ["Admin", "/admin/posts/:postId/edit", "PATCH /api/admin/posts/update/"],
        ["Admin", "/admin/posts/:postId/delete", "DELETE /api/admin/post/delete/"],
        ["Admin", "/admin/exams/manual", "POST /api/admin/exam-calendar/manual/"],
        ["Admin", "/admin/exams/import", "POST /api/admin/exam-calendar/excel/"],
        ["Admin", "/admin/pfe/import", "POST /api/admin/pfe/excel/"],
        ["Admin", "/admin/pfe/jury", "POST /api/admin/pfe/jury/assign/"],
        ["Admin", "/admin/pfe/quotas", "GET /api/admin/pfe/teacher-quota/"],
    ]
    story.append(build_table(frontend_rows, [2.2 * cm, 5.8 * cm, 8.5 * cm]))

    story.append(PageBreak())
    story.append(Paragraph("5. Notes", h_style))
    for line in [
        "- Endpoint map reflects current urls.py declarations in auth, admin_panel, and teacher_panel modules.",
        "- Frontend routes are proposed to match existing backend capabilities and role guards.",
        "- For production, add route-level guards: public-only, authenticated, and role-specific admin/teacher/student guards.",
    ]:
        story.append(Paragraph(line, p_style))

    doc.build(story)


if __name__ == "__main__":
    output = Path("/home/nouri/mini-projet-issat-pfe-app/django/API_Documentation.pdf")
    build_pdf(output)
    print(f"Generated: {output}")
