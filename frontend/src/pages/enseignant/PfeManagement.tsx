import { useEffect, useMemo, useState } from "react";
import { Btn, Card, Input, Select, Tag } from "../../components/UI";
import {
  activatePfeCampaign,
  assignPfeJury,
  exportPfeAssignments,
  getPfeCampaign,
  listDepartmentPfeSubjects,
  listDepartmentTeachers,
  listPfeAssignments,
  pfeAutoAssignCommit,
  pfeAutoAssignDryRun,
  unassignPfeJury,
  type AdminTeacher,
  type AutoAssignPlan,
  type PfeAssignmentListItem,
  type PfeCampaign,
  type PfeSubjectItem,
} from "../../services/admin";

const A = "var(--ens-accent)";

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

export default function EnseignantPfeManagement() {
  const [campaign, setCampaign] = useState<PfeCampaign | null>(null);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [subjects, setSubjects] = useState<PfeSubjectItem[]>([]);
  const [assignments, setAssignments] = useState<PfeAssignmentListItem[]>([]);
  const [plan, setPlan] = useState<AutoAssignPlan | null>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [rapporteurId, setRapporteurId] = useState("");
  const [presidentId, setPresidentId] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [slotRoom, setSlotRoom] = useState("Salle PFE");

  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => ({
        value: teacher.id,
        label: teacher.username,
      })),
    [teachers],
  );

  async function refreshAll() {
    setBusy(true);
    setFeedback("");
    try {
      const [currentCampaign, departmentTeachers, departmentSubjects] =
        await Promise.all([
          getPfeCampaign().catch(() => null),
          listDepartmentTeachers(),
          listDepartmentPfeSubjects(),
        ]);
      setCampaign(currentCampaign);
      setTeachers(departmentTeachers);
      setSubjects(departmentSubjects);
      if (currentCampaign) {
        setAssignments(await listPfeAssignments(currentCampaign.id));
      } else {
        setAssignments([]);
      }
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  const runDryRun = async () => {
    if (!campaign) {
      setFeedback("No active campaign found.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const response = await pfeAutoAssignDryRun({ campaign_id: campaign.id });
      setPlan(response);
      setFeedback("Dry-run completed.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const commitAutoPlan = async () => {
    if (!campaign) {
      setFeedback("No active campaign found.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const response = await pfeAutoAssignCommit({
        campaign_id: campaign.id,
        replace_existing: true,
        block_on_unresolved: false,
      });
      setPlan(response);
      setAssignments(await listPfeAssignments(campaign.id));
      setFeedback("Auto scheduling committed.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const activateSession = async () => {
    if (!campaign) {
      setFeedback("No campaign found to activate.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const activated = await activatePfeCampaign(campaign.id);
      setCampaign(activated);
      setFeedback("Scheduling session activated.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const assignManual = async () => {
    if (!selectedSubjectId) {
      setFeedback("Select a subject first.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      await assignPfeJury({
        pfe_subject_id: selectedSubjectId,
        rapporteur_id: rapporteurId || undefined,
        president_id: presidentId || undefined,
        date: slotDate || undefined,
        start_time: slotDate ? `${slotStart}:00` : undefined,
        end_time: slotDate ? `${slotEnd}:00` : undefined,
        room: slotDate ? slotRoom : undefined,
      });
      if (campaign) {
        setAssignments(await listPfeAssignments(campaign.id));
      }
      setFeedback("Manual jury assignment saved.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    setBusy(true);
    setFeedback("");
    try {
      await unassignPfeJury(assignmentId);
      if (campaign) {
        setAssignments(await listPfeAssignments(campaign.id));
      }
      setFeedback("Assignment removed.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const downloadExport = async () => {
    setBusy(true);
    setFeedback("");
    try {
      const blob = await exportPfeAssignments(campaign?.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "pfe_assignments.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setFeedback("Export downloaded.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1240 }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 8,
          }}
        >
          Department Head PFE Management
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>
          Manage department PFE scheduling
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          Teacher list, PFE list, scheduler dry-run/commit, manual jury edits
          and export.
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
        <Btn accent={A} onClick={refreshAll}>
          Refresh
        </Btn>
        <Btn accent={A} variant="ghost" onClick={activateSession}>
          Activate session
        </Btn>
        <Btn accent={A} variant="ghost" onClick={runDryRun}>
          Run dry-run
        </Btn>
        <Btn accent={A} variant="ghost" onClick={commitAutoPlan}>
          Commit auto plan
        </Btn>
        <Btn accent={A} variant="muted" onClick={downloadExport}>
          Export CSV
        </Btn>
        {busy ? <Tag>Working...</Tag> : null}
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Tag color={A} bg="var(--ens-dim)">
          Campaign: {campaign ? campaign.name : "No active campaign"}
        </Tag>
        <Tag>Teachers: {teachers.length}</Tag>
        <Tag>Subjects: {subjects.length}</Tag>
        <Tag>Assignments: {assignments.length}</Tag>
      </div>

      {plan ? (
        <Card style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag>Total: {plan.stats.subjects_total}</Tag>
            <Tag>Assigned: {plan.stats.assigned_count}</Tag>
            <Tag>Unresolved: {plan.stats.unresolved_count}</Tag>
            <Tag>Generated slots: {plan.stats.slots_generated}</Tag>
          </div>
        </Card>
      ) : null}

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 14 }}
      >
        <Card style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            Teachers in department
          </div>
          <div
            style={{
              display: "grid",
              gap: 6,
              maxHeight: 340,
              overflow: "auto",
            }}
          >
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              >
                <strong>{teacher.username}</strong>
                <div style={{ color: "var(--text2)", fontSize: 12 }}>
                  {teacher.email}
                </div>
                <div style={{ color: "var(--text3)", fontSize: 12 }}>
                  CIN: {teacher.ncin ?? "-"}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            Manual jury update
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Select
              label="Subject"
              value={selectedSubjectId}
              onChange={(event) => setSelectedSubjectId(event.target.value)}
            >
              <option value="">-- select subject --</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title} - {subject.student_name}
                </option>
              ))}
            </Select>
            <div />
            <Select
              label="Rapporteur"
              value={rapporteurId}
              onChange={(event) => setRapporteurId(event.target.value)}
            >
              <option value="">-- none --</option>
              {teacherOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="President"
              value={presidentId}
              onChange={(event) => setPresidentId(event.target.value)}
            >
              <option value="">-- none --</option>
              {teacherOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Input
              label="Date (optional)"
              type="date"
              value={slotDate}
              onChange={(event) => setSlotDate(event.target.value)}
            />
            <Input
              label="Room (optional)"
              value={slotRoom}
              onChange={(event) => setSlotRoom(event.target.value)}
            />
            <Input
              label="Start"
              type="time"
              value={slotStart}
              onChange={(event) => setSlotStart(event.target.value)}
            />
            <Input
              label="End"
              type="time"
              value={slotEnd}
              onChange={(event) => setSlotEnd(event.target.value)}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn accent={A} onClick={assignManual}>
              Save manual jury
            </Btn>
          </div>
        </Card>
      </div>

      <Card style={{ padding: 14, marginTop: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>
          Current assignments
        </div>
        <div style={{ display: "grid", gap: 8 }}>
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
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {item.subject_title}
              </div>
              <div
                style={{ color: "var(--text2)", fontSize: 12, marginBottom: 6 }}
              >
                Student: {item.student_name} | Slot:{" "}
                {item.slot
                  ? `${item.slot.date} ${item.slot.start_time.slice(0, 5)}-${item.slot.end_time.slice(0, 5)} ${item.slot.room}`
                  : "No slot"}
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                {item.jury.map((jury) => (
                  <div
                    key={jury.assignment_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid var(--border2)",
                      borderRadius: 8,
                      padding: "6px 8px",
                      fontSize: 12,
                    }}
                  >
                    <span>
                      {jury.role}: {jury.teacher_name}
                    </span>
                    <Btn
                      variant="muted"
                      onClick={() => void removeAssignment(jury.assignment_id)}
                    >
                      Remove
                    </Btn>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
