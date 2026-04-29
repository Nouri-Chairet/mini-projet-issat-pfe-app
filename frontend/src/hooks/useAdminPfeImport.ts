import { useCallback, useState } from "react";
import {
  downloadPfeImportTemplate,
  pfeImportCommit,
  pfeImportDryRun,
  type PfeImportCommitResult,
  type PfeImportDryRunResult,
} from "../services/adminPfeImport";

/*
  useAdminPfeImport — encapsulates the bulk PFE excel flow
  (file selection, dry-run, commit, template download).
*/

export function useAdminPfeImport() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState<PfeImportDryRunResult | null>(null);
  const [commitResult, setCommitResult] = useState<PfeImportCommitResult | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackKind, setFeedbackKind] = useState<"info" | "success" | "error">(
    "info",
  );

  const setMessage = (msg: string, kind: "info" | "success" | "error" = "info") => {
    setFeedback(msg);
    setFeedbackKind(kind);
  };

  const pickFile = useCallback((next: File | null) => {
    setFile(next);
    setDryRun(null);
    setCommitResult(null);
    setMessage("");
  }, []);

  const runDryRun = useCallback(async () => {
    if (!file) {
      setMessage("Sélectionnez d'abord un fichier Excel.", "error");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await pfeImportDryRun(file);
      setDryRun(result);
      setCommitResult(null);
      if (result.valid) {
        setMessage(
          `Dry-run réussi : ${result.stats.create} sujet(s) prêt(s) à être créé(s).`,
          "success",
        );
      } else {
        setMessage(
          `Validation terminée avec ${result.errors.length} anomalie(s).`,
          "error",
        );
      }
    } catch {
      setMessage("Erreur pendant la validation du fichier.", "error");
    } finally {
      setBusy(false);
    }
  }, [file]);

  const runCommit = useCallback(async () => {
    if (!file) {
      setMessage("Sélectionnez d'abord un fichier Excel.", "error");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await pfeImportCommit(file);
      setCommitResult(result);
      setMessage(
        `Import terminé : ${result.created_count} créé(s), ${result.skipped_count} ignoré(s).`,
        "success",
      );
    } catch {
      setMessage("Erreur pendant l'import du fichier.", "error");
    } finally {
      setBusy(false);
    }
  }, [file]);

  const downloadTemplate = useCallback(async () => {
    try {
      const blob = await downloadPfeImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "pfe_bulk_template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Erreur lors du téléchargement du template.", "error");
    }
  }, []);

  const canCommit = Boolean(dryRun?.valid);

  return {
    file,
    pickFile,
    dryRun,
    commitResult,
    busy,
    feedback,
    feedbackKind,
    canCommit,
    runDryRun,
    runCommit,
    downloadTemplate,
  };
}
