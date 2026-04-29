import { Btn, Card, Input, Select } from "../UI";
import type { AdminTeacher, PfeSubjectItem } from "../../services/admin";
import type { ManualJuryDraft } from "../../hooks/usePfeJury";

interface Props {
  accent: string;
  draft: ManualJuryDraft;
  subjects: PfeSubjectItem[];
  teacherOptions: { value: string; label: string }[];
  teachers: AdminTeacher[];
  onChange: (patch: Partial<ManualJuryDraft>) => void;
  onSubmit: () => void;
}

export default function PfeManualJuryForm({
  accent,
  draft,
  subjects,
  teacherOptions,
  teachers,
  onChange,
  onSubmit,
}: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 14 }}>
      <Card style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>
          Teachers in department
        </div>
        <div
          style={{ display: "grid", gap: 6, maxHeight: 340, overflow: "auto" }}
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
            value={draft.selectedSubjectId}
            onChange={(event) =>
              onChange({ selectedSubjectId: event.target.value })
            }
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
            value={draft.rapporteurId}
            onChange={(event) =>
              onChange({ rapporteurId: event.target.value })
            }
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
            value={draft.presidentId}
            onChange={(event) => onChange({ presidentId: event.target.value })}
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
            value={draft.slotDate}
            onChange={(event) => onChange({ slotDate: event.target.value })}
          />
          <Input
            label="Room (optional)"
            value={draft.slotRoom}
            onChange={(event) => onChange({ slotRoom: event.target.value })}
          />
          <Input
            label="Start"
            type="time"
            value={draft.slotStart}
            onChange={(event) => onChange({ slotStart: event.target.value })}
          />
          <Input
            label="End"
            type="time"
            value={draft.slotEnd}
            onChange={(event) => onChange({ slotEnd: event.target.value })}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <Btn accent={accent} onClick={onSubmit}>
            Save manual jury
          </Btn>
        </div>
      </Card>
    </div>
  );
}
