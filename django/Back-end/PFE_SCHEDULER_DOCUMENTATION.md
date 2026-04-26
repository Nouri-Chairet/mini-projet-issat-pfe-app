# PFE Scheduler Documentation

## 1. Purpose

The PFE scheduler automates jury planning for PFE presentations by:

- Generating candidate presentation slots from a campaign window
- Reading teacher availability preferences (preferred / available / unavailable)
- Selecting jury members for each PFE subject (encadreur, rapporteur, president)
- Balancing teacher load against target quotas
- Persisting all slots and assignments in the real database

This implementation now supports both:

- Real scheduling from database data
- Realistic simulation seeding (30 teachers, 112 PFEs, random availability) directly into database tables

---

## 2. Data Model

### Core scheduling tables

- `pfe_campaigns`
  - Defines scheduling window, day start/end, slot duration, break duration, weekdays, daily cap, active state
- `pfe_campaign_rooms`
  - Rooms used in the campaign
- `pfe_teacher_quota_overrides`
  - Target number of presentations per teacher for load balancing
- `teacher_availabilities`
  - Weekly recurring availability by level (`preferred`, `available`, `unavailable`)
- `teacher_availability_date_exceptions`
  - Date-specific availability overrides by level
- `pfe_subjects`
  - PFE subjects, their assigned students (`student_id`) and supervisors
- `pfe_presentation_slots`
  - Persisted slot records used for assignments
- `pfe_jury_assignments`
  - Final jury assignments with role and slot reference

### Availability resolution priority

For each teacher and candidate slot:

1. Date exception level (if any overlapping exception exists)
2. Weekly availability level (if no date exception for that slot)
3. Default to `unavailable` if no matching interval exists

If multiple intervals overlap the same slot, precedence is:

1. `unavailable`
2. `preferred`
3. `available`

---

## 3. Scheduling Algorithm

Source: `api/admin_panel/pfe_scheduler.py`

### Step A: Build candidate slots

Slots are generated for each campaign day in range:

- Allowed weekdays only
- Time blocks from `day_start_time` to `day_end_time`
- Each block has `slot_duration_minutes`
- Gap between blocks uses `break_duration_minutes`
- Each room creates a parallel slot for each time block

### Step B: Prepare constraints

For all teachers in the campaign department:

- Load weekly and date-specific availability maps
- Load quota targets (default from supervised PFE count, overridden by campaign quota table)

### Step C: Subject-by-subject assignment

For each subject:

- Supervisor is fixed as `encadreur`
- Search for best slot + (`rapporteur`, `president`) combination
- Roles must be distinct
- Teacher cannot be unavailable at slot time
- Teacher cannot be double-booked in overlapping times
- Daily cap per teacher is respected when configured

The solver uses a two-pass strategy:

1. Preferred-only pass
2. Preferred+available fallback pass

If neither pass finds a valid trio, the subject is unresolved with reason `no_eligible_jury_slot`.

### Step D: Scoring (optimization)

Each valid candidate is scored and lowest score wins.

Score = level penalty + quota penalty + slot index bias

- **Level penalty** favors preferred availability over merely available
- **Quota penalty** pushes assignments toward target load per teacher
- **Slot index bias** gives deterministic tie-breaking toward earlier slots

Quota penalty uses a stronger overshoot cost so assigning above target is discouraged.

---

## 4. Simulation Seeding Logic (Real DB)

Endpoint: `POST /api/admin/pfe/simulation/seed/`

What it does:

1. Creates or reuses a department
2. Creates 30 simulation teachers (and designates one as department head)
3. Creates/updates an active campaign (June window by default)
4. Creates campaign rooms (`A1..A4`)
5. Generates random teacher target quotas and random slot preferences
6. Applies special rule when target is 6:
   - preferred sessions in `[10, 12]`
   - available-not-preferred sessions `>= 6`
7. Writes preferred/available choices into `teacher_availability_date_exceptions`
8. Creates 112 PFE subjects with random supervisors
9. Runs planner + commit, writing `pfe_presentation_slots` and `pfe_jury_assignments`

Response contains:

- campaign info
- per-teacher seeded availability counts
- computed plan stats
- persistence stats (created slots / assignments)

---

## 5. API Endpoints Added/Used

### Campaign and planning

- `POST /api/admin/pfe/campaign/upsert/`
- `GET /api/admin/pfe/campaign/get/`
- `POST /api/admin/pfe/campaign/activate/`
- `POST /api/admin/pfe/campaign/quotas/set/`
- `POST /api/admin/pfe/auto-assign/dry-run/`
- `POST /api/admin/pfe/auto-assign/commit/`

### Availability

- `POST /api/admin/teacher/availability/set/` (now supports `level` and optional `campaign_id`)
- `POST /api/admin/teacher/availability/date-exception/set/`
- `GET /api/admin/teacher/availability/get/`

### Assignments and data

- `GET /api/admin/pfe/subjects/`
- `GET /api/admin/pfe/students/`
- `POST /api/admin/pfe/subjects/assign-student/`
- `GET /api/admin/pfe/assignments/list/`
- `GET /api/admin/pfe/assignments/export/`
- `DELETE /api/admin/pfe/jury/unassign/`
- `POST /api/admin/pfe/simulation/seed/`

### Session-state workflow (admin + department head + teachers)

- `GET /api/admin/pfe/sessions/departments/`
- `POST /api/admin/pfe/sessions/unlock-head/`
- `POST /api/admin/pfe/sessions/seed-demo/`
- `GET /api/teacher/pfe/session/state/`
- `POST /api/teacher/pfe/session/start/`
- `POST /api/teacher/pfe/availability/submit/`
- `POST /api/teacher/pfe/session/generate/`
- `GET /api/teacher/pfe/schedule/`

---

## 6. Frontend Interface

### Admin pages

- `frontend/src/pages/admin/PfeSessions.tsx`
  - Page label: **Start PFE Sessions**
  - Lists all departments and their heads
  - Unlocks head-department session start
  - Includes demo account seeding for end-to-end testing
- `frontend/src/pages/admin/PfeScheduler.tsx`
  - Campaign setup (window, slot settings, rooms, daily cap)
  - Seed realistic simulation data directly into DB
  - Run dry-run and commit scheduling
  - Assign/unassign real students to each PFE subject
  - View campaign stats, unresolved count, and assignment cards

### Teacher pages

- `frontend/src/pages/enseignant/Disponibilites.tsx`
  - Page label: **Select Available Dates**
  - 3 states per hour: preferred / available / unavailable
  - Head-department controls to start collection and generate schedule
- `frontend/src/pages/enseignant/Planning.tsx`
  - Page label: **PFE Schedule**
  - Empty until schedule generation
  - Displays only the logged-in teacher's supervised PFE schedule

Route and navigation:

- Admin menu includes `Start PFE Sessions` at `/admin/pfe-sessions`
- Admin menu includes `PFE Scheduler` at `/admin/pfe-scheduler`
- Teacher menu includes `Select Available Dates` and `PFE Schedule`

---

## 7. Operational Flow (Recommended)

1. Open **Start PFE Sessions** and unlock the department head session
2. Department head opens **Select Available Dates** and starts collection (campaign window + rooms)
3. Teachers submit hourly availability levels (preferred/available/unavailable)
4. Department head ends collection and triggers schedule generation
5. Teachers view results in **PFE Schedule** (teacher-scoped schedule only)
6. Admin may still use **PFE Scheduler** for advanced planning/seeding/export tasks

---

## 8. Notes and Constraints

- Scheduler works at department scope via campaign department
- A teacher can appear only once in a given slot time window
- One room can host one subject per slot candidate
- `block_on_unresolved=true` can enforce all-or-nothing commit behavior
- Existing data can be reset by simulation seeding (`reset_existing=true`)
