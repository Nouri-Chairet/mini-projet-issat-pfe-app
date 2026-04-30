import { useTeacherPresence } from "../../hooks/useTeacherPresence";
import { Btn, Card, Tag } from "../../components/UI";
import { GlassCard } from "../../components/glass/GlassCard";
import { DataTable, type DataTableColumn } from "../../components/tables/DataTable";
import Icon from "../../components/Icon";
import ProfileAvatar from "../../components/ProfileAvatar";
import type {
  PresenceHistoryRow,
  PresenceRosterStudent,
} from "../../services/presence";

/*
  EnseignantPresence — page de feuille de présence côté enseignant.

  Le hook useTeacherPresence gère l'état (cours du jour, roster, toggles,
  enregistrement, historique). Cette page ne fait que composer.
*/

const A = "var(--ens-accent)";
const W = "var(--danger)";

export default function EnseignantPresence() {
  const flow = useTeacherPresence();

  const rosterColumns: DataTableColumn<PresenceRosterStudent>[] = [
    {
      key: "student",
      header: "Étudiant",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ProfileAvatar name={row.username} accent={A} size={30} />
          <div>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>
              {row.username}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "ncin",
      header: "CIN",
      width: 130,
      render: (row) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text2)",
          }}
        >
          {row.ncin ?? "—"}
        </span>
      ),
    },
    {
      key: "presence",
      header: "Présent",
      width: 130,
      align: "right",
      render: (row) => {
        const present = Boolean(flow.presence[row.id]);
        return (
          <button
            onClick={() => flow.togglePresence(row.id)}
            aria-pressed={present}
            aria-label={`Marquer ${row.username} comme ${present ? "absent" : "présent"}`}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--r-md)",
              border: `1px solid ${present ? "var(--ens-accent)" : "var(--danger)"}40`,
              background: present ? "var(--ens-dim)" : "var(--danger-dim)",
              color: present ? "var(--ens-accent)" : "var(--danger)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <Icon name={present ? "check" : "x"} size={12} />
            {present ? "Présent" : "Absent"}
          </button>
        );
      },
    },
  ];

  const historyColumns: DataTableColumn<PresenceHistoryRow>[] = [
    {
      key: "student",
      header: "Étudiant",
      render: (row) => (
        <span style={{ fontWeight: 600, color: "var(--text)" }}>
          {row.student_name}
        </span>
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
      width: 110,
      align: "right",
      render: (row) => (
        <Tag
          color={row.warning ? W : "var(--text2)"}
          bg={row.warning ? "var(--danger-dim)" : "var(--surface2)"}
        >
          {row.warning ? <Icon name="alert-triangle" size={11} /> : null}
          {row.percent.toFixed(1)}%
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1200 }}>
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
          Module · Présence
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            letterSpacing: "-0.035em",
            fontFamily: "var(--font-display)",
          }}
        >
          Feuilles de présence
        </h1>
        <p
          style={{
            color: "var(--text2)",
            margin: "8px 0 0 0",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          Sélectionnez un cours du jour, marquez les étudiants présents puis
          enregistrez. Affichez l&apos;historique pour identifier les étudiants
          en alerte (&gt;20% d&apos;absence).
        </p>
      </div>

      {!flow.isPublished && !flow.loading ? (
        <Card
          className="fu1"
          style={{
            padding: 14,
            marginBottom: 16,
            borderColor: "var(--warning)40",
            background: "rgba(212,175,55,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="alert-triangle" size={16} color="var(--warning)" />
            <span style={{ color: "var(--warning)", fontSize: 13 }}>
              L&apos;emploi du temps n&apos;est pas encore publié.
              Contactez l&apos;administration.
            </span>
          </div>
        </Card>
      ) : null}

      {/* Today's classes selector */}
      <GlassCard
        accent={A}
        padding={20}
        className="fu1"
        style={{ marginBottom: 16, display: "grid", gap: 14 }}
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
            Step 01 · Cours du jour
          </div>
          <h3 style={{ margin: "6px 0 0 0", fontSize: 18 }}>
            Sélectionnez la séance
          </h3>
        </div>

        {flow.todayClasses.length === 0 ? (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              color: "var(--text3)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              border: "1px dashed var(--border2)",
              borderRadius: "var(--r-md)",
            }}
          >
            {flow.loading
              ? "Chargement…"
              : "Aucun cours prévu aujourd'hui."}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {flow.todayClasses.map((cls) => {
              const active = cls.id === flow.selectedScheduleId;
              return (
                <button
                  key={cls.id}
                  onClick={() => flow.setSelectedScheduleId(cls.id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--r-md)",
                    border: `1px solid ${active ? A : "var(--border2)"}`,
                    background: active ? "var(--ens-dim)" : "var(--surface)",
                    color: active ? A : "var(--text2)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    fontFamily: "inherit",
                    minWidth: 180,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.5px",
                      color: active ? A : "var(--text3)",
                    }}
                  >
                    {cls.start_time.slice(0, 5)} – {cls.end_time.slice(0, 5)}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2, color: "var(--text)" }}>
                    {cls.subject}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--blue-soft)",
                      marginTop: 2,
                    }}
                  >
                    {cls.class_label} · {cls.room}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Roster */}
      {flow.roster ? (
        <GlassCard
          accent={A}
          padding={20}
          className="fu2"
          style={{ marginBottom: 16, display: "grid", gap: 14 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 10,
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
                Step 02 · Pointage
              </div>
              <h3 style={{ margin: "6px 0 0 0", fontSize: 18 }}>
                {flow.roster.schedule.subject} ·{" "}
                {flow.roster.schedule.class_label}
              </h3>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text3)",
                  marginTop: 4,
                  letterSpacing: "0.5px",
                }}
              >
                Séance du{" "}
                {new Date(flow.roster.session_date).toLocaleDateString("fr-FR")}
                {" · "}
                {flow.roster.schedule.start_time.slice(0, 5)}–
                {flow.roster.schedule.end_time.slice(0, 5)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag color="var(--success)" bg="var(--ens-dim)">
                {flow.stats.present} présents
              </Tag>
              <Tag color={W} bg="var(--danger-dim)">
                {flow.stats.absent} absents
              </Tag>
              <Tag>{flow.stats.total} total</Tag>
            </div>
          </div>

          <DataTable
            columns={rosterColumns}
            rows={flow.roster.students}
            rowKey={(row) => row.id}
            emptyLabel="Aucun étudiant inscrit dans cette classe."
            dense
          />

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Btn accent={A} onClick={flow.save} disabled={flow.busy}>
              {flow.busy ? "Enregistrement…" : "Enregistrer la feuille"}
            </Btn>
            <Btn accent={A} variant="ghost" onClick={flow.setAllPresent} disabled={flow.busy}>
              <Icon name="check-circle" size={14} /> Tout présent
            </Btn>
            <Btn accent={A} variant="muted" onClick={flow.loadHistory} disabled={flow.busy}>
              <Icon name="chart" size={14} /> Voir l&apos;historique
            </Btn>
          </div>

          {flow.feedback ? (
            <div
              role="status"
              style={{
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--border2)",
                background:
                  flow.feedbackKind === "error"
                    ? "var(--danger-dim)"
                    : flow.feedbackKind === "success"
                      ? "var(--ens-dim)"
                      : "var(--surface)",
                color:
                  flow.feedbackKind === "error"
                    ? "var(--danger)"
                    : flow.feedbackKind === "success"
                      ? "var(--ens-accent)"
                      : "var(--text2)",
                fontSize: 13,
              }}
            >
              {flow.feedback}
            </div>
          ) : null}
        </GlassCard>
      ) : null}

      {/* History */}
      {flow.history ? (
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
                Historique
              </div>
              <h3 style={{ margin: "6px 0 0 0", fontSize: 18 }}>
                Cumul d&apos;absences ({flow.history.subject})
              </h3>
              <p style={{ color: "var(--text3)", margin: "4px 0 0 0", fontSize: 12 }}>
                Seuil d&apos;alerte : {flow.history.threshold_percent}%. Les étudiants
                au-dessus du seuil sont mis en évidence en haut de la liste.
              </p>
            </div>
          </div>
          <DataTable
            columns={historyColumns}
            rows={flow.history.students}
            rowKey={(row) => row.student_id}
            emptyLabel="Aucune donnée d'historique."
            rowStyle={(row) =>
              row.warning
                ? { background: "var(--danger-dim)" }
                : undefined
            }
            dense
          />
        </Card>
      ) : null}
    </div>
  );
}
