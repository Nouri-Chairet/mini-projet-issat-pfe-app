import { useEffect, useMemo, useState } from "react";
import {
  getPfeCampaign,
  listPfeAssignments,
  type PfeAssignmentListItem,
} from "../../services/admin";

const A = "var(--ens-accent)";

export default function EnseignantPlanning() {
  const [items, setItems] = useState<PfeAssignmentListItem[]>([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const campaign = await getPfeCampaign();
        const rows = await listPfeAssignments(campaign.id);
        if (mounted) {
          setItems(rows.filter((row) => Boolean(row.slot)));
        }
      } catch {
        if (mounted) {
          setFeedback("Aucune soutenance PFE publiée pour le moment.");
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aKey = `${a.slot?.date || ""} ${a.slot?.start_time || ""}`;
        const bKey = `${b.slot?.date || ""} ${b.slot?.start_time || ""}`;
        return aKey.localeCompare(bKey);
      }),
    [items],
  );

  return (
    <div style={{ padding: "36px 40px", maxWidth: 980 }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: 8,
          }}
        >
          Planning PFE
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-1.5px",
          }}
        >
          Mes dates de soutenance
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          {sorted.length} soutenance(s) planifiée(s)
        </p>
      </div>

      {feedback ? (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            background: "var(--surface)",
            padding: "10px 12px",
            marginBottom: 12,
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {sorted.map((item) => (
          <div
            key={item.subject_id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              background: "var(--surface)",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: A,
                marginBottom: 6,
              }}
            >
              {item.slot?.date} {item.slot?.start_time.slice(0, 5)}-
              {item.slot?.end_time.slice(0, 5)} {item.slot?.room}
            </div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {item.subject_title}
            </div>
            <div
              style={{ color: "var(--text2)", fontSize: 13, marginBottom: 5 }}
            >
              Étudiant: {item.student_name}
            </div>
            <div style={{ color: "var(--text2)", fontSize: 12 }}>
              Jury:{" "}
              {item.jury
                .map((member) => `${member.role} ${member.teacher_name}`)
                .join(" | ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
