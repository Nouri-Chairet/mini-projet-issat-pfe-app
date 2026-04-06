import { useEffect, useState } from "react";
import { Btn, Input, Select } from "../../components/UI";
import { getAdminClasses, getAdminTeachers } from "../../services/admin";
import {
  createTimetableSlot,
  deleteTimetableSlot,
  exportTimetableIcs,
  getTimetablePublicationStatus,
  getTimetableReadiness,
  listTimetableSlots,
  logTimetableTelemetry,
  publishTimetable,
  timetableCommit,
  timetableDryRun,
  unpublishTimetable,
  type TeacherScheduleItem,
  type TimetablePublicationStatus,
  type TimetableReadinessResponse,
  type TimetableDryRunResult,
} from "../../services/timetable";

export default function AdminTimetable() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [report, setReport] = useState<TimetableDryRunResult | null>(null);
  const [publishStatus, setPublishStatus] =
    useState<TimetablePublicationStatus | null>(null);
  const [teachers, setTeachers] = useState<Array<{ id: string; username: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; niveau: string; section: string; num: string }>>([]);
  const [slots, setSlots] = useState<TeacherScheduleItem[]>([]);
  const [readiness, setReadiness] = useState<TimetableReadinessResponse | null>(null);
  const [manualForm, setManualForm] = useState({
    teacher_id: "",
    class_id: "",
    day_of_week: "Lundi",
    start_time: "08:00",
    end_time: "10:00",
    room: "",
    subject: "",
  });

  const loadAll = async () => {
    const [status, teacherItems, classItems, scheduleItems, readinessItems] =
      await Promise.all([
        getTimetablePublicationStatus(false),
        getAdminTeachers(),
        getAdminClasses(),
        listTimetableSlots(),
        getTimetableReadiness(),
      ]);
    setPublishStatus(status);
    setTeachers(teacherItems.map((item) => ({ id: item.id, username: item.username })));
    setClasses(classItems);
    setSlots(scheduleItems);
    setReadiness(readinessItems);
  };

  useEffect(() => {
    loadAll().catch(() => {
      setFeedback("Erreur de chargement du module emploi du temps.");
    });
    logTimetableTelemetry("admin_timetable_opened", "/admin/timetable").catch(() => undefined);
  }, []);

  const runDryRun = async () => {
    if (!selectedFile) {
      setFeedback("Veuillez sélectionner un fichier Excel.");
      return;
    }

    setLoading(true);
    setFeedback("");
    try {
      const result = await timetableDryRun(selectedFile);
      setReport(result);
      setFeedback(
        result.valid
          ? "Validation réussie. Vous pouvez importer."
          : "Validation terminée avec anomalies.",
      );
    } catch {
      setFeedback("Erreur pendant la validation du fichier.");
    } finally {
      setLoading(false);
    }
  };

  const commitImport = async () => {
    if (!selectedFile) {
      setFeedback("Veuillez sélectionner un fichier Excel.");
      return;
    }

    setLoading(true);
    setFeedback("");
    try {
      const result = await timetableCommit(selectedFile, replaceExisting);
      setFeedback(`${result.message} (${result.created_count} séances)`);
      setReport(null);
      await loadAll();
    } catch {
      setFeedback("Erreur pendant l'import du planning.");
    } finally {
      setLoading(false);
    }
  };

  const submitManualSlot = async () => {
    setLoading(true);
    setFeedback("");
    try {
      await createTimetableSlot(manualForm);
      setFeedback("Séance ajoutée avec succès.");
      setManualForm((prev) => ({ ...prev, room: "", subject: "" }));
      await loadAll();
    } catch {
      setFeedback("Erreur lors de la création manuelle.");
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async () => {
    if (!publishStatus) {
      return;
    }
    setLoading(true);
    setFeedback("");
    try {
      if (publishStatus.is_published) {
        await unpublishTimetable();
        setFeedback("Planning dépublié.");
      } else {
        await publishTimetable();
        setFeedback("Planning publié.");
      }
      await loadAll();
    } catch {
      setFeedback("Erreur lors du changement de statut de publication.");
    } finally {
      setLoading(false);
    }
  };

  const removeSlot = async (slotId: string) => {
    setLoading(true);
    setFeedback("");
    try {
      await deleteTimetableSlot(slotId);
      setFeedback("Séance supprimée.");
      await loadAll();
    } catch {
      setFeedback("Erreur lors de la suppression de la séance.");
    } finally {
      setLoading(false);
    }
  };

  const downloadIcs = async () => {
    try {
      const blob = await exportTimetableIcs();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "timetable.ics";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setFeedback("Erreur lors de l'export ICS.");
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100 }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>Import emploi du temps</h1>
      <p style={{ color: "var(--text2)", marginTop: 0, marginBottom: 20 }}>
        Milestone 4 — validation et import transactionnel depuis Excel.
      </p>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 16,
          marginBottom: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <strong>
          Statut: {publishStatus?.is_published ? "Publié" : "Brouillon (non publié)"}
        </strong>
        <Btn onClick={togglePublish}>
          {publishStatus?.is_published ? "Dépublier" : "Publier"}
        </Btn>
        <Btn onClick={downloadIcs} variant="ghost">
          Export ICS
        </Btn>
        <Btn onClick={() => window.print()} variant="ghost">
          Imprimer
        </Btn>
      </div>

      {feedback ? (
        <div
          style={{
            marginBottom: 14,
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            background: "var(--surface)",
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <Input
          label="Fichier Excel (.xlsx)"
          type="file"
          accept=".xlsx"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
            setReport(null);
          }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(event) => setReplaceExisting(event.target.checked)}
          />
          Remplacer les séances existantes avant import
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={runDryRun}>{loading ? "Validation..." : "Dry run"}</Btn>
          <Btn onClick={commitImport} variant="ghost">
            {loading ? "Import..." : "Importer"}
          </Btn>
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          alignItems: "end",
        }}
      >
        <Select
          label="Enseignant"
          value={manualForm.teacher_id}
          onChange={(event) =>
            setManualForm((prev) => ({ ...prev, teacher_id: event.target.value }))
          }
        >
          <option value="">-- sélectionner --</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.username}
            </option>
          ))}
        </Select>
        <Select
          label="Classe"
          value={manualForm.class_id}
          onChange={(event) =>
            setManualForm((prev) => ({ ...prev, class_id: event.target.value }))
          }
        >
          <option value="">-- sélectionner --</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {`${item.niveau}-${item.section}-${item.num}`}
            </option>
          ))}
        </Select>
        <Select
          label="Jour"
          value={manualForm.day_of_week}
          onChange={(event) =>
            setManualForm((prev) => ({ ...prev, day_of_week: event.target.value }))
          }
        >
          {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </Select>
        <Input
          label="Matière"
          value={manualForm.subject}
          onChange={(event) =>
            setManualForm((prev) => ({ ...prev, subject: event.target.value }))
          }
        />
        <Input
          label="Heure début"
          type="time"
          value={manualForm.start_time}
          onChange={(event) =>
            setManualForm((prev) => ({ ...prev, start_time: event.target.value }))
          }
        />
        <Input
          label="Heure fin"
          type="time"
          value={manualForm.end_time}
          onChange={(event) =>
            setManualForm((prev) => ({ ...prev, end_time: event.target.value }))
          }
        />
        <Input
          label="Salle"
          value={manualForm.room}
          onChange={(event) =>
            setManualForm((prev) => ({ ...prev, room: event.target.value }))
          }
        />
        <div>
          <Btn onClick={submitManualSlot}>Ajouter séance</Btn>
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Séances ({slots.length})</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {slots.map((slot) => (
            <div
              key={slot.id}
              style={{
                border: "1px solid var(--border2)",
                borderRadius: "var(--r-md)",
                padding: "8px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div>
                <strong>
                  {slot.day_of_week} {slot.start_time}-{slot.end_time}
                </strong>
                <div style={{ color: "var(--text2)", fontSize: 13 }}>
                  {slot.subject} • {slot.class} • {slot.teacher}
                </div>
              </div>
              <Btn onClick={() => removeSlot(slot.id)} variant="ghost">
                Supprimer
              </Btn>
            </div>
          ))}
        </div>
      </div>

      {readiness ? (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Readiness présence ({readiness.date})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {readiness.rows.map((row) => (
              <div
                key={row.schedule_id}
                style={{
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--r-md)",
                  padding: "8px 10px",
                }}
              >
                <strong>
                  {row.class} • {row.day_of_week} {row.start_time}-{row.end_time}
                </strong>
                <div style={{ color: "var(--text2)", fontSize: 13 }}>
                  {row.teacher} • présence {row.attendance_marked}/{row.students_expected} • {row.ready ? "Ready" : "Pending"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {report ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Résumé</div>
            <div style={{ color: "var(--text2)" }}>
              {report.parsed_count} ligne(s) analysée(s)
            </div>
            <div style={{ color: "var(--text2)" }}>
              {report.errors.length} erreur(s), {report.conflicts.length}{" "}
              conflit(s)
            </div>
          </div>

          {report.errors.length > 0 ? (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Erreurs</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {report.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.conflicts.length > 0 ? (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Conflits</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {report.conflicts.map((conflict) => (
                  <li key={conflict}>{conflict}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Aperçu</div>
            <div style={{ display: "grid", gap: 8 }}>
              {report.preview.map((row, index) => (
                <div
                  key={`${row.teacher}-${row.class}-${index}`}
                  style={{
                    border: "1px solid var(--border2)",
                    borderRadius: "var(--r-md)",
                    padding: "8px 10px",
                  }}
                >
                  <strong>
                    {row.day_of_week} {row.start_time}-{row.end_time}
                  </strong>
                  <div style={{ color: "var(--text2)", fontSize: 13 }}>
                    {row.teacher} • {row.class} • {row.room}
                  </div>
                  <div style={{ color: "var(--text3)", fontSize: 12 }}>
                    {row.subject}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
