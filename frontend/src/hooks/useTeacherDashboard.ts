import { useEffect, useMemo, useState } from "react";
import { sujets, enseignants } from "../data/mockData";
import {
  getTeacherCurrentSession,
  logTimetableTelemetry,
  type TeacherCurrentSession,
} from "../services/timetable";
import type { AppUser } from "../types/app";

/**
 * Aggregates the teacher's "personal panel" state: current timetable session,
 * supervised subjects (mock), jury participations (mock), and a one-time
 * telemetry ping. The page renders; this hook computes.
 */
export function useTeacherDashboard(user: AppUser) {
  const [currentSession, setCurrentSession] =
    useState<TeacherCurrentSession | null>(null);

  const prof = useMemo(
    () =>
      enseignants.find((enseignant) => enseignant.name === user.name) ??
      enseignants[0],
    [user.name],
  );
  const mesSujets = useMemo(
    () => sujets.filter((sujet) => sujet.encadreur.name === user.name),
    [user.name],
  );
  const mesJurys = useMemo(
    () =>
      sujets.filter((sujet) =>
        sujet.jury.some((juryMember) => juryMember.name === user.name),
      ),
    [user.name],
  );
  const total = mesSujets.length + mesJurys.length;

  useEffect(() => {
    let cancelled = false;
    void getTeacherCurrentSession().then((session) => {
      if (!cancelled) setCurrentSession(session);
    });
    void logTimetableTelemetry(
      "teacher_dashboard_opened",
      "/teacher/dashboard",
    ).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return { prof, mesSujets, mesJurys, total, currentSession };
}
