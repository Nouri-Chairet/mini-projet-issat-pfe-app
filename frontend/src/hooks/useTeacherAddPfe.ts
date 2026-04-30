import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPfeSubject,
  listEligibleStudents,
  listMySupervisedSubjects,
  type EligibleStudent,
  type SupervisedSubject,
} from "../services/teacherPfeMgmt";

/*
  useTeacherAddPfe — drives the "ajouter un PFE" page for teachers.

  Owns: fetching the eligible-students roster, the search query, the
  selected student, the form fields, submission, and a refreshable
  list of subjects already supervised by the teacher.
*/

interface SubmitResult {
  ok: boolean;
  message: string;
}

export function useTeacherAddPfe() {
  const [eligible, setEligible] = useState<EligibleStudent[]>([]);
  const [supervised, setSupervised] = useState<SupervisedSubject[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [eligibleList, mySubjects] = await Promise.all([
        listEligibleStudents(),
        listMySupervisedSubjects(),
      ]);
      setEligible(eligibleList);
      setSupervised(mySubjects);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredEligible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return eligible;
    }
    return eligible.filter((student) => {
      return (
        student.username.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q) ||
        (student.class_label ?? "").toLowerCase().includes(q) ||
        (student.ncin ?? "").toLowerCase().includes(q)
      );
    });
  }, [eligible, search]);

  const selectedStudent = useMemo(
    () => eligible.find((s) => s.id === selectedStudentId) ?? null,
    [eligible, selectedStudentId],
  );

  const canSubmit =
    Boolean(selectedStudentId) &&
    title.trim().length >= 3 &&
    !busy;

  const submit = useCallback(async () => {
    if (!canSubmit) {
      setFeedback({
        ok: false,
        message: "Sélectionnez un étudiant et saisissez un titre (3+ caractères).",
      });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await createPfeSubject({
        student_id: selectedStudentId,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setFeedback({ ok: true, message: "PFE enregistré avec succès." });
      setTitle("");
      setDescription("");
      setSelectedStudentId("");
      await refresh();
    } catch (error) {
      const e = error as { response?: { data?: { error?: string } }; message?: string };
      const reason =
        e?.response?.data?.error ?? e?.message ?? "Une erreur est survenue.";
      setFeedback({ ok: false, message: reason });
    } finally {
      setBusy(false);
    }
  }, [canSubmit, selectedStudentId, title, description, refresh]);

  return {
    loading,
    eligible,
    filteredEligible,
    supervised,
    search,
    setSearch,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
    title,
    setTitle,
    description,
    setDescription,
    busy,
    feedback,
    canSubmit,
    submit,
    refresh,
  };
}
