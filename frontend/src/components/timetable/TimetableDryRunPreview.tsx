import { GlassCard } from "../glass/GlassCard";
import { DataTable, type DataTableColumn } from "../tables/DataTable";
import type { TimetableDryRunResult, TimetableRow } from "../../services/timetable";

/*
  TimetableDryRunPreview — three glass panels:
  summary, errors+conflicts, parsed-row preview.
*/

interface TimetableDryRunPreviewProps {
  report: TimetableDryRunResult;
}

const A = "var(--chef-accent)";

export const TimetableDryRunPreview = ({ report }: TimetableDryRunPreviewProps) => {
  const columns: DataTableColumn<TimetableRow>[] = [
    {
      key: "day",
      header: "Jour",
      width: 110,
      render: (row) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {row.day_of_week}
        </span>
      ),
    },
    {
      key: "time",
      header: "Heure",
      width: 130,
      render: (row) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {row.start_time.slice(0, 5)} – {row.end_time.slice(0, 5)}
        </span>
      ),
    },
    {
      key: "subject",
      header: "Matière",
      render: (row) => <span style={{ fontWeight: 500 }}>{row.subject}</span>,
    },
    {
      key: "teacher",
      header: "Enseignant",
      render: (row) => <span style={{ color: "var(--text2)" }}>{row.teacher}</span>,
    },
    {
      key: "class",
      header: "Classe",
      width: 130,
      render: (row) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--blue-soft)",
          }}
        >
          {row.class}
        </span>
      ),
    },
    {
      key: "room",
      header: "Salle",
      width: 90,
      align: "right",
      render: (row) => <span style={{ color: "var(--text2)" }}>{row.room}</span>,
    },
  ];

  const hasIssues = report.errors.length > 0 || report.conflicts.length > 0;

  return (
    <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <GlassCard accent={A} padding={16}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "1.4px",
              marginBottom: 8,
            }}
          >
            Lignes analysées
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
            {report.parsed_count}
          </div>
        </GlassCard>
        <GlassCard accent="var(--danger)" padding={16}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "1.4px",
              marginBottom: 8,
            }}
          >
            Erreurs
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: report.errors.length ? "var(--danger)" : "var(--text)",
              letterSpacing: "-0.03em",
            }}
          >
            {report.errors.length}
          </div>
        </GlassCard>
        <GlassCard accent="var(--warning)" padding={16}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "1.4px",
              marginBottom: 8,
            }}
          >
            Conflits
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: report.conflicts.length ? "var(--warning)" : "var(--text)",
              letterSpacing: "-0.03em",
            }}
          >
            {report.conflicts.length}
          </div>
        </GlassCard>
      </div>

      {hasIssues ? (
        <GlassCard accent="var(--danger)" padding={16}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: 14 }}>
            Anomalies à corriger
          </h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              color: "var(--text2)",
              fontSize: 13,
              display: "grid",
              gap: 4,
            }}
          >
            {report.errors.map((error) => (
              <li key={error} style={{ color: "var(--danger)" }}>
                {error}
              </li>
            ))}
            {report.conflicts.map((conflict) => (
              <li key={conflict} style={{ color: "var(--warning)" }}>
                {conflict}
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}

      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text3)",
            textTransform: "uppercase",
            letterSpacing: "1.4px",
            marginBottom: 8,
          }}
        >
          Aperçu (premières {report.preview.length} lignes)
        </div>
        <DataTable
          columns={columns}
          rows={report.preview}
          rowKey={(row, index) =>
            `${row.day_of_week}-${row.start_time}-${row.class}-${index}`
          }
          dense
        />
      </div>
    </div>
  );
};

export default TimetableDryRunPreview;
