import { useEffect, useMemo, useState } from "react";
import {
  activatePfeCampaign,
  assignPfeJury,
  exportPfeAssignments,
  getPfeCampaign,
  listDepartmentPfeSubjects,
  listDepartmentTeachers,
  listPfeAssignments,
  pfeAutoAssignCommit,
  pfeAutoAssignDryRun,
  unassignPfeJury,
  type AdminTeacher,
  type AutoAssignPlan,
  type PfeAssignmentListItem,
  type PfeCampaign,
  type PfeSubjectItem,
} from "../services/admin";

function parseError(error: unknown): string {
  const e = error as {
    response?: { data?: { error?: string; detail?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error ??
    e?.response?.data?.detail ??
    e?.message ??
    "Unexpected error"
  );
}

export interface ManualJuryDraft {
  selectedSubjectId: string;
  rapporteurId: string;
  presidentId: string;
  slotDate: string;
  slotStart: string;
  slotEnd: string;
  slotRoom: string;
}

const initialDraft: ManualJuryDraft = {
  selectedSubjectId: "",
  rapporteurId: "",
  presidentId: "",
  slotDate: "",
  slotStart: "09:00",
  slotEnd: "10:00",
  slotRoom: "Salle PFE",
};

/**
 * Owns campaign + jury + auto-assign state for the teacher (chef département)
 * PFE jury management page. Returns plain data + actions; the page renders.
 */
export function usePfeJury() {
  const [campaign, setCampaign] = useState<PfeCampaign | null>(null);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [subjects, setSubjects] = useState<PfeSubjectItem[]>([]);
  const [assignments, setAssignments] = useState<PfeAssignmentListItem[]>([]);
  const [plan, setPlan] = useState<AutoAssignPlan | null>(null);

  const [draft, setDraft] = useState<ManualJuryDraft>(initialDraft);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => ({
        value: teacher.id,
        label: teacher.username,
      })),
    [teachers],
  );

  async function refreshAll() {
    setBusy(true);
    setFeedback("");
    try {
      const [currentCampaign, departmentTeachers, departmentSubjects] =
        await Promise.all([
          getPfeCampaign().catch(() => null),
          listDepartmentTeachers(),
          listDepartmentPfeSubjects(),
        ]);
      setCampaign(currentCampaign);
      setTeachers(departmentTeachers);
      setSubjects(departmentSubjects);
      if (currentCampaign) {
        setAssignments(await listPfeAssignments(currentCampaign.id));
      } else {
        setAssignments([]);
      }
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  const runDryRun = async () => {
    if (!campaign) {
      setFeedback("No active campaign found.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const response = await pfeAutoAssignDryRun({ campaign_id: campaign.id });
      setPlan(response);
      setFeedback("Dry-run completed.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const commitAutoPlan = async () => {
    if (!campaign) {
      setFeedback("No active campaign found.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const response = await pfeAutoAssignCommit({
        campaign_id: campaign.id,
        replace_existing: true,
        block_on_unresolved: false,
      });
      setPlan(response);
      setAssignments(await listPfeAssignments(campaign.id));
      setFeedback("Auto scheduling committed.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const activateSession = async () => {
    if (!campaign) {
      setFeedback("No campaign found to activate.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const activated = await activatePfeCampaign(campaign.id);
      setCampaign(activated);
      setFeedback("Scheduling session activated.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const assignManual = async () => {
    if (!draft.selectedSubjectId) {
      setFeedback("Select a subject first.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      await assignPfeJury({
        pfe_subject_id: draft.selectedSubjectId,
        rapporteur_id: draft.rapporteurId || undefined,
        president_id: draft.presidentId || undefined,
        date: draft.slotDate || undefined,
        start_time: draft.slotDate ? `${draft.slotStart}:00` : undefined,
        end_time: draft.slotDate ? `${draft.slotEnd}:00` : undefined,
        room: draft.slotDate ? draft.slotRoom : undefined,
      });
      if (campaign) {
        setAssignments(await listPfeAssignments(campaign.id));
      }
      setFeedback("Manual jury assignment saved.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    setBusy(true);
    setFeedback("");
    try {
      await unassignPfeJury(assignmentId);
      if (campaign) {
        setAssignments(await listPfeAssignments(campaign.id));
      }
      setFeedback("Assignment removed.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const downloadExport = async () => {
    setBusy(true);
    setFeedback("");
    try {
      const blob = await exportPfeAssignments(campaign?.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "pfe_assignments.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setFeedback("Export downloaded.");
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const updateDraft = (patch: Partial<ManualJuryDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  return {
    campaign,
    teachers,
    subjects,
    assignments,
    plan,
    draft,
    feedback,
    busy,
    teacherOptions,
    refreshAll,
    runDryRun,
    commitAutoPlan,
    activateSession,
    assignManual,
    removeAssignment,
    downloadExport,
    updateDraft,
  };
}
