import { useCallback, useState } from "react";
import {
  downloadTimetableTemplate,
  timetableCommit,
  timetableDryRun,
  type TimetableDryRunResult,
} from "../services/timetable";

/*
  useTimetableImport — owns the file/dry-run/commit/template state
  for the admin timetable import panel.

  The page component just renders props from this hook plus calls its
  callbacks. Logic stays out of JSX.
*/

interface UseTimetableImportArgs {
  onAfterCommit?: () => Promise<void> | void;
}

export function useTimetableImport({ onAfterCommit }: UseTimetableImportArgs = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [report, setReport] = useState<TimetableDryRunResult | null>(null);
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
    setReport(null);
    setMessage("");
  }, []);

  const runDryRun = useCallback(async () => {
    if (!file) {
      setMessage("Veuillez sélectionner un fichier Excel.", "error");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await timetableDryRun(file);
      setReport(result);
      if (result.valid) {
        setMessage("Validation réussie. Vous pouvez importer.", "success");
      } else {
        setMessage("Validation terminée avec anomalies.", "error");
      }
    } catch {
      setMessage("Erreur pendant la validation du fichier.", "error");
    } finally {
      setBusy(false);
    }
  }, [file]);

  const runCommit = useCallback(async () => {
    if (!file) {
      setMessage("Veuillez sélectionner un fichier Excel.", "error");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await timetableCommit(file, replaceExisting);
      setMessage(`${result.message} (${result.created_count} séances)`, "success");
      setReport(null);
      setFile(null);
      if (onAfterCommit) {
        await onAfterCommit();
      }
    } catch {
      setMessage("Erreur pendant l'import du planning.", "error");
    } finally {
      setBusy(false);
    }
  }, [file, replaceExisting, onAfterCommit]);

  const downloadTemplate = useCallback(async () => {
    try {
      const blob = await downloadTimetableTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "timetable_template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Erreur lors du téléchargement du template.", "error");
    }
  }, []);

  return {
    file,
    pickFile,
    replaceExisting,
    setReplaceExisting,
    report,
    busy,
    feedback,
    feedbackKind,
    runDryRun,
    runCommit,
    downloadTemplate,
  };
}
