import { Btn, Card, Select, Tag } from "../UI";
import type { PfeAssignmentListItem, PfeStudentCandidate, PfeSubjectItem } from "../../services/admin";

interface Props {
  accent: string;
  subjects: PfeSubjectItem[];
  students: PfeStudentCandidate[];
  assignments: PfeAssignmentListItem[];
  studentSubjectId: string;
  studentId: string;
  onSubjectChange: (id: string) => void;
  onStudentChange: (id: string) => void;
  onSave: () => void;
}

export default function StudentAssignmentPanel({
  accent,
  subjects,
  students,
  assignments,
  studentSubjectId,
  studentId,
  onSubjectChange,
  onStudentChange,
  onSave,
}: Props) {
  return (
    <>
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
            onChange={(e) => onSubjectChange(e.target.value)}
          >
            <option value="">-- select subject --</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} | current: {s.student_name}
              </option>
            ))}
          </Select>
          <Select
            label="Student"
            value={studentId}
            onChange={(e) => onStudentChange(e.target.value)}
          >
            <option value="">-- unassign student --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.username}
                {s.assigned_to_pfe ? " (already assigned)" : ""}
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
          <Btn accent={accent} variant="ghost" onClick={onSave}>
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
    </>
  );
}
