import { useEffect, useState } from "react";
import { Btn, Card, Tag } from "../../components/UI";
import type { AppUser } from "../../types/app";
import {
  getMyPfeSchedule,
  type TeacherPfeScheduleResponse,
} from "../../services/teacherPfe";

const ACCENT = "var(--ens-accent)";

interface EnseignantPlanningProps {
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

export default function EnseignantPlanning({ user }: EnseignantPlanningProps) {
  const [data, setData] = useState<TeacherPfeScheduleResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const refresh = async () => {
    setBusy(true);
    setFeedback("");
    try {
      setData(await getMyPfeSchedule());
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 960 }}>
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
          PFE Schedule
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>Mes soutenances PFE</h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          {user.name} · This page shows the PFE presentations where you are supervisor or jury member.
        </p>
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <Btn accent={ACCENT} variant="ghost" onClick={refresh}>
          Refresh
        </Btn>
        {busy ? <Tag>Loading...</Tag> : null}
        {data?.campaign ? (
          <Tag>Campaign: {data.campaign.name}</Tag>
        ) : (
          <Tag>No generated campaign</Tag>
        )}
      </div>

      {feedback ? (
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>{feedback}</div>
        </Card>
      ) : null}

      {!data || data.schedule.length === 0 ? (
        <Card style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            No PFE schedule yet
          </div>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>
            This page stays empty until your department head generates the
            schedule.
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {data.schedule.map((item) => (
            <Card key={item.subject_id} style={{ padding: "14px 16px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{item.subject_title}</div>
                  <div
                    style={{
                      color: "var(--text2)",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    Student: {item.student_name}
                    {item.supervisor_name ? ` · Supervisor: ${item.supervisor_name}` : ""}
                  </div>
                </div>
                <Tag color={ACCENT} bg="var(--ens-dim)">
                  {item.slot
                    ? `${item.slot.date} ${item.slot.start_time.slice(0, 5)}-${item.slot.end_time.slice(0, 5)} · ${item.slot.room}`
                    : "Not assigned"}
                </Tag>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
