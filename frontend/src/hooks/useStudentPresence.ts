import { useCallback, useEffect, useState } from "react";
import {
  getStudentPresenceSummary,
  type StudentPresenceSummary,
} from "../services/presence";

/*
  useStudentPresence — fetches and exposes the student's per-subject
  absence summary. Already sorted server-side (warnings first).
*/

export function useStudentPresence() {
  const [summary, setSummary] = useState<StudentPresenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentPresenceSummary();
      setSummary(data);
    } catch {
      setError("Impossible de charger le résumé des absences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
