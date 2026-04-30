import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPresenceRoster,
  getTodayClasses,
  getClassPresenceHistory,
  savePresence,
  type PresenceHistoryResponse,
  type PresenceRosterResponse,
  type TeacherTodayClass,
} from "../services/presence";

/*
  useTeacherPresence — owns the teacher's presence-marking flow.

  - Loads today's classes for the teacher.
  - When a class is selected, loads the roster + the saved status.
  - Lets the teacher flip per-student status and save in a single POST.
  - Loads the per-class+subject history (warning rows) on demand.
*/

export function useTeacherPresence() {
  const [todayClasses, setTodayClasses] = useState<TeacherTodayClass[]>([]);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [roster, setRoster] = useState<PresenceRosterResponse | null>(null);
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<PresenceHistoryResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackKind, setFeedbackKind] = useState<"info" | "success" | "error">(
    "info",
  );
  const [loading, setLoading] = useState(true);

  const setMessage = (msg: string, kind: "info" | "success" | "error" = "info") => {
    setFeedback(msg);
    setFeedbackKind(kind);
  };

  const loadToday = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTodayClasses();
      setIsPublished(data.is_published);
      setTodayClasses(data.schedules);
      if (data.schedules.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(data.schedules[0].id);
      }
    } catch {
      setMessage("Impossible de charger les cours du jour.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedScheduleId]);

  useEffect(() => {
    void loadToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRoster = useCallback(async (scheduleId: string) => {
    if (!scheduleId) {
      setRoster(null);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const data = await getPresenceRoster(scheduleId);
      setRoster(data);
      const initial: Record<string, boolean> = {};
      for (const student of data.students) {
        initial[student.id] = student.presence === null ? true : student.presence;
      }
      setPresence(initial);
    } catch {
      setMessage("Impossible de charger la liste des étudiants.", "error");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadRoster(selectedScheduleId);
  }, [selectedScheduleId, loadRoster]);

  const togglePresence = useCallback((studentId: string) => {
    setPresence((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  }, []);

  const setAllPresent = useCallback(() => {
    if (!roster) return;
    const next: Record<string, boolean> = {};
    for (const student of roster.students) {
      next[student.id] = true;
    }
    setPresence(next);
  }, [roster]);

  const save = useCallback(async () => {
    if (!roster) return;
    setBusy(true);
    setMessage("");
    try {
      await savePresence({
        schedule_id: roster.schedule.id,
        students: roster.students.map((s) => ({
          student_id: s.id,
          presence: Boolean(presence[s.id]),
        })),
      });
      setMessage("Présences enregistrées.", "success");
      // Refresh history if it was loaded.
      if (history && roster) {
        const refreshed = await getClassPresenceHistory(
          roster.schedule.class_id,
          roster.schedule.subject,
        );
        setHistory(refreshed);
      }
    } catch {
      setMessage("Erreur lors de l'enregistrement.", "error");
    } finally {
      setBusy(false);
    }
  }, [roster, presence, history]);

  const loadHistory = useCallback(async () => {
    if (!roster) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await getClassPresenceHistory(
        roster.schedule.class_id,
        roster.schedule.subject,
      );
      setHistory(data);
    } catch {
      setMessage("Impossible de charger l'historique.", "error");
    } finally {
      setBusy(false);
    }
  }, [roster]);

  const stats = useMemo(() => {
    if (!roster) return { total: 0, present: 0, absent: 0 };
    const total = roster.students.length;
    let present = 0;
    for (const s of roster.students) {
      if (presence[s.id]) present += 1;
    }
    return { total, present, absent: total - present };
  }, [roster, presence]);

  return {
    loading,
    isPublished,
    todayClasses,
    selectedScheduleId,
    setSelectedScheduleId,
    roster,
    presence,
    togglePresence,
    setAllPresent,
    save,
    history,
    loadHistory,
    busy,
    feedback,
    feedbackKind,
    stats,
    refresh: loadToday,
  };
}
