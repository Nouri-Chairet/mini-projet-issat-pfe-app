#!/usr/bin/env python3
"""Standalone PFE jury scheduling simulation.

Scenario defaults:
- 30 teachers + 1 head department
- 112 PFE presentations
- Random teacher availability preferences
- Rule for target=6: preferred sessions in [10, 12], available-not-preferred >= 6
"""

from __future__ import annotations

import argparse
import json
import random
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Dict, List, Sequence, Set, Tuple


ROOMS = ["A1", "A2", "A3", "A4"]
TIME_BLOCKS = [
    ("08:00", "09:00"),
    ("09:15", "10:15"),
    ("10:30", "11:30"),
    ("11:45", "12:45"),
    ("13:00", "14:00"),
    ("14:15", "15:15"),
]


@dataclass(frozen=True)
class Slot:
    slot_id: str
    session_date: date
    start_time: str
    end_time: str
    room: str

    @property
    def label(self) -> str:
        return f"{self.session_date.isoformat()} {self.start_time}-{self.end_time} Room {self.room}"


@dataclass
class Teacher:
    teacher_id: str
    teacher_name: str
    target_presentations: int
    preferred_slots: Set[str]
    available_not_preferred_slots: Set[str]


@dataclass(frozen=True)
class Subject:
    subject_id: str
    title: str
    supervisor_id: str


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def is_weekday(d: date) -> bool:
    return d.weekday() < 5


def generate_slots(start_date: date, end_date: date) -> Tuple[List[Slot], Dict[str, Slot]]:
    slots: List[Slot] = []
    day = start_date
    idx = 1
    while day <= end_date:
        if is_weekday(day):
            for start_t, end_t in TIME_BLOCKS:
                for room in ROOMS:
                    slot = Slot(
                        slot_id=f"S{idx:04d}",
                        session_date=day,
                        start_time=start_t,
                        end_time=end_t,
                        room=room,
                    )
                    slots.append(slot)
                    idx += 1
        day += timedelta(days=1)

    by_id = {slot.slot_id: slot for slot in slots}
    return slots, by_id


def compute_availability_counts(target: int, total_slots: int, rng: random.Random) -> Tuple[int, int]:
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

    remaining = total_slots - preferred_count
    available_max = min(available_max, remaining)
    available_min = min(available_min, available_max)

    available_count = rng.randint(available_min, available_max) if available_max >= 0 else 0
    return preferred_count, available_count


def generate_teachers(teacher_count: int, slots: Sequence[Slot], rng: random.Random) -> List[Teacher]:
    slot_ids = [slot.slot_id for slot in slots]
    teachers: List[Teacher] = []

    for i in range(1, teacher_count + 1):
        teacher_id = f"T{i:02d}"
        teacher_name = f"Teacher {i:02d}"
        target = rng.randint(6, 14)

        preferred_count, available_count = compute_availability_counts(target, len(slot_ids), rng)

        preferred = set(rng.sample(slot_ids, preferred_count))
        remaining_ids = [sid for sid in slot_ids if sid not in preferred]
        available = set(rng.sample(remaining_ids, available_count))

        teachers.append(
            Teacher(
                teacher_id=teacher_id,
                teacher_name=teacher_name,
                target_presentations=target,
                preferred_slots=preferred,
                available_not_preferred_slots=available,
            )
        )

    return teachers


def generate_subjects(subject_count: int, teacher_ids: Sequence[str], rng: random.Random) -> List[Subject]:
    subjects: List[Subject] = []
    for i in range(1, subject_count + 1):
        subject_id = f"PFE-{i:03d}"
        subjects.append(
            Subject(
                subject_id=subject_id,
                title=f"Sujet PFE {i:03d}",
                supervisor_id=rng.choice(teacher_ids),
            )
        )
    return subjects


def slot_sort_key(slot: Slot) -> Tuple[str, str, str]:
    return (slot.session_date.isoformat(), slot.start_time, slot.room)


def schedule_presentations(
    teachers: Sequence[Teacher],
    subjects: Sequence[Subject],
    slots: Sequence[Slot],
    rng: random.Random,
) -> Tuple[List[Dict[str, str]], List[Dict[str, str]], Dict[str, Dict[str, object]]]:
    teacher_map = {t.teacher_id: t for t in teachers}
    slot_map = {s.slot_id: s for s in slots}

    booked_slots_by_teacher: Dict[str, Set[str]] = defaultdict(set)
    assigned_count: Counter[str] = Counter()
    assigned_by_role: Dict[str, Counter[str]] = defaultdict(Counter)
    teacher_assignments: Dict[str, List[Dict[str, str]]] = defaultdict(list)

    unresolved: List[Dict[str, str]] = []
    assignments: List[Dict[str, str]] = []

    slot_ids = [s.slot_id for s in slots]
    rng.shuffle(slot_ids)

    def is_available(t: Teacher, sid: str) -> bool:
        return sid in t.preferred_slots or sid in t.available_not_preferred_slots

    def is_preferred(t: Teacher, sid: str) -> bool:
        return sid in t.preferred_slots

    for subject in subjects:
        supervisor = teacher_map[subject.supervisor_id]

        candidate_slots = [
            sid
            for sid in slot_ids
            if is_available(supervisor, sid) and sid not in booked_slots_by_teacher[supervisor.teacher_id]
        ]

        candidate_slots.sort(
            key=lambda sid: (
                0 if is_preferred(supervisor, sid) else 1,
                abs(assigned_count[supervisor.teacher_id] - supervisor.target_presentations),
                slot_sort_key(slot_map[sid]),
            )
        )

        chosen = None
        for sid in candidate_slots:
            pool = [
                t
                for t in teachers
                if t.teacher_id != supervisor.teacher_id
                and is_available(t, sid)
                and sid not in booked_slots_by_teacher[t.teacher_id]
            ]

            if len(pool) < 2:
                continue

            pool.sort(
                key=lambda t: (
                    0 if is_preferred(t, sid) else 1,
                    assigned_count[t.teacher_id],
                    abs(assigned_count[t.teacher_id] - t.target_presentations),
                    t.teacher_id,
                )
            )

            rapporteur = pool[0]
            president = next((c for c in pool[1:] if c.teacher_id != rapporteur.teacher_id), None)
            if president is None:
                continue

            chosen = (sid, rapporteur, president)
            break

        if chosen is None:
            unresolved.append({
                "subject_id": subject.subject_id,
                "reason": "no_eligible_jury_slot",
            })
            continue

        sid, rapporteur, president = chosen
        slot = slot_map[sid]

        records = [
            (supervisor.teacher_id, "encadreur"),
            (rapporteur.teacher_id, "rapporteur"),
            (president.teacher_id, "president"),
        ]

        for tid, role in records:
            booked_slots_by_teacher[tid].add(sid)
            assigned_count[tid] += 1
            assigned_by_role[tid][role] += 1
            teacher_assignments[tid].append(
                {
                    "subject_id": subject.subject_id,
                    "role": role,
                    "slot_label": slot.label,
                    "slot_id": sid,
                }
            )

        assignments.append(
            {
                "subject_id": subject.subject_id,
                "title": subject.title,
                "slot_id": sid,
                "slot_label": slot.label,
                "supervisor_id": supervisor.teacher_id,
                "rapporteur_id": rapporteur.teacher_id,
                "president_id": president.teacher_id,
            }
        )

    teacher_results: Dict[str, Dict[str, object]] = {}
    for t in teachers:
        preferred_sessions = sorted((slot_map[sid].label for sid in t.preferred_slots))
        available_sessions = sorted((slot_map[sid].label for sid in t.available_not_preferred_slots))
        assigned_sessions = sorted(
            teacher_assignments[t.teacher_id],
            key=lambda row: row["slot_label"],
        )

        teacher_results[t.teacher_id] = {
            "teacher_id": t.teacher_id,
            "teacher_name": t.teacher_name,
            "target_presentations": t.target_presentations,
            "preferred_sessions_count": len(preferred_sessions),
            "available_not_preferred_sessions_count": len(available_sessions),
            "preferred_sessions": preferred_sessions,
            "available_not_preferred_sessions": available_sessions,
            "assigned_total": len(assigned_sessions),
            "assigned_by_role": {
                "encadreur": assigned_by_role[t.teacher_id]["encadreur"],
                "rapporteur": assigned_by_role[t.teacher_id]["rapporteur"],
                "president": assigned_by_role[t.teacher_id]["president"],
            },
            "assigned_presentations": assigned_sessions,
        }

    return assignments, unresolved, teacher_results


def write_reports(
    output_dir: Path,
    seed: int,
    teachers: Sequence[Teacher],
    teacher_results: Dict[str, Dict[str, object]],
    assignments: Sequence[Dict[str, str]],
    unresolved: Sequence[Dict[str, str]],
    slots_count: int,
) -> Tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)

    txt_path = output_dir / "pfe_simulation_report.txt"
    json_path = output_dir / "pfe_simulation_report.json"

    lines: List[str] = []
    lines.append("PFE Scheduling Simulation Report")
    lines.append("=" * 80)
    lines.append(f"Random seed: {seed}")
    lines.append("Teachers: 30 + 1 head department")
    lines.append(f"Presentations: {len(assignments) + len(unresolved)}")
    lines.append(f"Completed assignments: {len(assignments)} | Unresolved: {len(unresolved)}")
    lines.append(f"Generated slots: {slots_count}")
    lines.append("-")
    lines.append("")

    for t in teachers:
        row = teacher_results[t.teacher_id]
        lines.append(
            f"{t.teacher_id} - {t.teacher_name} | target={row['target_presentations']} | "
            f"chosen preferred={row['preferred_sessions_count']} | "
            f"chosen available_not_preferred={row['available_not_preferred_sessions_count']} | "
            f"assigned={row['assigned_total']}"
        )
        role = row["assigned_by_role"]
        lines.append(
            "Role split: "
            f"encadreur={role['encadreur']}, rapporteur={role['rapporteur']}, president={role['president']}"
        )

        lines.append("Preferred sessions selected:")
        for label in row["preferred_sessions"]:
            lines.append(f"  - {label}")

        lines.append("Available (not preferred) sessions selected:")
        for label in row["available_not_preferred_sessions"]:
            lines.append(f"  - {label}")

        lines.append("Assigned presentation results:")
        for ap in row["assigned_presentations"]:
            lines.append(f"  - {ap['subject_id']} | {ap['role']} | {ap['slot_label']}")

        lines.append("")

    lines.append("Unresolved subjects:")
    if unresolved:
        for item in unresolved:
            lines.append(f"  - {item['subject_id']} | {item['reason']}")
    else:
        lines.append("  - none")

    txt_path.write_text("\n".join(lines), encoding="utf-8")

    payload = {
        "seed": seed,
        "config": {
            "teachers": 30,
            "head_department": {"id": "H01", "name": "Head Department"},
            "presentations": len(assignments) + len(unresolved),
            "rooms": ROOMS,
            "time_blocks": TIME_BLOCKS,
        },
        "stats": {
            "teachers_total": len(teachers),
            "head_department": {"id": "H01", "name": "Head Department"},
            "presentations_total": len(assignments) + len(unresolved),
            "assignments_completed": len(assignments),
            "unresolved_total": len(unresolved),
            "slots_generated": slots_count,
        },
        "teacher_results": [teacher_results[t.teacher_id] for t in teachers],
        "unresolved": list(unresolved),
        "assignments": list(assignments),
    }
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    return txt_path, json_path


def run(seed: int, output_dir: Path, teachers_count: int, presentations_count: int) -> int:
    rng = random.Random(seed)

    slots, _slot_map = generate_slots(parse_date("2026-06-01"), parse_date("2026-06-30"))
    teachers = generate_teachers(teachers_count, slots, rng)
    teacher_ids = [t.teacher_id for t in teachers]
    subjects = generate_subjects(presentations_count, teacher_ids, rng)

    assignments, unresolved, teacher_results = schedule_presentations(teachers, subjects, slots, rng)

    txt_path, json_path = write_reports(
        output_dir=output_dir,
        seed=seed,
        teachers=teachers,
        teacher_results=teacher_results,
        assignments=assignments,
        unresolved=unresolved,
        slots_count=len(slots),
    )

    print("Simulation completed successfully")
    print(f"Seed: {seed}")
    print(f"Assignments: {len(assignments)} / {presentations_count}")
    print(f"Unresolved: {len(unresolved)}")
    print(f"Text report: {txt_path}")
    print(f"JSON report: {json_path}")
    print("Teacher summary (target vs assigned):")
    for t in teachers:
        row = teacher_results[t.teacher_id]
        print(
            f"  {t.teacher_id} {t.teacher_name}: "
            f"target={row['target_presentations']}, assigned={row['assigned_total']}, "
            f"preferred={row['preferred_sessions_count']}, "
            f"available_not_preferred={row['available_not_preferred_sessions_count']}"
        )

    target6_rows = [
        teacher_results[t.teacher_id]
        for t in teachers
        if teacher_results[t.teacher_id]["target_presentations"] == 6
    ]
    if target6_rows:
        print("Target=6 rule check:")
        for row in target6_rows:
            ok = (
                row["preferred_sessions_count"] >= 10
                and row["preferred_sessions_count"] <= 12
                and row["available_not_preferred_sessions_count"] >= 6
            )
            print(
                f"  {row['teacher_id']} {row['teacher_name']}: "
                f"preferred={row['preferred_sessions_count']}, "
                f"available_not_preferred={row['available_not_preferred_sessions_count']}, "
                f"rule_ok={ok}"
            )

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Simulate PFE jury scheduling with random availability.")
    parser.add_argument("--seed", type=int, default=20260420)
    parser.add_argument("--teachers", type=int, default=30)
    parser.add_argument("--presentations", type=int, default=112)
    parser.add_argument("--output-dir", type=Path, default=Path("simulation_results"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    return run(
        seed=args.seed,
        output_dir=args.output_dir,
        teachers_count=args.teachers,
        presentations_count=args.presentations,
    )


if __name__ == "__main__":
    raise SystemExit(main())
