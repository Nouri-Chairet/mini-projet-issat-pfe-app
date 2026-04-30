import { Btn, Card, Input, Select, Tag } from "../UI";
import type { ManualAssignFormState } from "../../hooks/usePfeSessions";
import type { AdminTeacher, ManagedPfeCampaignDetail } from "../../services/admin";

interface Props {
  accent: string;
  detail: ManagedPfeCampaignDetail;
  form: ManualAssignFormState;
  onChange: (next: ManualAssignFormState) => void;
  selectedUnresolved: ManagedPfeCampaignDetail["unresolved"][number] | null;
  juryTeacherOptions: AdminTeacher[];
  presidentOptions: AdminTeacher[];
  onAssign: () => void;
  onAutoFit: () => void;
  onGenerate: () => void;
}

export default function CampaignDetailPanel({
  accent,
  detail,
  form,
  onChange,
  selectedUnresolved,
  juryTeacherOptions,
  presidentOptions,
  onAssign,
  onAutoFit,
  onGenerate,
}: Props) {
  const set = <K extends keyof ManualAssignFormState>(key: K, val: ManualAssignFormState[K]) =>
    onChange({ ...form, [key]: val });

  return (
    <Card style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>{detail.campaign.name}</h2>
          <div style={{ color: "var(--text2)", marginTop: 6 }}>
            {detail.campaign.department_name} · {detail.campaign.start_date} to{" "}
            {detail.campaign.end_date}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Tag color={accent} bg="var(--chef-dim)">
            {detail.progress.submitted_count}/{detail.progress.total_count}{" "}
            submitted
          </Tag>
          <Tag>Unresolved {detail.unresolved.length}</Tag>
          {detail.unresolved.length > 0 ? (
            <Btn accent={accent} variant="ghost" onClick={onAutoFit}>
              Auto-fit leftovers
            </Btn>
          ) : null}
          {detail.progress.submitted_count === detail.progress.total_count &&
          detail.campaign.status === "collecting_availability" ? (
            <Btn accent={accent} onClick={onGenerate}>
              Generate schedule
            </Btn>
          ) : null}
        </div>
      </div>

      {/* Submitted / Pending */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Card style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Submitted</div>
          <div style={{ display: "grid", gap: 8 }}>
            {detail.teachers_submitted.length === 0 ? (
              <div style={{ color: "var(--text2)" }}>Nobody yet.</div>
            ) : (
              detail.teachers_submitted.map((t) => (
                <div
                  key={t.teacher_id}
                  style={{ color: "var(--text2)", fontSize: 14 }}
                >
                  {t.teacher_name} · {t.entries_count} entries
                </div>
              ))
            )}
          </div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Pending</div>
          <div style={{ display: "grid", gap: 8 }}>
            {detail.teachers_pending.length === 0 ? (
              <div style={{ color: "var(--text2)" }}>Everyone is done.</div>
            ) : (
              detail.teachers_pending.map((t) => (
                <div
                  key={t.teacher_id}
                  style={{ color: "var(--text2)", fontSize: 14 }}
                >
                  {t.teacher_name} · {t.email}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Manual assignment */}
      {detail.unresolved.length > 0 ? (
        <Card style={{ padding: 14, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div style={{ fontWeight: 700 }}>Manual assignment</div>
            {selectedUnresolved ? (
              <Tag>Supervisor: {selectedUnresolved.supervisor_name}</Tag>
            ) : null}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>
                Presentation
              </div>
              <Select
                value={form.subjectId}
                onChange={(e) => set("subjectId", e.target.value)}
              >
                <option value="">Select subject</option>
                {detail.unresolved.map((item) => (
                  <option key={item.subject_id} value={item.subject_id}>
                    {item.subject_title}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
            <Input
              label="Start time"
              type="time"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
            />
            <Input
              label="End time"
              type="time"
              value={form.endTime}
              onChange={(e) => set("endTime", e.target.value)}
            />
            <div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>
                Room
              </div>
              <Select
                value={form.room}
                onChange={(e) => set("room", e.target.value)}
              >
                <option value="">Select room</option>
                {detail.campaign.rooms.map((room) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </Select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>
                Rapporteur
              </div>
              <Select
                value={form.rapporteurId}
                onChange={(e) => set("rapporteurId", e.target.value)}
              >
                <option value="">Select teacher</option>
                {juryTeacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.username}</option>
                ))}
              </Select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>
                President
              </div>
              <Select
                value={form.presidentId}
                onChange={(e) => set("presidentId", e.target.value)}
              >
                <option value="">Select teacher</option>
                {presidentOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.username}</option>
                ))}
              </Select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn accent={accent} onClick={onAssign}>
              Assign presentation
            </Btn>
          </div>
        </Card>
      ) : null}

      {/* Presentation table */}
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Presentation list</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg2)" }}>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>Subject</th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>Student</th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>Supervisor</th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>Slot</th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>Jury</th>
            </tr>
          </thead>
          <tbody>
            {detail.assignments.map((a) => (
              <tr key={a.subject_id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 14px" }}>{a.subject_title}</td>
                <td style={{ padding: "12px 14px" }}>{a.student_name}</td>
                <td style={{ padding: "12px 14px" }}>{a.supervisor_name}</td>
                <td style={{ padding: "12px 14px" }}>
                  {a.slot
                    ? `${a.slot.date} ${a.slot.start_time.slice(0, 5)}-${a.slot.end_time.slice(0, 5)} · ${a.slot.room}`
                    : "Unassigned"}
                </td>
                <td style={{ padding: "12px 14px", color: "var(--text2)" }}>
                  {a.jury.length > 0
                    ? a.jury.map((m) => `${m.role}: ${m.teacher_name}`).join(" · ")
                    : "Not assigned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
