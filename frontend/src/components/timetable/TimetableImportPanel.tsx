import { Btn, Tag } from "../UI";
import { GlassCard } from "../glass/GlassCard";
import { FileDropzone } from "../forms/FileDropzone";
import type { TimetableDryRunResult } from "../../services/timetable";

/*
  TimetableImportPanel — file picker + actions for the Excel importer.

  Stateless: receives everything from `useTimetableImport`.
*/

interface TimetableImportPanelProps {
  file: File | null;
  busy: boolean;
  feedback: string;
  feedbackKind: "info" | "success" | "error";
  replaceExisting: boolean;
  report: TimetableDryRunResult | null;
  onPickFile: (file: File | null) => void;
  onToggleReplace: (next: boolean) => void;
  onDryRun: () => void;
  onCommit: () => void;
  onDownloadTemplate: () => void;
}

const A = "var(--chef-accent)";

export const TimetableImportPanel = ({
  file,
  busy,
  feedback,
  feedbackKind,
  replaceExisting,
  report,
  onPickFile,
  onToggleReplace,
  onDryRun,
  onCommit,
  onDownloadTemplate,
}: TimetableImportPanelProps) => {
  const canCommit = Boolean(report?.valid);

  return (
    <GlassCard
      accent={A}
      padding={20}
      style={{ marginBottom: 16, display: "grid", gap: 14 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
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
            Charger un fichier d&apos;emploi du temps
          </h3>
          <p style={{ color: "var(--text2)", margin: "6px 0 0 0", fontSize: 13 }}>
            Validation transactionnelle (dry-run), puis import. Téléchargez le template
            officiel ci-dessous si vous démarrez.
          </p>
        </div>
        <Btn accent={A} variant="ghost" onClick={onDownloadTemplate}>
          ⬇ Télécharger le template
        </Btn>
      </div>

      <FileDropzone
        accent={A}
        file={file}
        onFile={onPickFile}
        description="Glissez votre fichier .xlsx ici ou cliquez pour parcourir."
      />

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          color: "var(--text2)",
          fontSize: 13,
        }}
      >
        <input
          type="checkbox"
          checked={replaceExisting}
          onChange={(event) => onToggleReplace(event.target.checked)}
          style={{ accentColor: "var(--chef-accent)" }}
        />
        Remplacer toutes les séances existantes avant import
      </label>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Btn accent={A} onClick={onDryRun} disabled={busy || !file}>
          {busy ? "Validation…" : "Lancer la validation"}
        </Btn>
        <Btn accent={A} variant="ghost" onClick={onCommit} disabled={busy || !canCommit}>
          Importer définitivement
        </Btn>
        {report ? (
          <Tag
            color={report.valid ? "var(--chef-accent)" : "var(--danger)"}
            bg={report.valid ? "var(--chef-dim)" : "var(--danger-dim)"}
          >
            {report.valid ? "VALIDE" : "ANOMALIES"}
          </Tag>
        ) : null}
        {report ? <Tag>{report.parsed_count} ligne(s) analysée(s)</Tag> : null}
      </div>

      {feedback ? (
        <div
          role="status"
          style={{
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border2)",
            background:
              feedbackKind === "error"
                ? "var(--danger-dim)"
                : feedbackKind === "success"
                  ? "var(--chef-dim)"
                  : "var(--surface)",
            color:
              feedbackKind === "error"
                ? "var(--danger)"
                : feedbackKind === "success"
                  ? "var(--chef-accent)"
                  : "var(--text2)",
            fontSize: 13,
          }}
        >
          {feedback}
        </div>
      ) : null}
    </GlassCard>
  );
};

export default TimetableImportPanel;
