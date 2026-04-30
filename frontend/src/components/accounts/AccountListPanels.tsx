import { Select } from "../UI";
import type { AdminClass, AdminStudent, AdminTeacher } from "../../services/admin";

interface Props {
  teachers: AdminTeacher[];
  students: AdminStudent[];
  classes: AdminClass[];
  selectedClassId: string;
  onClassChange: (id: string) => void;
}

export default function AccountListPanels({
  teachers,
  students,
  classes,
  selectedClassId,
  onClassChange,
}: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Enseignants ({teachers.length})</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              style={{
                padding: "8px 10px",
                border: "1px solid var(--border2)",
                borderRadius: "var(--r-md)",
              }}
            >
              <strong>{teacher.username}</strong>
              <div style={{ color: "var(--text2)", fontSize: 13 }}>
                {teacher.email}
              </div>
              <div style={{ color: "var(--text3)", fontSize: 12 }}>
                {teacher.department}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Étudiants (par classe)</h3>
        <Select
          label="Filtrer classe"
          value={selectedClassId}
          onChange={(e) => onClassChange(e.target.value)}
        >
          <option value="">-- sélectionner --</option>
          {classes.map((c) => (
            <option
              key={c.id}
              value={c.id}
            >{`${c.niveau}-${c.section}-${c.num}`}</option>
          ))}
        </Select>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {students.map((student) => (
            <div
              key={`${student.email}-${student.username}`}
              style={{
                padding: "8px 10px",
                border: "1px solid var(--border2)",
                borderRadius: "var(--r-md)",
              }}
            >
              <strong>{student.username}</strong>
              <div style={{ color: "var(--text2)", fontSize: 13 }}>
                {student.email}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
