import { Btn, Card, Tag } from "../../components/UI";
import { usePfeScheduler } from "../../hooks/usePfeScheduler";
import SchedulerCampaignSetup from "../../components/pfe-scheduler/SchedulerCampaignSetup";
import StudentAssignmentPanel from "../../components/pfe-scheduler/StudentAssignmentPanel";

const ACCENT = "var(--chef-accent)";

export default function AdminPfeScheduler() {
  const {
    departments,
    selectedDeptId,
    setSelectedDeptId,
    campaign,
    subjects,
    students,
    assignments,
    studentSubjectId,
    setStudentSubjectId,
    studentId,
    setStudentId,
    form,
    setForm,
    feedback,
    busy,
    refreshAll,
    saveCampaign,
    saveStudentAssignment,
  } = usePfeScheduler();

  return (
    <div style={{ padding: "34px 38px", maxWidth: 1320 }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 8,
          }}
        >
          PFE Scheduling Control Room
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>PFE Campaign Scheduler</h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          Configure schedule bounds and manually commit assignments.
        </p>
      </div>

      {feedback ? (
        <div
          style={{
            marginBottom: 14,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            color: "var(--text2)",
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}
      >
        <Btn accent={ACCENT} onClick={refreshAll}>
          Refresh
        </Btn>
        <Btn accent={ACCENT} variant="ghost" onClick={saveCampaign}>
          Save campaign
        </Btn>
        {busy ? <Tag>Working...</Tag> : null}
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Tag color={ACCENT} bg="var(--chef-dim)">
          Campaign: {campaign ? campaign.name : "None"}
        </Tag>
        <Tag>Subjects: {subjects.length}</Tag>
        <Tag>Assignments: {assignments.length}</Tag>
        <Tag>Departments: {departments.length}</Tag>
      </div>

      <div
        style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}
      >
        <SchedulerCampaignSetup
          departments={departments}
          selectedDeptId={selectedDeptId}
          onDeptChange={setSelectedDeptId}
          form={form}
          onChange={setForm}
        />

        <Card style={{ padding: 14 }}>
          <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 10 }}>
            Rule applied for target=6 teachers: preferred sessions in [10,12]
            and available-not-preferred at least 6.
          </p>
        </Card>
      </div>

      <StudentAssignmentPanel
        accent={ACCENT}
        subjects={subjects}
        students={students}
        assignments={assignments}
        studentSubjectId={studentSubjectId}
        studentId={studentId}
        onSubjectChange={setStudentSubjectId}
        onStudentChange={setStudentId}
        onSave={saveStudentAssignment}
      />
    </div>
  );
}
