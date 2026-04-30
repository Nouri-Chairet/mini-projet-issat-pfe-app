import PfeAssignmentsList from "../../components/pfe-jury/PfeAssignmentsList";
import PfeJuryToolbar from "../../components/pfe-jury/PfeJuryToolbar";
import PfeManualJuryForm from "../../components/pfe-jury/PfeManualJuryForm";
import { usePfeJury } from "../../hooks/usePfeJury";

const A = "var(--ens-accent)";

/**
 * EnseignantPfeManagement — chef-département PFE jury orchestration page.
 * Thin composition of usePfeJury hook + 3 presentation components.
 */
export default function EnseignantPfeManagement() {
  const jury = usePfeJury();

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1240 }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 8,
          }}
        >
          Department Head PFE Management
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>
          Manage department PFE scheduling
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          Teacher list, PFE list, scheduler dry-run/commit, manual jury edits
          and export.
        </p>
      </div>

      <PfeJuryToolbar
        accent={A}
        busy={jury.busy}
        feedback={jury.feedback}
        campaign={jury.campaign}
        teacherCount={jury.teachers.length}
        subjectCount={jury.subjects.length}
        assignmentCount={jury.assignments.length}
        plan={jury.plan}
        onRefresh={jury.refreshAll}
        onActivate={jury.activateSession}
        onDryRun={jury.runDryRun}
        onCommit={jury.commitAutoPlan}
        onExport={jury.downloadExport}
      />

      <PfeManualJuryForm
        accent={A}
        draft={jury.draft}
        subjects={jury.subjects}
        teacherOptions={jury.teacherOptions}
        teachers={jury.teachers}
        onChange={jury.updateDraft}
        onSubmit={jury.assignManual}
      />

      <PfeAssignmentsList
        assignments={jury.assignments}
        onRemove={jury.removeAssignment}
      />
    </div>
  );
}
