from __future__ import annotations

from datetime import timedelta
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import (
    AvailabilityContext,
    AvailabilityLevel,
    Departments,
    PFECampaignRooms,
    PFECampaigns,
    PFEJuryAssignments,
    PFESubjects,
    Students,
    TeacherAvailabilities,
    Teachers,
    UserRole,
    Users,
)

WEEKDAYS_DEFAULT = ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi"]


def _parse_time(value: str):
    return datetime.strptime(value, "%H:%M").time()


def _ensure_user(email: str, username: str, password: str, role: str) -> Users:
    user, _ = Users.objects.get_or_create(
        email=email,
        defaults={"username": username, "password": password, "role": role},
    )
    user.username = username
    user.role = role
    user.password = password
    user.save(update_fields=["username", "role", "password"])
    return user


def _ensure_teacher(
    *,
    email: str,
    username: str,
    password: str,
    department: str,
    ncin: str,
    age: int,
) -> Teachers:
    user = _ensure_user(email=email, username=username, password=password, role=UserRole.TEACHER)
    teacher, _ = Teachers.objects.get_or_create(
        user=user,
        defaults={"department": department, "ncin": ncin, "age": age},
    )
    if teacher.department != department:
        teacher.department = department
        teacher.save(update_fields=["department"])
    return teacher


def _ensure_student(email: str, username: str, password: str) -> Students:
    user = _ensure_user(email=email, username=username, password=password, role=UserRole.STUDENT)
    student, _ = Students.objects.get_or_create(
        user=user,
        defaults={"class_id": None, "parent_contact": None, "access_status": True},
    )
    return student


class Command(BaseCommand):
    help = "Seed a ready-to-test PFE session scenario: one department head, one teacher with 3 supervised PFEs."

    def add_arguments(self, parser):
        parser.add_argument("--department", type=str, default="PFE Demo Department")

    def handle(self, *args, **options):
        department_name = str(options["department"]).strip()

        with transaction.atomic():
            department, _ = Departments.objects.get_or_create(name=department_name)

            head_teacher = _ensure_teacher(
                email="chef.department.demo@issat.local",
                username="Chef Department Demo",
                password="DemoPfe123",
                department=department.name,
                ncin="92000001",
                age=45,
            )
            main_teacher = _ensure_teacher(
                email="teacher.demo@issat.local",
                username="Teacher Demo",
                password="DemoPfe123",
                department=department.name,
                ncin="92000002",
                age=38,
            )
            jury_one = _ensure_teacher(
                email="jury.one.demo@issat.local",
                username="Jury One Demo",
                password="DemoPfe123",
                department=department.name,
                ncin="92000003",
                age=41,
            )
            jury_two = _ensure_teacher(
                email="jury.two.demo@issat.local",
                username="Jury Two Demo",
                password="DemoPfe123",
                department=department.name,
                ncin="92000004",
                age=40,
            )

            department.head = head_teacher
            department.save(update_fields=["head"])

            start_date = timezone.localdate() + timedelta(days=1)
            end_date = start_date + timedelta(days=14)

            campaign, _ = PFECampaigns.objects.update_or_create(
                department=department,
                name=f"PFE Session Demo {department.name}",
                defaults={
                    "start_date": start_date,
                    "end_date": end_date,
                    "day_start_time": _parse_time("08:00"),
                    "day_end_time": _parse_time("16:00"),
                    "slot_duration_minutes": 60,
                    "break_duration_minutes": 0,
                    "weekdays": WEEKDAYS_DEFAULT,
                    "daily_cap_per_teacher": 3,
                    "head_can_start": True,
                    "availability_open": False,
                    "schedule_generated": False,
                    "generated_at": None,
                    "is_active": True,
                    "created_by": None,
                },
            )
            PFECampaigns.objects.filter(department=department).exclude(id=campaign.id).update(is_active=False)

            PFECampaignRooms.objects.filter(campaign=campaign).delete()
            PFECampaignRooms.objects.bulk_create(
                [
                    PFECampaignRooms(campaign=campaign, room_name="A1"),
                    PFECampaignRooms(campaign=campaign, room_name="A2"),
                ]
            )

            TeacherAvailabilities.objects.filter(
                teacher__in=[head_teacher, jury_one, jury_two],
                context=AvailabilityContext.PFE,
                campaign=campaign,
            ).delete()
            default_availabilities = []
            for teacher in [head_teacher, jury_one, jury_two]:
                for day in WEEKDAYS_DEFAULT:
                    default_availabilities.append(
                        TeacherAvailabilities(
                            teacher=teacher,
                            context=AvailabilityContext.PFE,
                            campaign=campaign,
                            day_of_week=day,
                            start_time=_parse_time("08:00"),
                            end_time=_parse_time("16:00"),
                            level=AvailabilityLevel.PREFERRED,
                        )
                    )
            TeacherAvailabilities.objects.bulk_create(default_availabilities)

            PFEJuryAssignments.objects.filter(pfe_subject__supervisor=main_teacher).delete()
            PFESubjects.objects.filter(supervisor=main_teacher, title__startswith="Demo PFE ").delete()

            demo_students = [
                _ensure_student("student.demo.one@issat.local", "Student Demo One", "DemoPfe123"),
                _ensure_student("student.demo.two@issat.local", "Student Demo Two", "DemoPfe123"),
                _ensure_student("student.demo.three@issat.local", "Student Demo Three", "DemoPfe123"),
            ]

            PFESubjects.objects.bulk_create(
                [
                    PFESubjects(
                        title=f"Demo PFE {idx + 1}",
                        student_name=student.user.username,
                        student=student,
                        supervisor=main_teacher,
                        created_by=None,
                    )
                    for idx, student in enumerate(demo_students)
                ]
            )

        self.stdout.write(self.style.SUCCESS("Demo PFE session seeded."))
        self.stdout.write(f"Department: {department.name}")
        self.stdout.write("Department head account: chef.department.demo@issat.local / DemoPfe123")
        self.stdout.write("Teacher account: teacher.demo@issat.local / DemoPfe123 (3 supervised PFEs)")
