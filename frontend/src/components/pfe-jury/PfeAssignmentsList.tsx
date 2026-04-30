import { Btn, Card } from "../UI";
import type { PfeAssignmentListItem } from "../../services/admin";

interface Props {
  assignments: PfeAssignmentListItem[];
  onRemove: (assignmentId: string) => void;
}

export default function PfeAssignmentsList({ assignments, onRemove }: Props) {
  return (
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
                    onClick={() => void onRemove(jury.assignment_id)}
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
  );
}
