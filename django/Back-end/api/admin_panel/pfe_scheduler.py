from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

from api.models import (
    AvailabilityContext,
    AvailabilityLevel,
    JuryRole,
    PFECampaigns,
    PFECampaignRooms,
    PFESubjects,
    PFETeacherQuotaOverrides,
    TeacherAvailabilities,
    TeacherAvailabilityDateExceptions,
    Teachers,
)


DAY_CANONICAL_MAP = {
    "lundi": "Lundi",
    "mardi": "Mardi",
    "mercredi": "Mercredi",
    "jeudi": "jeudi",
    "vendredi": "Vendredi",
    "samedi": "Samedi",
}

LEVEL_RANK = {
    AvailabilityLevel.PREFERRED: 0,
    AvailabilityLevel.AVAILABLE: 1,
    AvailabilityLevel.UNAVAILABLE: 2,
}


@dataclass(frozen=True)
class SlotCandidate:
    presentation_date: date
    start_time: Any
    end_time: Any
    room: str


def _normalize_day_label(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = DAY_CANONICAL_MAP.get(str(value).strip().lower())
    return normalized


def _date_to_day_label(value: date) -> str:
    mapping = {
        0: "Lundi",
        1: "Mardi",
        2: "Mercredi",
        3: "jeudi",
        4: "Vendredi",
        5: "Samedi",
        6: "Dimanche",
    }
    return mapping[value.weekday()]


def _time_overlaps(start_a, end_a, start_b, end_b) -> bool:
    return start_a < end_b and start_b < end_a


def _resolve_overlap_level(levels: list[str]) -> str:
    if not levels:
        return AvailabilityLevel.UNAVAILABLE
    if AvailabilityLevel.UNAVAILABLE in levels:
        return AvailabilityLevel.UNAVAILABLE
    if AvailabilityLevel.PREFERRED in levels:
        return AvailabilityLevel.PREFERRED
    return AvailabilityLevel.AVAILABLE


def _get_teacher_target_map(campaign: PFECampaigns, teachers: list[Teachers]) -> dict[str, int]:
    targets = {str(teacher.user_id): int(teacher.required_pfe_presentations) for teacher in teachers}

    overrides = PFETeacherQuotaOverrides.objects.filter(campaign=campaign, teacher__in=teachers).select_related("teacher")
    for override in overrides:
        targets[str(override.teacher_id)] = int(override.target_presentations)
    return targets


def _build_weekly_availability_map(campaign: PFECampaigns, teachers: list[Teachers]) -> dict[str, list[TeacherAvailabilities]]:
    by_teacher: dict[str, list[TeacherAvailabilities]] = defaultdict(list)
    items = TeacherAvailabilities.objects.filter(
        teacher__in=teachers,
        context=AvailabilityContext.PFE,
    ).filter(campaign__isnull=True) | TeacherAvailabilities.objects.filter(
        teacher__in=teachers,
        context=AvailabilityContext.PFE,
        campaign=campaign,
    )

    for item in items:
        by_teacher[str(item.teacher_id)].append(item)
    return by_teacher


def _build_date_exception_map(
    campaign: PFECampaigns,
    teachers: list[Teachers],
) -> dict[str, list[TeacherAvailabilityDateExceptions]]:
    by_teacher: dict[str, list[TeacherAvailabilityDateExceptions]] = defaultdict(list)

    items = TeacherAvailabilityDateExceptions.objects.filter(
        teacher__in=teachers,
        context=AvailabilityContext.PFE,
    ).filter(campaign__isnull=True) | TeacherAvailabilityDateExceptions.objects.filter(
        teacher__in=teachers,
        context=AvailabilityContext.PFE,
        campaign=campaign,
    )

    for item in items:
        by_teacher[str(item.teacher_id)].append(item)
    return by_teacher


def _resolve_teacher_level_for_slot(
    teacher_id: str,
    slot: SlotCandidate,
    weekly_map: dict[str, list[TeacherAvailabilities]],
    exception_map: dict[str, list[TeacherAvailabilityDateExceptions]],
) -> str:
    exception_levels = []
    for item in exception_map.get(teacher_id, []):
        if item.availability_date != slot.presentation_date:
            continue
        if _time_overlaps(slot.start_time, slot.end_time, item.start_time, item.end_time):
            exception_levels.append(item.level)

    if exception_levels:
        return _resolve_overlap_level(exception_levels)

    day_label = _date_to_day_label(slot.presentation_date)
    weekly_levels = []
    for item in weekly_map.get(teacher_id, []):
        if _normalize_day_label(item.day_of_week) != _normalize_day_label(day_label):
            continue
        if _time_overlaps(slot.start_time, slot.end_time, item.start_time, item.end_time):
            weekly_levels.append(item.level)

    return _resolve_overlap_level(weekly_levels)


def _is_teacher_free(teacher_busy: dict[str, list[tuple[date, Any, Any]]], teacher_id: str, slot: SlotCandidate) -> bool:
    for busy_date, busy_start, busy_end in teacher_busy[teacher_id]:
        if busy_date != slot.presentation_date:
            continue
        if _time_overlaps(slot.start_time, slot.end_time, busy_start, busy_end):
            return False
    return True


def _target_penalty(current_count: int, target: int) -> int:
    next_count = current_count + 1
    base = abs(next_count - target)
    overshoot = max(next_count - target, 0)
    return (base * 2) + (overshoot * 5)


def _generate_candidate_slots(campaign: PFECampaigns) -> list[SlotCandidate]:
    rooms = [room.room_name.strip() for room in PFECampaignRooms.objects.filter(campaign=campaign).order_by("room_name")]
    rooms = [room for room in rooms if room]
    if not rooms:
        return []

    if campaign.day_start_time >= campaign.day_end_time:
        return []

    weekdays = {_normalize_day_label(value) for value in (campaign.weekdays or [])}
    weekdays.discard(None)
    if not weekdays:
        weekdays = {"Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi"}

    duration = timedelta(minutes=max(1, int(campaign.slot_duration_minutes)))
    break_duration = timedelta(minutes=max(0, int(campaign.break_duration_minutes)))

    slots: list[SlotCandidate] = []
    cursor = campaign.start_date

    while cursor <= campaign.end_date:
        day_label = _normalize_day_label(_date_to_day_label(cursor))
        if day_label in weekdays:
            start_dt = datetime.combine(cursor, campaign.day_start_time)
            end_limit = datetime.combine(cursor, campaign.day_end_time)
            while start_dt + duration <= end_limit:
                slot_start = start_dt.time().replace(microsecond=0)
                slot_end = (start_dt + duration).time().replace(microsecond=0)
                for room in rooms:
                    slots.append(
                        SlotCandidate(
                            presentation_date=cursor,
                            start_time=slot_start,
                            end_time=slot_end,
                            room=room,
                        )
                    )
                start_dt = start_dt + duration + break_duration
        cursor = cursor + timedelta(days=1)

    return slots


def _serialize_slot(slot: SlotCandidate) -> dict[str, str]:
    return {
        "date": str(slot.presentation_date),
        "start_time": str(slot.start_time),
        "end_time": str(slot.end_time),
        "room": slot.room,
    }


def _slot_key(slot: SlotCandidate) -> tuple[str, str, str, str]:
    return (str(slot.presentation_date), str(slot.start_time), str(slot.end_time), slot.room)


def plan_pfe_assignments(
    campaign: PFECampaigns,
    subject_ids: list[str] | None = None,
) -> dict[str, Any]:
    subjects_query = PFESubjects.objects.filter(supervisor__department=campaign.department.name).select_related(
        "supervisor",
        "supervisor__user",
    )
    if subject_ids:
        subjects_query = subjects_query.filter(id__in=subject_ids)

    subjects = sorted(list(subjects_query), key=lambda item: str(item.id))
    abc=0
    if not subjects:
        return {
            "campaign_id": str(campaign.id),
            "assigned": [],
            "unresolved": [],
            "stats": {
                "subjects_total": 0,
                "assigned_count": 0,
                "unresolved_count": 0,
                "slots_generated": 0,
            },
        }

    teacher_ids = {subject.supervisor_id for subject in subjects}
    department_teachers = list(Teachers.objects.filter(department=campaign.department.name).select_related("user"))
    for teacher in department_teachers:
        teacher_ids.add(teacher.user_id)

    teachers_by_id = {str(teacher.user_id): teacher for teacher in department_teachers}
    targets = _get_teacher_target_map(campaign, department_teachers)

    slots = _generate_candidate_slots(campaign)
    if not slots:
        unresolved = [
            {
                "subject_id": str(subject.id),
                "subject_title": subject.title,
                "reason": "no_slots_generated",
            }
            for subject in subjects
        ]
        return {
            "campaign_id": str(campaign.id),
            "assigned": [],
            "unresolved": unresolved,
            "stats": {
                "subjects_total": len(subjects),
                "assigned_count": 0,
                "unresolved_count": len(unresolved),
                "slots_generated": 0,
            },
        }

    weekly_map = _build_weekly_availability_map(campaign, department_teachers)
    exception_map = _build_date_exception_map(campaign, department_teachers)

    availability_cache: dict[tuple[str, tuple[str, str, str, str]], str] = {}

    def get_level(teacher_id: str, slot: SlotCandidate) -> str:
        key = (teacher_id, _slot_key(slot))
        if key not in availability_cache:
            availability_cache[key] = _resolve_teacher_level_for_slot(
                teacher_id=teacher_id,
                slot=slot,
                weekly_map=weekly_map,
                exception_map=exception_map,
            )
        return availability_cache[key]

    assignments_count: dict[str, int] = defaultdict(int)
    teacher_daily_count: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    teacher_busy: dict[str, list[tuple[date, Any, Any]]] = defaultdict(list)
    used_slots: set[tuple[str, str, str, str]] = set()

    unresolved = []
    assigned = []

    daily_cap = campaign.daily_cap_per_teacher if campaign.daily_cap_per_teacher else None

    def find_best_assignment(subject, allow_available: bool) -> dict[str, Any] | None:
        supervisor_id = str(subject.supervisor_id)
        teacher_candidates = [
            teacher for teacher in department_teachers if str(teacher.user_id) != supervisor_id
        ]

        best_result = None
        best_score = None

        for slot_index, slot in enumerate(slots):
            slot_tuple = _slot_key(slot)
            if slot_tuple in used_slots:
                continue

            supervisor_level = get_level(supervisor_id, slot)
            if supervisor_level == AvailabilityLevel.UNAVAILABLE:
                continue
            if not allow_available and supervisor_level != AvailabilityLevel.PREFERRED:
                continue
            if not _is_teacher_free(teacher_busy, supervisor_id, slot):
                continue

            day_key = str(slot.presentation_date)
            if daily_cap is not None and teacher_daily_count[supervisor_id][day_key] >= daily_cap:
                continue

            for rapporteur in teacher_candidates:
                rapporteur_id = str(rapporteur.user_id)
                rapporteur_level = get_level(rapporteur_id, slot)
                if rapporteur_level == AvailabilityLevel.UNAVAILABLE:
                    continue
                if not allow_available and rapporteur_level != AvailabilityLevel.PREFERRED:
                    continue
                if not _is_teacher_free(teacher_busy, rapporteur_id, slot):
                    continue
                if daily_cap is not None and teacher_daily_count[rapporteur_id][day_key] >= daily_cap:
                    continue

                for president in teacher_candidates:
                    president_id = str(president.user_id)
                    if president_id == rapporteur_id:
                        continue

                    president_level = get_level(president_id, slot)
                    if president_level == AvailabilityLevel.UNAVAILABLE:
                        continue
                    if not allow_available and president_level != AvailabilityLevel.PREFERRED:
                        continue
                    if not _is_teacher_free(teacher_busy, president_id, slot):
                        continue
                    if daily_cap is not None and teacher_daily_count[president_id][day_key] >= daily_cap:
                        continue

                    level_penalty = (
                        LEVEL_RANK[supervisor_level]
                        + LEVEL_RANK[rapporteur_level]
                        + LEVEL_RANK[president_level]
                    ) * 10
                    quota_penalty = (
                        _target_penalty(assignments_count[supervisor_id], targets.get(supervisor_id, 0))
                        + _target_penalty(assignments_count[rapporteur_id], targets.get(rapporteur_id, 0))
                        + _target_penalty(assignments_count[president_id], targets.get(president_id, 0))
                    )
                    score = level_penalty + quota_penalty + slot_index

                    if best_score is None or score < best_score:
                        best_score = score
                        best_result = {
                            "subject": subject,
                            "slot": slot,
                            "encadreur_id": supervisor_id,
                            "rapporteur_id": rapporteur_id,
                            "president_id": president_id,
                            "levels": {
                                "encadreur": supervisor_level,
                                "rapporteur": rapporteur_level,
                                "president": president_level,
                            },
                            "score": score,
                        }

        return best_result

    for subject in subjects:
        winner = find_best_assignment(subject, allow_available=False)
        if winner is None:
            winner = find_best_assignment(subject, allow_available=True)

        if winner is None:
            unresolved.append(
                {
                    "subject_id": str(subject.id),
                    "subject_title": subject.title,
                    "reason": "no_eligible_jury_slot",
                }
            )
            continue

        slot = winner["slot"]
        slot_tuple = _slot_key(slot)
        used_slots.add(slot_tuple)

        day_key = str(slot.presentation_date)
        for teacher_id in [winner["encadreur_id"], winner["rapporteur_id"], winner["president_id"]]:
            assignments_count[teacher_id] += 1
            teacher_daily_count[teacher_id][day_key] += 1
            teacher_busy[teacher_id].append((slot.presentation_date, slot.start_time, slot.end_time))

        assigned.append(
            {
                "subject_id": str(subject.id),
                "subject_title": subject.title,
                "slot": _serialize_slot(slot),
                "encadreur_id": winner["encadreur_id"],
                "rapporteur_id": winner["rapporteur_id"],
                "president_id": winner["president_id"],
                "levels": winner["levels"],
                "score": winner["score"],
            }
        )

    teacher_load = []
    for teacher_id, teacher in sorted(teachers_by_id.items(), key=lambda item: item[1].user.username.lower()):
        assigned_count = assignments_count.get(teacher_id, 0)
        target = targets.get(teacher_id, 0)
        teacher_load.append(
            {
                "teacher_id": teacher_id,
                "teacher_name": teacher.user.username,
                "target": target,
                "assigned": assigned_count,
                "delta": assigned_count - target,
            }
        )

    return {
        "campaign_id": str(campaign.id),
        "assigned": assigned,
        "unresolved": unresolved,
        "teacher_load": teacher_load,
        "stats": {
            "subjects_total": len(subjects),
            "assigned_count": len(assigned),
            "unresolved_count": len(unresolved),
            "slots_generated": len(slots),
        },
    }


def persist_pfe_assignments(campaign: PFECampaigns, plan: dict[str, Any], assigned_by) -> dict[str, Any]:
    assigned_rows = plan.get("assigned", [])
    if not assigned_rows:
        return {
            "created_slots": 0,
            "created_assignments": 0,
            "updated_assignments": 0,
        }

    subject_ids = [row["subject_id"] for row in assigned_rows]
    PFESubjects.objects.filter(id__in=subject_ids)

    subject_map = {
        str(item.id): item
        for item in PFESubjects.objects.filter(id__in=subject_ids).select_related("supervisor")
    }

    created_slots = 0
    created_assignments = 0
    updated_assignments = 0

    from api.models import PFEPresentationSlots, PFEJuryAssignments

    PFEJuryAssignments.objects.filter(pfe_subject_id__in=subject_ids).delete()

    for row in assigned_rows:
        subject = subject_map.get(row["subject_id"])
        if subject is None:
            continue

        slot_payload = row["slot"]
        slot = PFEPresentationSlots.objects.create(
            presentation_date=slot_payload["date"],
            start_time=slot_payload["start_time"],
            end_time=slot_payload["end_time"],
            room=slot_payload["room"],
            created_by=assigned_by,
        )
        created_slots += 1

        for role, teacher_id in [
            (JuryRole.ENCADREUR, row["encadreur_id"]),
            (JuryRole.RAPPORTEUR, row["rapporteur_id"]),
            (JuryRole.PRESIDENT, row["president_id"]),
        ]:
            teacher = Teachers.objects.filter(user_id=teacher_id).first()
            if not teacher:
                continue

            assignment, created = PFEJuryAssignments.objects.update_or_create(
                pfe_subject=subject,
                role=role,
                defaults={
                    "teacher": teacher,
                    "slot": slot,
                    "assigned_by": assigned_by,
                },
            )
            if created:
                created_assignments += 1
            else:
                updated_assignments += 1

    return {
        "created_slots": created_slots,
        "created_assignments": created_assignments,
        "updated_assignments": updated_assignments,
    }
