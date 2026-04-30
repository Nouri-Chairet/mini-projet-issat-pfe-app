import { Btn, Card, Tag } from "../UI";
import type { AutoAssignPlan, PfeCampaign } from "../../services/admin";

interface Props {
  accent: string;
  busy: boolean;
  feedback: string;
  campaign: PfeCampaign | null;
  teacherCount: number;
  subjectCount: number;
  assignmentCount: number;
  plan: AutoAssignPlan | null;
  onRefresh: () => void;
  onActivate: () => void;
  onDryRun: () => void;
  onCommit: () => void;
  onExport: () => void;
}

export default function PfeJuryToolbar({
  accent,
  busy,
  feedback,
  campaign,
  teacherCount,
  subjectCount,
  assignmentCount,
  plan,
  onRefresh,
  onActivate,
  onDryRun,
  onCommit,
  onExport,
}: Props) {
  return (
    <>
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
        <Btn accent={accent} onClick={onRefresh}>
          Refresh
        </Btn>
        <Btn accent={accent} variant="ghost" onClick={onActivate}>
          Activate session
        </Btn>
        <Btn accent={accent} variant="ghost" onClick={onDryRun}>
          Run dry-run
        </Btn>
        <Btn accent={accent} variant="ghost" onClick={onCommit}>
          Commit auto plan
        </Btn>
        <Btn accent={accent} variant="muted" onClick={onExport}>
          Export CSV
        </Btn>
        {busy ? <Tag>Working...</Tag> : null}
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Tag color={accent} bg="var(--ens-dim)">
          Campaign: {campaign ? campaign.name : "No active campaign"}
        </Tag>
        <Tag>Teachers: {teacherCount}</Tag>
        <Tag>Subjects: {subjectCount}</Tag>
        <Tag>Assignments: {assignmentCount}</Tag>
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
    </>
  );
}
