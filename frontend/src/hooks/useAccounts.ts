import { useEffect, useState } from "react";
import {
  getAdminClasses,
  getAdminTeachers,
  getStudentsByClass,
  registerStudent,
  registerTeacher,
  type AdminClass,
  type AdminStudent,
  type AdminTeacher,
} from "../services/admin";

export interface TeacherFormState {
  email: string;
  username: string;
  password: string;
  department: string;
  ncin: string;
  age: number;
}

export interface StudentFormState {
  email: string;
  username: string;
  password: string;
  class_id: string;
  parent_contact: string;
}

const INITIAL_TEACHER: TeacherFormState = {
  email: "", username: "", password: "", department: "", ncin: "", age: 30,
};

export function useAccounts() {
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [feedback, setFeedback] = useState("");

  const [teacherForm, setTeacherForm] = useState<TeacherFormState>({ ...INITIAL_TEACHER });
  const [studentForm, setStudentForm] = useState<StudentFormState>({
    email: "", username: "", password: "", class_id: "", parent_contact: "",
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [teacherItems, classItems] = await Promise.all([
          getAdminTeachers(), getAdminClasses(),
        ]);
        if (mounted) {
          setTeachers(teacherItems);
          setClasses(classItems);
          const firstClass = classItems[0]?.id ?? "";
          setSelectedClassId(firstClass);
          setStudentForm((prev) => ({ ...prev, class_id: firstClass }));
        }
      } catch {
        if (mounted) setFeedback("Erreur lors du chargement des comptes/classes.");
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadStudents() {
      if (!selectedClassId) { setStudents([]); return; }
      try {
        const items = await getStudentsByClass(selectedClassId);
        if (mounted) setStudents(items);
      } catch {
        if (mounted) setFeedback("Erreur lors du chargement des étudiants.");
      }
    }
    loadStudents();
    return () => { mounted = false; };
  }, [selectedClassId]);

  const submitTeacher = async () => {
    setFeedback("");
    try {
      await registerTeacher({ ...teacherForm, age: Number(teacherForm.age) });
      setFeedback("Enseignant créé avec succès.");
      setTeachers(await getAdminTeachers());
      setTeacherForm({ ...INITIAL_TEACHER });
    } catch {
      setFeedback("Erreur lors de la création enseignant.");
    }
  };

  const submitStudent = async () => {
    setFeedback("");
    try {
      await registerStudent(studentForm);
      setFeedback("Étudiant créé avec succès.");
      if (selectedClassId) setStudents(await getStudentsByClass(selectedClassId));
      setStudentForm((prev) => ({
        ...prev, email: "", username: "", password: "", parent_contact: "",
      }));
    } catch {
      setFeedback("Erreur lors de la création étudiant.");
    }
  };

  return {
    teachers, classes, selectedClassId, setSelectedClassId,
    students, feedback, setFeedback,
    teacherForm, setTeacherForm, studentForm, setStudentForm,
    submitTeacher, submitStudent,
  };
}
