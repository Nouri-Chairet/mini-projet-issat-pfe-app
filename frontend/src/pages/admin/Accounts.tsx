import { useEffect, useState } from "react";
import { Btn, Input, Select } from "../../components/UI";
import {
  getAdminClasses,
  getAdminTeachers,
  getStudentsByClass,
  registerStudent,
  registerTeacher,
  type AdminClass,
  type AdminStudent,
  type AdminTeacher,
} from "../../services/admin";

export default function AdminAccounts() {
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [feedback, setFeedback] = useState("");

  const [teacherForm, setTeacherForm] = useState({
    email: "",
    username: "",
    password: "",
    department: "",
    ncin: "",
    age: 30,
  });

  const [studentForm, setStudentForm] = useState({
    email: "",
    username: "",
    password: "",
    class_id: "",
    parent_contact: "",
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [teacherItems, classItems] = await Promise.all([
          getAdminTeachers(),
          getAdminClasses(),
        ]);
        if (mounted) {
          setTeachers(teacherItems);
          setClasses(classItems);
          const firstClass = classItems[0]?.id ?? "";
          setSelectedClassId(firstClass);
          setStudentForm((prev) => ({ ...prev, class_id: firstClass }));
        }
      } catch {
        if (mounted) {
          setFeedback("Erreur lors du chargement des comptes/classes.");
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadStudents() {
      if (!selectedClassId) {
        setStudents([]);
        return;
      }
      try {
        const items = await getStudentsByClass(selectedClassId);
        if (mounted) {
          setStudents(items);
        }
      } catch {
        if (mounted) {
          setFeedback("Erreur lors du chargement des étudiants.");
        }
      }
    }
    loadStudents();
    return () => {
      mounted = false;
    };
  }, [selectedClassId]);

  const submitTeacher = async () => {
    setFeedback("");
    try {
      await registerTeacher({
        ...teacherForm,
        age: Number(teacherForm.age),
      });
      setFeedback("Enseignant créé avec succès.");
      setTeachers(await getAdminTeachers());
      setTeacherForm({
        email: "",
        username: "",
        password: "",
        department: "",
        ncin: "",
        age: 30,
      });
    } catch {
      setFeedback("Erreur lors de la création enseignant.");
    }
  };

  const submitStudent = async () => {
    setFeedback("");
    try {
      await registerStudent(studentForm);
      setFeedback("Étudiant créé avec succès.");
      if (selectedClassId) {
        setStudents(await getStudentsByClass(selectedClassId));
      }
      setStudentForm((prev) => ({
        ...prev,
        email: "",
        username: "",
        password: "",
        parent_contact: "",
      }));
    } catch {
      setFeedback("Erreur lors de la création étudiant.");
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1200 }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>
        Comptes enseignants/étudiants
      </h1>
      <p style={{ color: "var(--text2)", marginTop: 0, marginBottom: 24 }}>
        Création de comptes (Milestone 3: M3-02, M3-03).
      </p>

      {feedback ? (
        <div
          style={{
            marginBottom: 16,
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            color: "var(--text)",
            background: "var(--surface)",
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Créer enseignant</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <Input
              label="Username"
              value={teacherForm.username}
              onChange={(e) =>
                setTeacherForm((p) => ({ ...p, username: e.target.value }))
              }
            />
            <Input
              label="Email"
              value={teacherForm.email}
              onChange={(e) =>
                setTeacherForm((p) => ({ ...p, email: e.target.value }))
              }
            />
            <Input
              label="Password"
              type="password"
              value={teacherForm.password}
              onChange={(e) =>
                setTeacherForm((p) => ({ ...p, password: e.target.value }))
              }
            />
            <Input
              label="Département"
              value={teacherForm.department}
              onChange={(e) =>
                setTeacherForm((p) => ({ ...p, department: e.target.value }))
              }
            />
            <Input
              label="NCIN"
              value={teacherForm.ncin}
              onChange={(e) =>
                setTeacherForm((p) => ({ ...p, ncin: e.target.value }))
              }
            />
            <Input
              label="Age"
              type="number"
              value={teacherForm.age}
              onChange={(e) =>
                setTeacherForm((p) => ({ ...p, age: Number(e.target.value) }))
              }
            />
            <Btn onClick={submitTeacher}>Créer enseignant</Btn>
          </div>
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Créer étudiant</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <Input
              label="Username"
              value={studentForm.username}
              onChange={(e) =>
                setStudentForm((p) => ({ ...p, username: e.target.value }))
              }
            />
            <Input
              label="Email"
              value={studentForm.email}
              onChange={(e) =>
                setStudentForm((p) => ({ ...p, email: e.target.value }))
              }
            />
            <Input
              label="Password"
              type="password"
              value={studentForm.password}
              onChange={(e) =>
                setStudentForm((p) => ({ ...p, password: e.target.value }))
              }
            />
            <Select
              label="Classe"
              value={studentForm.class_id}
              onChange={(e) =>
                setStudentForm((p) => ({ ...p, class_id: e.target.value }))
              }
            >
              <option value="">-- sélectionner --</option>
              {classes.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >{`${c.niveau}-${c.section}-${c.num}`}</option>
              ))}
            </Select>
            <Input
              label="Contact parent"
              value={studentForm.parent_contact}
              onChange={(e) =>
                setStudentForm((p) => ({
                  ...p,
                  parent_contact: e.target.value,
                }))
              }
            />
            <Btn onClick={submitStudent}>Créer étudiant</Btn>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Enseignants ({teachers.length})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                style={{
                  padding: "8px 10px",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--r-md)",
                }}
              >
                <strong>{teacher.username}</strong>
                <div style={{ color: "var(--text2)", fontSize: 13 }}>
                  {teacher.email}
                </div>
                <div style={{ color: "var(--text3)", fontSize: 12 }}>
                  {teacher.department}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Étudiants (par classe)</h3>
          <Select
            label="Filtrer classe"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">-- sélectionner --</option>
            {classes.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >{`${c.niveau}-${c.section}-${c.num}`}</option>
            ))}
          </Select>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {students.map((student) => (
              <div
                key={`${student.email}-${student.username}`}
                style={{
                  padding: "8px 10px",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--r-md)",
                }}
              >
                <strong>{student.username}</strong>
                <div style={{ color: "var(--text2)", fontSize: 13 }}>
                  {student.email}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
