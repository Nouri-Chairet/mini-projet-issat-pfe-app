import { useAccounts } from "../../hooks/useAccounts";
import CreateTeacherForm from "../../components/accounts/CreateTeacherForm";
import CreateStudentForm from "../../components/accounts/CreateStudentForm";
import AccountListPanels from "../../components/accounts/AccountListPanels";

export default function AdminAccounts() {
  const {
    teachers,
    classes,
    selectedClassId,
    setSelectedClassId,
    students,
    feedback,
    teacherForm,
    setTeacherForm,
    studentForm,
    setStudentForm,
    submitTeacher,
    submitStudent,
  } = useAccounts();

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
        <CreateTeacherForm
          form={teacherForm}
          onChange={setTeacherForm}
          onSubmit={submitTeacher}
        />
        <CreateStudentForm
          form={studentForm}
          classes={classes}
          onChange={setStudentForm}
          onSubmit={submitStudent}
        />
      </div>

      <AccountListPanels
        teachers={teachers}
        students={students}
        classes={classes}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
      />
    </div>
  );
}
