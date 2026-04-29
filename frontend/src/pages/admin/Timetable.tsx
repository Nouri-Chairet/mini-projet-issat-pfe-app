import { useCallback, useEffect, useState } from "react";
import { useTimetableImport } from "../../hooks/useTimetableImport";
import { TimetableImportPanel } from "../../components/timetable/TimetableImportPanel";
import { TimetableDryRunPreview } from "../../components/timetable/TimetableDryRunPreview";
import { TimetableManualPanel } from "../../components/timetable/TimetableManualPanel";
import { TimetablePublishBar } from "../../components/timetable/TimetablePublishBar";
import { getAdminClasses, getAdminTeachers } from "../../services/admin";
import {
  createTimetableSlot,
  deleteTimetableSlot,
  exportTimetableIcs,
  getTimetablePublicationStatus,
  listTimetableSlots,
  logTimetableTelemetry,
  publishTimetable,
  unpublishTimetable,
  type ManualTimetablePayload,
  type TeacherScheduleItem,
  type TimetablePublicationStatus,
} from "../../services/timetable";

/*
  AdminTimetable — thin orchestration page.

  Heavy logic lives in:
    - useTimetableImport (file/dry-run/commit/template)
    - TimetableImportPanel / DryRunPreview / ManualPanel / PublishBar

  The page just owns small page-level state (publish status, slots,
  manual form, teachers/classes lists) and wires callbacks.
*/

const A = "var(--chef-accent)";

const initialManualForm: ManualTimetablePayload = {
  teacher_id: "",
  class_id: "",
  day_of_week: "Lundi",
  start_time: "08:00",
  end_time: "10:00",
  room: "",
  subject: "",
};

export default function AdminTimetable() {
  const [publishStatus, setPublishStatus] =
    useState<TimetablePublicationStatus | null>(null);
  const [teachers, setTeachers] = useState<
    Array<{ id: string; username: string }>
  >([]);
  const [classes, setClasses] = useState<
    Array<{ id: string; niveau: string; section: string; num: string }>
  >([]);
  const [slots, setSlots] = useState<TeacherScheduleItem[]>([]);
  const [manualForm, setManualForm] =
    useState<ManualTimetablePayload>(initialManualForm);
  const [pageBusy, setPageBusy] = useState(false);
  const [pageMsg, setPageMsg] = useState<{
    text: string;
    kind: "info" | "success" | "error";
  } | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      const [status, teacherItems, classItems, scheduleItems] =
        await Promise.all([
          getTimetablePublicationStatus(false),
          getAdminTeachers(),
          getAdminClasses(),
          listTimetableSlots(),
        ]);
      setPublishStatus(status);
      setTeachers(
        teacherItems.map((item) => ({ id: item.id, username: item.username })),
      );
      setClasses(classItems);
      setSlots(scheduleItems);
    } catch {
      setPageMsg({
        text: "Erreur de chargement du module emploi du temps.",
        kind: "error",
      });
    }
  }, []);

  const importer = useTimetableImport({ onAfterCommit: refreshAll });

  useEffect(() => {
    void refreshAll();
    void logTimetableTelemetry(
      "admin_timetable_opened",
      "/admin/timetable",
    ).catch(() => undefined);
  }, [refreshAll]);

  const submitManualSlot = async () => {
    setPageBusy(true);
    setPageMsg(null);
    try {
      await createTimetableSlot(manualForm);
      setPageMsg({ text: "Séance ajoutée avec succès.", kind: "success" });
      setManualForm((prev) => ({ ...prev, room: "", subject: "" }));
      await refreshAll();
    } catch {
      setPageMsg({
        text: "Erreur lors de la création manuelle.",
        kind: "error",
      });
    } finally {
      setPageBusy(false);
    }
  };

  const togglePublish = async () => {
    if (!publishStatus) return;
    setPageBusy(true);
    setPageMsg(null);
    try {
      if (publishStatus.is_published) {
        await unpublishTimetable();
        setPageMsg({ text: "Planning dépublié.", kind: "info" });
      } else {
        await publishTimetable();
        setPageMsg({ text: "Planning publié.", kind: "success" });
      }
      await refreshAll();
    } catch {
      setPageMsg({
        text: "Erreur lors du changement de statut de publication.",
        kind: "error",
      });
    } finally {
      setPageBusy(false);
    }
  };

  const removeSlot = async (slotId: string) => {
    setPageBusy(true);
    setPageMsg(null);
    try {
      await deleteTimetableSlot(slotId);
      setPageMsg({ text: "Séance supprimée.", kind: "info" });
      await refreshAll();
    } catch {
      setPageMsg({
        text: "Erreur lors de la suppression de la séance.",
        kind: "error",
      });
    } finally {
      setPageBusy(false);
    }
  };

  const downloadIcs = async () => {
    try {
      const blob = await exportTimetableIcs();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "timetable.ics";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setPageMsg({ text: "Erreur lors de l'export ICS.", kind: "error" });
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1200 }}>
      {/* Header */}
      <div className="fu" style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "1.8px",
            marginBottom: 8,
          }}
        >
          Module · Emploi du temps
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            letterSpacing: "-0.035em",
            fontFamily: "var(--font-display)",
          }}
        >
          Import &amp; publication du planning
        </h1>
        <p
          style={{
            color: "var(--text2)",
            margin: "8px 0 0 0",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          Importez l&apos;emploi du temps depuis Excel (validation transactionnelle,
          puis import) ou ajoutez des séances manuellement. Publiez ensuite le
          planning pour le rendre visible aux enseignants et étudiants.
        </p>
      </div>

      {/* Inline page-level message */}
      {pageMsg ? (
        <div
          role="status"
          className="fu1"
          style={{
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border2)",
            background:
              pageMsg.kind === "error"
                ? "var(--danger-dim)"
                : pageMsg.kind === "success"
                  ? "var(--chef-dim)"
                  : "var(--surface)",
            color:
              pageMsg.kind === "error"
                ? "var(--danger)"
                : pageMsg.kind === "success"
                  ? "var(--chef-accent)"
                  : "var(--text2)",
            fontSize: 13,
          }}
        >
          {pageMsg.text}
        </div>
      ) : null}

      <div className="fu1">
        <TimetablePublishBar
          status={publishStatus}
          onTogglePublish={togglePublish}
          onDownloadIcs={downloadIcs}
          onPrint={() => window.print()}
          busy={pageBusy}
        />
      </div>

      <div className="fu2">
        <TimetableImportPanel
          file={importer.file}
          busy={importer.busy}
          feedback={importer.feedback}
          feedbackKind={importer.feedbackKind}
          replaceExisting={importer.replaceExisting}
          report={importer.report}
          onPickFile={importer.pickFile}
          onToggleReplace={importer.setReplaceExisting}
          onDryRun={importer.runDryRun}
          onCommit={importer.runCommit}
          onDownloadTemplate={importer.downloadTemplate}
        />
      </div>

      {importer.report ? (
        <div className="fu3">
          <TimetableDryRunPreview report={importer.report} />
        </div>
      ) : null}

      <div className="fu4">
        <TimetableManualPanel
          teachers={teachers}
          classes={classes}
          slots={slots}
          manualForm={manualForm}
          setManualForm={setManualForm}
          onSubmit={submitManualSlot}
          onDelete={removeSlot}
          busy={pageBusy}
        />
      </div>
    </div>
  );
}
