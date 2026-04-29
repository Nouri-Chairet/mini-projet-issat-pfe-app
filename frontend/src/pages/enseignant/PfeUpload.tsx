import { useTeacherAddPfe } from "../../hooks/useTeacherAddPfe";
import { Btn, Card, Input, Tag } from "../../components/UI";
import { GlassCard } from "../../components/glass/GlassCard";
import { DataTable, type DataTableColumn } from "../../components/tables/DataTable";
import Icon from "../../components/Icon";
import ProfileAvatar from "../../components/ProfileAvatar";
import type { EligibleStudent, SupervisedSubject } from "../../services/teacherPfeMgmt";

/*
  EnseignantPfeUpload — single-PFE submission flow for teachers.

  Pattern: hook (useTeacherAddPfe) owns all state + side effects;
  this file is presentation only.
*/

const A = "var(--ens-accent)";

export default function EnseignantPfeUpload() {
  const flow = useTeacherAddPfe();

  const eligibleColumns: DataTableColumn<EligibleStudent>[] = [
    {
      key: "select",
      header: "",
      width: 56,
      render: (row) => (
        <input
          type="radio"
          name="eligible-student"
          aria-label={`Sélectionner ${row.username}`}
          checked={flow.selectedStudentId === row.id}
          onChange={() => flow.setSelectedStudentId(row.id)}
          style={{ accentColor: "var(--ens-accent)", cursor: "pointer" }}
        />
      ),
    },
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
          {row.class_label ?? "—"}
        </span>
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
  ];

  const supervisedColumns: DataTableColumn<SupervisedSubject>[] = [
    {
      key: "title",
      header: "Sujet",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text)" }}>{row.title}</div>
          {row.description ? (
            <div
              style={{
                fontSize: 11,
                color: "var(--text3)",
                marginTop: 2,
                maxWidth: 380,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "student",
      header: "Étudiant",
      render: (row) => (
        <div style={{ color: "var(--text2)" }}>
          {row.student_name}
          {row.class_label ? (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--blue-soft)",
                marginTop: 2,
              }}
            >
              {row.class_label}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "created",
      header: "Créé le",
      width: 150,
      align: "right",
      render: (row) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text3)",
          }}
        >
          {new Date(row.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
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
          <Icon name="briefcase" size={11} color={A} />
          Module · Encadrement PFE
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            letterSpacing: "-0.035em",
            fontFamily: "var(--font-display)",
          }}
        >
          Mes PFEs
        </h1>
        <p
          style={{
            color: "var(--text2)",
            margin: "8px 0 0 0",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          Saisissez le sujet PFE proposé pour un étudiant que vous encadrez. Un
          étudiant ne peut être lié qu&apos;à un seul sujet : la liste affiche
          uniquement les étudiants éligibles (sans sujet existant).
        </p>
      </div>

      {/* KPI strip */}
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
            Étudiants éligibles
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
            {flow.eligible.length}
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
            Sujets que j&apos;encadre
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
            {flow.supervised.length}
          </div>
        </GlassCard>
      </div>

      {/* Form */}
      <GlassCard
        accent={A}
        padding={20}
        className="fu2"
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
            Step 01 · Sélection
          </div>
          <h3 style={{ margin: "6px 0 0 0", fontSize: 18 }}>
            Choisir un étudiant éligible
          </h3>
        </div>

        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text3)",
              pointerEvents: "none",
            }}
          >
            <Icon name="search" size={14} />
          </span>
          <input
            value={flow.search}
            onChange={(e) => flow.setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, classe ou CIN…"
            style={{
              width: "100%",
              padding: "11px 14px 11px 36px",
              background: "var(--bg2)",
              border: "1px solid var(--border2)",
              borderRadius: "var(--r-md)",
              color: "var(--text)",
              outline: "none",
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          <DataTable
            columns={eligibleColumns}
            rows={flow.filteredEligible}
            rowKey={(row) => row.id}
            emptyLabel={
              flow.loading
                ? "Chargement de la liste…"
                : flow.eligible.length === 0
                  ? "Aucun étudiant éligible (tous ont déjà un sujet)."
                  : "Aucun résultat pour cette recherche."
            }
            rowStyle={(row) =>
              row.id === flow.selectedStudentId
                ? {
                    background: "var(--ens-dim)",
                    boxShadow: "inset 3px 0 0 0 var(--ens-accent)",
                  }
                : undefined
            }
            dense
          />
        </div>

        {flow.selectedStudent ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--ens-accent)40",
              background: "var(--ens-dim)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
            }}
          >
            <Icon name="check-circle" size={16} color={A} />
            <span style={{ color: "var(--text)" }}>
              Sélectionné : <strong>{flow.selectedStudent.username}</strong>
              {flow.selectedStudent.class_label
                ? ` · ${flow.selectedStudent.class_label}`
                : ""}
            </span>
          </div>
        ) : null}

        <div
          style={{
            borderTop: "1px solid var(--border2)",
            paddingTop: 14,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: A,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
            }}
          >
            Step 02 · Sujet
          </div>

          <Input
            label="Titre du PFE"
            accent={A}
            value={flow.title}
            onChange={(e) => flow.setTitle(e.target.value)}
            placeholder="Ex. Plateforme web de gestion des stages"
            maxLength={240}
          />

          <div>
            <label
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                color: "var(--text2)",
                display: "block",
                marginBottom: 8,
              }}
            >
              Description (facultative)
            </label>
            <textarea
              value={flow.description}
              onChange={(e) => flow.setDescription(e.target.value)}
              placeholder="Brève description des objectifs et de la portée du sujet…"
              rows={4}
              style={{
                width: "100%",
                padding: "11px 14px",
                background: "var(--bg2)",
                border: "1px solid var(--border2)",
                borderRadius: "var(--r-md)",
                color: "var(--text)",
                outline: "none",
                fontSize: 13,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Btn accent={A} onClick={flow.submit} disabled={!flow.canSubmit}>
              {flow.busy ? "Enregistrement…" : "Enregistrer le PFE"}
            </Btn>
            <Btn accent={A} variant="muted" onClick={flow.refresh} disabled={flow.busy}>
              Rafraîchir la liste
            </Btn>
            {flow.feedback ? (
              <Tag
                color={flow.feedback.ok ? "var(--ens-accent)" : "var(--danger)"}
                bg={flow.feedback.ok ? "var(--ens-dim)" : "var(--danger-dim)"}
              >
                {flow.feedback.ok ? "OK" : "ERREUR"}
              </Tag>
            ) : null}
          </div>

          {flow.feedback ? (
            <div
              role="status"
              style={{
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--border2)",
                background: flow.feedback.ok ? "var(--ens-dim)" : "var(--danger-dim)",
                color: flow.feedback.ok ? "var(--ens-accent)" : "var(--danger)",
                fontSize: 13,
              }}
            >
              {flow.feedback.message}
            </div>
          ) : null}
        </div>
      </GlassCard>

      {/* My supervised subjects */}
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
              Vos encadrements
            </div>
            <h3 style={{ margin: "6px 0 0 0", fontSize: 18 }}>
              Sujets PFE que vous encadrez
            </h3>
          </div>
          <Tag color={A} bg="var(--ens-dim)">
            {flow.supervised.length} sujet(s)
          </Tag>
        </div>
        <DataTable
          columns={supervisedColumns}
          rows={flow.supervised}
          rowKey={(row) => row.id}
          emptyLabel="Vous n'encadrez aucun sujet pour le moment."
          dense
        />
      </Card>
    </div>
  );
}
