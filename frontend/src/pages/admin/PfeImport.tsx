import { useAdminPfeImport } from "../../hooks/useAdminPfeImport";
import { Btn, Card, Tag } from "../../components/UI";
import { GlassCard } from "../../components/glass/GlassCard";
import { FileDropzone } from "../../components/forms/FileDropzone";
import { DataTable, type DataTableColumn } from "../../components/tables/DataTable";
import Icon from "../../components/Icon";
import type {
  PfeImportPreviewRow,
  PfeImportSkipped,
} from "../../services/adminPfeImport";

/*
  AdminPfeImport — admin-only bulk PFE Excel import page.

  Wraps the existing useAdminPfeImport hook with UI: dropzone, dry-run
  validation panel, commit result, and template download. Same visual
  pattern as the timetable importer (glass surfaces + monoaccents).
*/

const A = "var(--chef-accent)";

export default function AdminPfeImport() {
  const flow = useAdminPfeImport();

  const previewColumns: DataTableColumn<PfeImportPreviewRow>[] = [
    {
      key: "row",
      header: "Ligne",
      width: 70,
      render: (row) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text3)",
          }}
        >
          #{row.row}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      width: 110,
      render: (row) => (
        <Tag
          color={row.action === "create" ? "var(--chef-accent)" : "var(--danger)"}
          bg={row.action === "create" ? "var(--chef-dim)" : "var(--danger-dim)"}
        >
          {row.action === "create" ? "CRÉER" : "REJETÉ"}
        </Tag>
      ),
    },
    {
      key: "title",
      header: "Sujet",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text)" }}>{row.title}</div>
          {row.errors.length > 0 ? (
            <div
              style={{
                fontSize: 11,
                color: "var(--danger)",
                marginTop: 2,
              }}
            >
              {row.errors.join(" · ")}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "student",
      header: "Étudiant",
      width: 200,
      render: (row) => (
        <span style={{ color: "var(--text2)" }}>{row.student_name}</span>
      ),
    },
    {
      key: "supervisor",
      header: "Encadrant",
      width: 200,
      render: (row) => (
        <span style={{ color: "var(--text2)" }}>{row.supervisor_name}</span>
      ),
    },
  ];

  const skippedColumns: DataTableColumn<PfeImportSkipped>[] = [
    {
      key: "row",
      header: "Ligne",
      width: 70,
      render: (r) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text3)",
          }}
        >
          #{r.row}
        </span>
      ),
    },
    {
      key: "student",
      header: "Étudiant",
      width: 220,
      render: (r) => <span style={{ color: "var(--text2)" }}>{r.student_name}</span>,
    },
    {
      key: "reason",
      header: "Motif",
      render: (r) => (
        <span style={{ color: "var(--warning)", fontSize: 12 }}>{r.reason}</span>
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
          <Icon name="spreadsheet" size={11} color={A} />
          Module · Import PFE
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            letterSpacing: "-0.035em",
            fontFamily: "var(--font-display)",
          }}
        >
          Import en masse des sujets PFE
        </h1>
        <p
          style={{
            color: "var(--text2)",
            margin: "8px 0 0 0",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          Importez les sujets PFE de toute la promotion via un fichier Excel.
          La validation détecte les doublons d&apos;étudiants, les enseignants
          inconnus et les titres invalides avant tout import.
        </p>
      </div>

      {/* Importer card */}
      <GlassCard
        accent={A}
        padding={20}
        className="fu1"
        style={{ marginBottom: 16, display: "grid", gap: 14 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
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
              Step 01 · Import Excel
            </div>
            <h3 style={{ margin: "6px 0 0 0", fontSize: 18 }}>
              Charger le fichier des PFEs
            </h3>
            <p style={{ color: "var(--text2)", margin: "6px 0 0 0", fontSize: 13 }}>
              Validation transactionnelle (dry-run) puis import. Téléchargez le
              template officiel ci-dessous si besoin.
            </p>
          </div>
          <Btn accent={A} variant="ghost" onClick={flow.downloadTemplate}>
            <Icon name="download" size={14} /> Télécharger le template
          </Btn>
        </div>

        <FileDropzone
          accent={A}
          file={flow.file}
          onFile={flow.pickFile}
          description="Glissez votre fichier .xlsx ici ou cliquez pour parcourir."
        />

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Btn accent={A} onClick={flow.runDryRun} disabled={flow.busy || !flow.file}>
            {flow.busy ? "Validation…" : "Lancer la validation"}
          </Btn>
          <Btn
            accent={A}
            variant="ghost"
            onClick={flow.runCommit}
            disabled={flow.busy || !flow.canCommit}
          >
            Importer définitivement
          </Btn>
          {flow.dryRun ? (
            <Tag
              color={flow.dryRun.valid ? "var(--chef-accent)" : "var(--danger)"}
              bg={flow.dryRun.valid ? "var(--chef-dim)" : "var(--danger-dim)"}
            >
              {flow.dryRun.valid ? "VALIDE" : "ANOMALIES"}
            </Tag>
          ) : null}
          {flow.dryRun ? (
            <Tag>{flow.dryRun.parsed_count} ligne(s) analysée(s)</Tag>
          ) : null}
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
                    ? "var(--chef-dim)"
                    : "var(--surface)",
              color:
                flow.feedbackKind === "error"
                  ? "var(--danger)"
                  : flow.feedbackKind === "success"
                    ? "var(--chef-accent)"
                    : "var(--text2)",
              fontSize: 13,
            }}
          >
            {flow.feedback}
          </div>
        ) : null}
      </GlassCard>

      {/* Dry-run summary */}
      {flow.dryRun ? (
        <div className="fu2" style={{ display: "grid", gap: 12, marginBottom: 16 }}>
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
                  marginBottom: 6,
                }}
              >
                Total lignes
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
                {flow.dryRun.stats.total}
              </div>
            </GlassCard>
            <GlassCard accent="var(--success)" padding={16}>
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
                À créer
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--success)",
                }}
              >
                {flow.dryRun.stats.create}
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
                  marginBottom: 6,
                }}
              >
                Rejetés
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: flow.dryRun.stats.reject ? "var(--danger)" : "var(--text)",
                }}
              >
                {flow.dryRun.stats.reject}
              </div>
            </GlassCard>
          </div>

          {flow.dryRun.errors.length > 0 ? (
            <GlassCard accent="var(--danger)" padding={16}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: 14 }}>
                Anomalies à corriger
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  color: "var(--danger)",
                  fontSize: 13,
                  display: "grid",
                  gap: 4,
                }}
              >
                {flow.dryRun.errors.map((err) => (
                  <li key={err}>{err}</li>
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
              Aperçu (premières {flow.dryRun.preview.length} lignes)
            </div>
            <DataTable
              columns={previewColumns}
              rows={flow.dryRun.preview}
              rowKey={(row) => `pfe-import-${row.row}`}
              dense
            />
          </div>
        </div>
      ) : null}

      {/* Commit result */}
      {flow.commitResult ? (
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
                Résultat de l&apos;import
              </div>
              <h3 style={{ margin: "6px 0 0 0", fontSize: 18 }}>
                {flow.commitResult.message}
              </h3>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Tag color="var(--success)" bg="var(--chef-dim)">
                {flow.commitResult.created_count} créés
              </Tag>
              {flow.commitResult.skipped_count > 0 ? (
                <Tag color="var(--warning)" bg="rgba(212,175,55,0.10)">
                  {flow.commitResult.skipped_count} ignorés
                </Tag>
              ) : null}
            </div>
          </div>

          {flow.commitResult.skipped.length > 0 ? (
            <DataTable
              columns={skippedColumns}
              rows={flow.commitResult.skipped}
              rowKey={(r) => `skipped-${r.row}`}
              emptyLabel="Aucune ligne ignorée."
              dense
            />
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
