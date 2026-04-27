import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Card, Input, Select, Tag } from "../../components/UI";
import {
  assignStudentToPfeSubject,
  getAdminDepartments,
  getPfeCampaign,
  getPfeSubjects,
  listPfeStudents,
  listPfeAssignments,
  upsertPfeCampaign,
  type AdminDepartment,
  type PfeAssignmentListItem,
  type PfeCampaign,
  type PfeStudentCandidate,
  type PfeSubjectItem,
} from "../../services/admin";

const ACCENT = "var(--chef-accent)";

function parseError(error: unknown): string {
  const e = error as {
    response?: { data?: { error?: string; detail?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error ??
    e?.response?.data?.detail ??
    e?.message ??
    "Unexpected error"
  );
}

export default function AdminPfeScheduler() {
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  const [campaign, setCampaign] = useState<PfeCampaign | null>(null);
  const [subjects, setSubjects] = useState<PfeSubjectItem[]>([]);
  const [students, setStudents] = useState<PfeStudentCandidate[]>([]);
  const [assignments, setAssignments] = useState<PfeAssignmentListItem[]>([]);

  const [studentSubjectId, setStudentSubjectId] = useState("");
  const [studentId, setStudentId] = useState("");

  const [name, setName] = useState("PFE Session");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-06-30");
  const [dayStart, setDayStart] = useState("08:00");
  const [dayEnd, setDayEnd] = useState("16:00");
  const [slotDuration, setSlotDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(15);
  const [dailyCap, setDailyCap] = useState(3);
  const [rooms, setRooms] = useState("A1,A2,A3,A4");

  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const roomList = useMemo(
    () =>
      rooms
        .split(",")
        .map((room) => room.trim())
        .filter(Boolean),
    [rooms],
  );

  const loadDepartments = useCallback(async () => {
    const list = await getAdminDepartments();
    setDepartments(list);
    if (!selectedDepartmentId && list.length > 0) {
      setSelectedDepartmentId(list[0].id);
    }
  }, [selectedDepartmentId]);

  const loadCampaignData = useCallback(async (departmentId: string) => {
    if (!departmentId) {
      setCampaign(null);
      setSubjects([]);
      setAssignments([]);
      return;
    }

    const [campaignResult, subjectsResult, studentsResult] = await Promise.all([
      getPfeCampaign({ department_id: departmentId }).catch(() => null),
      getPfeSubjects(departmentId),
      listPfeStudents(false),
    ]);

    setCampaign(campaignResult);
    setSubjects(subjectsResult);
    setStudents(studentsResult);

    if (subjectsResult.length > 0) {
      setStudentSubjectId((prev) => prev || subjectsResult[0].id);
    } else {
      setStudentSubjectId("");
      setStudentId("");
    }

    if (campaignResult) {
      setAssignments(await listPfeAssignments(campaignResult.id));
      setName(campaignResult.name);
      setStartDate(campaignResult.start_date);
      setEndDate(campaignResult.end_date);
      setDayStart(campaignResult.day_start_time.slice(0, 5));
      setDayEnd(campaignResult.day_end_time.slice(0, 5));
      setSlotDuration(campaignResult.slot_duration_minutes);
      setBreakDuration(campaignResult.break_duration_minutes);
      setDailyCap(campaignResult.daily_cap_per_teacher ?? 3);
      setRooms(campaignResult.rooms.join(","));
    } else {
      setAssignments([]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setBusy(true);
    setFeedback("");
    try {
      await loadDepartments();
      if (selectedDepartmentId) {
        await loadCampaignData(selectedDepartmentId);
      }
      setFeedback("Data refreshed.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  }, [loadCampaignData, loadDepartments, selectedDepartmentId]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!selectedDepartmentId) {
      return;
    }
    void (async () => {
      setBusy(true);
      setFeedback("");
      try {
        await loadCampaignData(selectedDepartmentId);
      } catch (error) {
        setFeedback(parseError(error));
      } finally {
        setBusy(false);
      }
    })();
  }, [loadCampaignData, selectedDepartmentId]);

  useEffect(() => {
    if (!studentSubjectId) {
      return;
    }
    const selected = subjects.find((item) => item.id === studentSubjectId);
    if (selected) {
      setStudentId(selected.student_id ?? "");
    }
  }, [studentSubjectId, subjects]);

  const saveCampaign = async () => {
    if (!selectedDepartmentId) {
      setFeedback("Select a department first.");
      return;
    }
    if (roomList.length === 0) {
      setFeedback("Add at least one room.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const next = await upsertPfeCampaign({
        campaign_id: campaign?.id,
        department_id: selectedDepartmentId,
        name,
        start_date: startDate,
        end_date: endDate,
        day_start_time: dayStart,
        day_end_time: dayEnd,
        slot_duration_minutes: slotDuration,
        break_duration_minutes: breakDuration,
        weekdays: ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi"],
        rooms: roomList,
        daily_cap_per_teacher: dailyCap,
        is_active: true,
      });
      setCampaign(next);
      setFeedback("Campaign saved.");
      await loadCampaignData(selectedDepartmentId);
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const saveStudentAssignment = async () => {
    if (!studentSubjectId) {
      setFeedback("Select a subject first.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await assignStudentToPfeSubject({
        subject_id: studentSubjectId,
        student_id: studentId || null,
      });
      if (selectedDepartmentId) {
        setSubjects(await getPfeSubjects(selectedDepartmentId));
      }
      if (campaign) {
        setAssignments(await listPfeAssignments(campaign.id));
      }
      setStudents(await listPfeStudents(false));
      setFeedback(response.message);
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "34px 38px", maxWidth: 1320 }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 8,
          }}
        >
          PFE Scheduling Control Room
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>PFE Campaign Scheduler</h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          Configure schedule bounds and manually commit assignments.
        </p>
      </div>

      {feedback ? (
        <div
          style={{
            marginBottom: 14,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            color: "var(--text2)",
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}
      >
        <Btn accent={ACCENT} onClick={refreshAll}>
          Refresh
        </Btn>
        <Btn accent={ACCENT} variant="ghost" onClick={saveCampaign}>
          Save campaign
        </Btn>
        {busy ? <Tag>Working...</Tag> : null}
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Tag color={ACCENT} bg="var(--chef-dim)">
          Campaign: {campaign ? campaign.name : "None"}
        </Tag>
        <Tag>Subjects: {subjects.length}</Tag>
        <Tag>Assignments: {assignments.length}</Tag>
        <Tag>Departments: {departments.length}</Tag>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
        <Card style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            Campaign setup
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Select
              label="Department"
              value={selectedDepartmentId}
              onChange={(event) => setSelectedDepartmentId(event.target.value)}
            >
              <option value="">-- select department --</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Input
              label="Campaign name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <Input
              label="End date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
            <Input
              label="Day start"
              type="time"
              value={dayStart}
              onChange={(event) => setDayStart(event.target.value)}
            />
            <Input
              label="Day end"
              type="time"
              value={dayEnd}
              onChange={(event) => setDayEnd(event.target.value)}
            />
            <Input
              label="Slot duration (min)"
              type="number"
              value={slotDuration}
              onChange={(event) =>
                setSlotDuration(Number(event.target.value || 60))
              }
            />
            <Input
              label="Break duration (min)"
              type="number"
              value={breakDuration}
              onChange={(event) =>
                setBreakDuration(Number(event.target.value || 15))
              }
            />
            <Input
              label="Daily cap per teacher"
              type="number"
              value={dailyCap}
              onChange={(event) => setDailyCap(Number(event.target.value || 0))}
            />
            <Input
              label="Rooms (comma separated)"
              value={rooms}
              onChange={(event) => setRooms(event.target.value)}
            />
          </div>
        </Card>

        <Card style={{ padding: 14 }}>
          <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 10 }}>
            Rule applied for target=6 teachers: preferred sessions in [10,12]
            and available-not-preferred at least 6.
          </p>

        </Card>
      </div>

      <Card style={{ marginTop: 14, padding: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>
          Student assignment to PFE subject
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <Select
            label="PFE Subject"
            value={studentSubjectId}
            onChange={(event) => setStudentSubjectId(event.target.value)}
          >
            <option value="">-- select subject --</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.title} | current: {subject.student_name}
              </option>
            ))}
          </Select>

          <Select
            label="Student"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          >
            <option value="">-- unassign student --</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.username}
                {student.assigned_to_pfe ? " (already assigned)" : ""}
              </option>
            ))}
          </Select>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Btn accent={ACCENT} variant="ghost" onClick={saveStudentAssignment}>
            Save student assignment
          </Btn>
          <Tag>Student candidates: {students.length}</Tag>
        </div>
      </Card>

      <Card style={{ marginTop: 14, padding: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Assignments</div>
        <div
          style={{ display: "grid", gap: 8, maxHeight: 420, overflow: "auto" }}
        >
          {assignments.map((item) => (
            <div
              key={item.subject_id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                padding: "10px 12px",
                background: "var(--surface)",
              }}
            >
              <div style={{ fontWeight: 700 }}>{item.subject_title}</div>
              <div
                style={{
                  color: "var(--text2)",
                  fontSize: 12,
                  margin: "3px 0 7px",
                }}
              >
                Student: {item.student_name} | Slot:{" "}
                {item.slot
                  ? `${item.slot.date} ${item.slot.start_time.slice(0, 5)}-${item.slot.end_time.slice(0, 5)} ${item.slot.room}`
                  : "No slot"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {item.jury.map((jury) => (
                  <Tag key={jury.assignment_id}>
                    {jury.role}: {jury.teacher_name}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
          {assignments.length === 0 ? (
            <div style={{ color: "var(--text2)", fontSize: 13 }}>
              No assignments yet.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
