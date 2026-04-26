import { useCallback, useEffect, useState } from "react";
import { Btn, Card, Tag } from "../../components/UI";
import {
  getPfeSessionDepartments,
  seedPfeSessionDemo,
  unlockPfeSessionForHead,
  type PfeSessionDepartment,
  type SeedPfeSessionDemoResponse,
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

function campaignStatusLabel(row: PfeSessionDepartment): string {
  if (!row.campaign) {
    return "No campaign";
  }
  if (row.campaign.schedule_generated) {
    return "Generated";
  }
  if (row.campaign.availability_open) {
    return "Collecting dates";
  }
  if (row.campaign.head_can_start) {
    return "Head unlocked";
  }
  return "Draft";
}

export default function AdminPfeSessions() {
  const [rows, setRows] = useState<PfeSessionDepartment[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [demoData, setDemoData] = useState<SeedPfeSessionDemoResponse | null>(
    null,
  );

  const loadRows = useCallback(async () => {
    const data = await getPfeSessionDepartments();
    setRows(data);
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    setFeedback("");
    try {
      await loadRows();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  }, [loadRows]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unlockDepartment = async (departmentId: string) => {
    setBusy(true);
    setFeedback("");
    try {
      const response = await unlockPfeSessionForHead({
        department_id: departmentId,
      });
      setFeedback(response.message);
      await loadRows();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const seedDemo = async () => {
    setBusy(true);
    setFeedback("");
    try {
      const response = await seedPfeSessionDemo();
      setDemoData(response);
      setFeedback(response.message);
      await loadRows();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "34px 38px", maxWidth: 1180 }}>
      <div style={{ marginBottom: 18 }}>
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
          Start PFE Sessions
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>Start PFE Sessions</h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          Unlock department heads to start the teacher availability collection
          process.
        </p>
      </div>

      <div
        style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}
      >
        <Btn accent={ACCENT} onClick={refresh}>
          Refresh
        </Btn>
        <Btn accent={ACCENT} variant="ghost" onClick={seedDemo}>
          Seed demo scenario
        </Btn>
        {busy ? <Tag>Working...</Tag> : null}
      </div>

      {feedback ? (
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>{feedback}</div>
        </Card>
      ) : null}

      {demoData ? (
        <Card style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            Demo accounts ready
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <div
                style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}
              >
                Department head
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                {demoData.accounts.head.username}
                <br />
                {demoData.accounts.head.email}
                <br />
                Password: {demoData.accounts.head.password}
              </div>
            </div>
            <div>
              <div
                style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}
              >
                Teacher (3 PFEs)
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                {demoData.accounts.teacher.username}
                <br />
                {demoData.accounts.teacher.email}
                <br />
                Password: {demoData.accounts.teacher.password}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg2)" }}>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>
                Department
              </th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>Head</th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>
                Status
              </th>
              <th style={{ textAlign: "left", padding: "12px 14px" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.department_id}
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <td style={{ padding: "12px 14px" }}>{row.department_name}</td>
                <td style={{ padding: "12px 14px", color: "var(--text2)" }}>
                  {row.head
                    ? `${row.head.username} (${row.head.email})`
                    : "No head assigned"}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <Tag color={ACCENT} bg="var(--chef-dim)">
                    {campaignStatusLabel(row)}
                  </Tag>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <Btn
                    accent={ACCENT}
                    variant="ghost"
                    onClick={() => unlockDepartment(row.department_id)}
                    style={{ padding: "8px 12px" }}
                  >
                    Unlock head start
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
