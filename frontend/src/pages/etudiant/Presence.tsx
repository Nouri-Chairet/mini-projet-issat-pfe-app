import { useStudentPresence } from "../../hooks/useStudentPresence";
import { Btn, Card, Tag } from "../../components/UI";
import { GlassCard } from "../../components/glass/GlassCard";
import { DataTable, type DataTableColumn } from "../../components/tables/DataTable";
import Icon from "../../components/Icon";
import type { StudentSubjectAbsence } from "../../services/presence";

/*
  EtudiantPresence — read-only summary of the student's absences.

  The hook (useStudentPresence) returns data already sorted server-side
  (warning rows first). The page just renders three sections: KPI tiles,
  warning banner, and per-subject table.
*/

const A = "var(--etu-accent)";
const W = "var(--danger)";

export default function EtudiantPresence() {
  const { summary, loading, error, refresh } = useStudentPresence();

  const columns: DataTableColumn<StudentSubjectAbsence>[] = [
    {
      key: "subject",
      header: "Matière",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {row.warning ? (
            <Icon name="alert-triangle" size={14} color={W} />
          ) : (
            <Icon name="check-circle" size={14} color="var(--success)" />
          )}
          <span
            style={{
              fontWeight: 600,
              color: row.warning ? W : "var(--text)",
            }}
          >
            {row.subject}
          </span>
        </div>
      ),
    },
    {
      key: "sessions",
      header: "Séances",
      width: 110,
      render: (row) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text2)",
          }}
        >
          {row.sessions_total}
        </span>
      ),
    },
    {
      key: "absences",
      header: "Absences",
      width: 110,
      render: (row) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: row.warning ? W : "var(--text2)",
            fontWeight: row.warning ? 700 : 500,
          }}
        >
          {row.absences}
        </span>
      ),
    },
    {
      key: "percent",
      header: "%",
      width: 130,
      align: "right",
      render: (row) => (
        <Tag
          color={row.warning ? W : "var(--success)"}
          bg={row.warning ? "var(--danger-dim)" : "var(--etu-dim)"}
        >
          {row.percent.toFixed(1)}%
        </Tag>
      ),
    },
  ];

  const warnings = summary?.subjects.filter((s) => s.warning) ?? [];
  const overallWarning =
    summary !== null &&
    summary.totals.percent >= summary.threshold_percent;

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100 }}>
      {/* Header */}
      <div className="fu" style={{ marginBottom: 22 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "1.8px",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="clipboard-check" size={11} color={A} />
          Module · Mes présences
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            letterSpacing: "-0.035em",
            fontFamily: "var(--font-display)",
          }}
        >
          Suivi de mes absences
        </h1>
        <p
          style={{
            color: "var(--text2)",
            margin: "8px 0 0 0",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          Récapitulatif de votre assiduité par matière.{" "}
          {summary
            ? `Le seuil d'alerte est fixé à ${summary.threshold_percent}% d'absence.`
            : null}
        </p>
      </div>

      {error ? (
        <Card
          className="fu1"
          style={{
            padding: 14,
            marginBottom: 16,
            borderColor: "var(--danger)40",
            background: "var(--danger-dim)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="alert-circle" size={16} color={W} />
            <span style={{ color: W, fontSize: 13, flex: 1 }}>{error}</span>
            <Btn accent={A} variant="ghost" onClick={refresh}>
              Réessayer
            </Btn>
          </div>
        </Card>
      ) : null}

      {/* KPI strip */}
      {summary ? (
        <div
          className="fu1"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 16,
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
                marginBottom: 6,
              }}
            >
              Classe
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {summary.class_label ?? "—"}
            </div>
          </GlassCard>
          <GlassCard accent={A} padding={16}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text3)",
                textTransform: "uppercase",
                letterSpacing: "1.4px",
                marginBottom: 6,
              }}
            >
              Séances suivies
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
              {summary.totals.sessions}
            </div>
          </GlassCard>
          <GlassCard accent={overallWarning ? W : A} padding={16}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text3)",
                textTransform: "uppercase",
                letterSpacing: "1.4px",
                marginBottom: 6,
              }}
            >
              Total absences
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: overallWarning ? W : "var(--text)",
              }}
            >
              {summary.totals.absences}
            </div>
          </GlassCard>
          <GlassCard accent={overallWarning ? W : A} padding={16}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text3)",
                textTransform: "uppercase",
                letterSpacing: "1.4px",
                marginBottom: 6,
              }}
            >
              Taux global
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: overallWarning ? W : "var(--text)",
              }}
            >
              {summary.totals.percent.toFixed(1)}%
            </div>
          </GlassCard>
        </div>
      ) : null}

      {/* Warning banner */}
      {warnings.length > 0 ? (
        <GlassCard
          accent={W}
          padding={16}
          className="fu2"
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Icon name="alert-triangle" size={20} color={W} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <h3 style={{ margin: 0, color: W, fontSize: 15 }}>
                Attention — {warnings.length} matière(s) au-dessus du seuil
                d&apos;alerte
              </h3>
              <p
                style={{
                  color: "var(--text2)",
                  margin: "4px 0 0 0",
                  fontSize: 13,
                }}
              >
                {warnings.map((w) => `${w.subject} (${w.percent.toFixed(1)}%)`).join(
                  " · ",
                )}
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {/* Table */}
      {summary ? (
        <Card style={{ padding: 18 }} className="fu3">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 14,
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: A,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                }}
              >
                Détail par matière
              </div>
              <h3 style={{ margin: "6px 0 0 0", fontSize: 18 }}>
                Cumul des absences
              </h3>
            </div>
            <Btn accent={A} variant="muted" onClick={refresh} disabled={loading}>
              <Icon name="refresh" size={14} /> Rafraîchir
            </Btn>
          </div>
          <DataTable
            columns={columns}
            rows={summary.subjects}
            rowKey={(row) => row.subject}
            emptyLabel={
              loading
                ? "Chargement…"
                : "Aucune donnée d'assiduité pour le moment."
            }
            rowStyle={(row) =>
              row.warning ? { background: "var(--danger-dim)" } : undefined
            }
            dense
          />
        </Card>
      ) : null}
    </div>
  );
}
