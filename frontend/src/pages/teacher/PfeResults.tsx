import { useEffect, useMemo, useState } from "react";
import { Btn, Card, Tag } from "../../components/UI";
import type { AppUser } from "../../types/app";
import {
  getMyPfeSchedule,
  type TeacherPfeScheduleResponse,
} from "../../services/teacherPfe";

const ACCENT = "var(--ens-accent)";

interface TeacherPfeResultsProps {
  user: AppUser;
}

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

export default function TeacherPfeResults({ user }: TeacherPfeResultsProps) {
  const [schedule, setSchedule] = useState<TeacherPfeScheduleResponse | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    setFeedback("");
    try {
      setSchedule(await getMyPfeSchedule());
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const rows = useMemo(
    () =>
      schedule?.schedule.map((item) => ({
        ...item,
      })) ?? [],
    [schedule],
  );

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1280 }}>
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
          Chef PFE Results
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>Résultats Jury (Chef)</h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          {user.name} can inspect the published schedule with subject metadata
          and the full jury list.
        </p>
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}
      >
        <Btn accent={ACCENT} onClick={refresh}>
          Refresh
        </Btn>
        {busy ? <Tag>Loading...</Tag> : null}
        <Tag color={ACCENT} bg="var(--ens-dim)">
          Campaign: {schedule?.campaign?.name ?? "None"}
        </Tag>
        <Tag>Rows: {rows.length}</Tag>
      </div>

      {feedback ? (
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>{feedback}</div>
        </Card>
      ) : null}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg2)" }}>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>Date</th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>Room</th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>
                Student Name
              </th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>
                Project Subject
              </th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>
                Description
              </th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>Jury</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.subject_id}
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <td style={{ padding: "12px 14px" }}>
                  {row.slot ? row.slot.date : "—"}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {row.slot ? row.slot.room : "—"}
                </td>
                <td style={{ padding: "12px 14px" }}>{row.student_name}</td>
                <td style={{ padding: "12px 14px" }}>{row.subject_title}</td>
                <td style={{ padding: "12px 14px", color: "var(--text2)" }}>
                  {row.description ?? "—"}
                </td>
                <td style={{ padding: "12px 14px", color: "var(--text2)" }}>
                  {(row.jury ?? []).length > 0
                    ? row.jury
                        .map((jury) => `${jury.role}: ${jury.teacher_name}`)
                        .join(" · ")
                    : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 18, color: "var(--text2)" }}>
                  No published schedule yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
