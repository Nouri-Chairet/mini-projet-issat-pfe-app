from __future__ import annotations

import random
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.admin_panel.pfe_scheduler import _generate_candidate_slots, persist_pfe_assignments, plan_pfe_assignments
from api.models import (
    AvailabilityContext,
    AvailabilityLevel,
    Departments,
    PFECampaignRooms,
    PFECampaigns,
    PFEJuryAssignments,
    PFESubjects,
    PFETeacherQuotaOverrides,
    Students,
    TeacherAvailabilities,
    TeacherAvailabilityDateExceptions,
    Teachers,
    UserRole,
    Users,
)


WEEKDAYS_DEFAULT = ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi"]
ROOMS_DEFAULT = ["A1", "A2", "A3", "A4"]


def _parse_time(value: str):
    as_text = str(value).strip()
    fmt = "%H:%M:%S" if len(as_text) > 5 else "%H:%M"
    return datetime.strptime(as_text, fmt).time()


def _parse_date(value: str):
    return datetime.strptime(str(value).strip(), "%Y-%m-%d").date()


def _compute_availability_counts(target: int, total_slots: int, rng: random.Random) -> tuple[int, int]:
    if target == 6:
        preferred_min = 10
        preferred_max = 12
        available_min = 6
        available_max = 10
    else:
        preferred_min = max(target + 4, 10)
        preferred_max = max(preferred_min, target + 12)
        available_min = max(target, 6)
        available_max = max(available_min, target + 10)

    preferred_max = min(preferred_max, total_slots)
    preferred_min = min(preferred_min, preferred_max)
    preferred_count = rng.randint(preferred_min, preferred_max)

    remaining = max(0, total_slots - preferred_count)
    available_max = min(available_max, remaining)
    available_min = min(available_min, available_max)
    available_count = rng.randint(available_min, available_max) if available_max >= 0 else 0
    return preferred_count, available_count


class Command(BaseCommand):
    help = "Seed realistic PFE scheduling simulation data directly into the database and commit assignments."

    def add_arguments(self, parser):
        parser.add_argument("--seed", type=int, default=20260420)
        parser.add_argument("--teachers", type=int, default=30)
        parser.add_argument("--presentations", type=int, default=112)
        parser.add_argument("--department", type=str, default="Département PFE Simulation")
        parser.add_argument("--reset-existing", action="store_true", default=False)

    def handle(self, *args, **options):
        seed = int(options["seed"])
        teachers_count = int(options["teachers"])
        presentations_count = int(options["presentations"])
        department_name = str(options["department"]).strip()
        reset_existing = bool(options["reset_existing"])

        if teachers_count < 3:
            self.stderr.write(self.style.ERROR("teachers must be >= 3"))
            return
        if presentations_count < 1:
            self.stderr.write(self.style.ERROR("presentations must be >= 1"))
            return

        admin_user = Users.objects.filter(role=UserRole.ADMIN).first()
        if not admin_user:
            admin_user = Users.objects.create(
                email="sim.admin@issat.local",
                username="Sim Admin",
                password="SimAdmin123",
                role=UserRole.ADMIN,
                is_staff=True,
            )

        rng = random.Random(seed)

        with transaction.atomic():
            department, _ = Departments.objects.get_or_create(name=department_name)

            teachers = []
            for i in range(1, teachers_count + 1):
                email = f"sim.teacher.{i:02d}@issat.local"
                username = f"Sim Teacher {i:02d}"
                user, created = Users.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": username,
                        "password": "SimTeacher123",
                        "role": UserRole.TEACHER,
                    },
                )
                if not created:
                    dirty = False
                    if user.username != username:
                        user.username = username
                        dirty = True
                    if user.role != UserRole.TEACHER:
                        user.role = UserRole.TEACHER
                        dirty = True
                    if dirty:
                        user.save(update_fields=["username", "role"])

                teacher, _ = Teachers.objects.get_or_create(
                    user=user,
                    defaults={
                        "department": department.name,
                        "ncin": f"{81000000 + i:08d}",
                        "age": 35,
                    },
                )
                if teacher.department != department.name:
                    teacher.department = department.name
                    teacher.save(update_fields=["department"])
                teachers.append(teacher)

            if teachers:
                department.head = teachers[0]
                department.save(update_fields=["head"])

            students = []
            for i in range(1, presentations_count + 1):
                email = f"sim.student.{i:03d}@issat.local"
                username = f"Student {i:03d}"
                user, created = Users.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": username,
                        "password": "SimStudent123",
                        "role": UserRole.STUDENT,
                    },
                )
                if not created:
                    dirty = False
                    if user.username != username:
                        user.username = username
                        dirty = True
                    if user.role != UserRole.STUDENT:
                        user.role = UserRole.STUDENT
                        dirty = True
                    if dirty:
                        user.save(update_fields=["username", "role"])

                student, _ = Students.objects.get_or_create(
                    user=user,
                    defaults={
                        "class_id": None,
                        "parent_contact": None,
                        "access_status": True,
                    },
                )
                students.append(student)

            campaign_name = f"Simulation PFE {seed}"
            campaign, _ = PFECampaigns.objects.update_or_create(
                department=department,
                name=campaign_name,
                defaults={
                    "start_date": _parse_date("2026-06-01"),
                    "end_date": _parse_date("2026-06-30"),
                    "day_start_time": _parse_time("08:00"),
                    "day_end_time": _parse_time("16:00"),
                    "slot_duration_minutes": 60,
                    "break_duration_minutes": 15,
                    "weekdays": WEEKDAYS_DEFAULT,
                    "daily_cap_per_teacher": None,
                    "head_can_start": True,
                    "availability_open": True,
                    "schedule_generated": False,
                    "generated_at": None,
                    "is_active": True,
                    "created_by": admin_user,
                },
            )
            PFECampaigns.objects.filter(department=department).exclude(id=campaign.id).update(is_active=False)

            PFECampaignRooms.objects.filter(campaign=campaign).delete()
            PFECampaignRooms.objects.bulk_create(
                [PFECampaignRooms(campaign=campaign, room_name=room) for room in ROOMS_DEFAULT]
            )

            if reset_existing:
                department_teacher_ids = [teacher.user_id for teacher in teachers]
                PFEJuryAssignments.objects.filter(pfe_subject__supervisor_id__in=department_teacher_ids).delete()
                PFESubjects.objects.filter(supervisor_id__in=department_teacher_ids).delete()
                TeacherAvailabilities.objects.filter(
                    teacher_id__in=department_teacher_ids,
                    context=AvailabilityContext.PFE,
                    campaign=campaign,
                ).delete()
                TeacherAvailabilityDateExceptions.objects.filter(
                    teacher_id__in=department_teacher_ids,
                    context=AvailabilityContext.PFE,
                    campaign=campaign,
                ).delete()
                PFETeacherQuotaOverrides.objects.filter(campaign=campaign).delete()

            slots = _generate_candidate_slots(campaign)
            if not slots:
                self.stderr.write(self.style.ERROR("Campaign generated zero slots"))
                return

            availability_windows = {}
            for slot in slots:
                key = (slot.presentation_date, slot.start_time, slot.end_time)
                if key not in availability_windows:
                    availability_windows[key] = slot
            availability_slots = list(availability_windows.values())

            slot_indexes = list(range(len(availability_slots)))

            for teacher in teachers:
                target = rng.randint(6, 14)
                preferred_count, available_count = _compute_availability_counts(target, len(availability_slots), rng)

                preferred_indexes = set(rng.sample(slot_indexes, preferred_count))
                remaining = [idx for idx in slot_indexes if idx not in preferred_indexes]
                available_indexes = set(rng.sample(remaining, available_count))

                PFETeacherQuotaOverrides.objects.update_or_create(
                    campaign=campaign,
                    teacher=teacher,
                    defaults={"target_presentations": target},
                )

                date_rows = []
                for idx in preferred_indexes:
                    slot = availability_slots[idx]
                    date_rows.append(
                        TeacherAvailabilityDateExceptions(
                            teacher=teacher,
                            context=AvailabilityContext.PFE,
                            campaign=campaign,
                            availability_date=slot.presentation_date,
                            start_time=slot.start_time,
                            end_time=slot.end_time,
                            level=AvailabilityLevel.PREFERRED,
                        )
                    )
                for idx in available_indexes:
                    slot = availability_slots[idx]
                    date_rows.append(
                        TeacherAvailabilityDateExceptions(
                            teacher=teacher,
                            context=AvailabilityContext.PFE,
                            campaign=campaign,
                            availability_date=slot.presentation_date,
                            start_time=slot.start_time,
                            end_time=slot.end_time,
                            level=AvailabilityLevel.AVAILABLE,
                        )
                    )
                TeacherAvailabilityDateExceptions.objects.bulk_create(date_rows)

            PFESubjects.objects.bulk_create(
                [
                    PFESubjects(
                        title=f"SIM-PFE-{i:03d}",
                        student_name=students[i - 1].user.username,
                        student=students[i - 1],
                        supervisor=rng.choice(teachers),
                        created_by=admin_user,
                    )
                    for i in range(1, presentations_count + 1)
                ]
            )

            plan = plan_pfe_assignments(campaign=campaign)
            persist = persist_pfe_assignments(campaign=campaign, plan=plan, assigned_by=admin_user)
            campaign.availability_open = False
            campaign.schedule_generated = True
            campaign.generated_at = timezone.now()
            campaign.save(update_fields=["availability_open", "schedule_generated", "generated_at", "updated_at"])

        self.stdout.write(self.style.SUCCESS("PFE simulation data persisted."))
        self.stdout.write(f"Seed: {seed}")
        self.stdout.write(f"Department: {department.name}")
        self.stdout.write(f"Teachers: {teachers_count}")
        self.stdout.write(f"Presentations: {presentations_count}")
        self.stdout.write(
            f"Assignments: {plan['stats']['assigned_count']} / {plan['stats']['subjects_total']} | "
            f"Unresolved: {plan['stats']['unresolved_count']}"
        )
        self.stdout.write(
            f"Persisted slots: {persist['created_slots']} | "
            f"Created assignments: {persist['created_assignments']} | "
            f"Updated assignments: {persist['updated_assignments']}"
        )
