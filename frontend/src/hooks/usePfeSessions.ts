import { useCallback, useEffect, useMemo, useState } from "react";
import {
  autoFitManagedPfeLeftovers,
  createManagedPfeCampaign,
  generateManagedPfeCampaignSchedule,
  getAdminDepartments,
  getAdminTeachers,
  getManagedPfeCampaignDetail,
  listManagedPfeCampaigns,
  manualAssignManagedPfePresentation,
  type AdminDepartment,
  type AdminTeacher,
  type ManagedPfeCampaignCard,
  type ManagedPfeCampaignDetail,
} from "../services/admin";

function parseError(error: unknown): string {
  const e = error as {
    response?: {
      data?: {
        error?: string;
        detail?: string;
        details?: Record<string, string>;
        conflict?: {
          teacher_name?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          room?: string;
        };
      };
    };
    message?: string;
  };
  const data = e?.response?.data;
  if (data?.error) {
    if (data.conflict?.teacher_name) {
      return `${data.error}: ${data.conflict.teacher_name}`;
    }
    if (data.conflict?.date && data.conflict?.start_time && data.conflict?.end_time) {
      return `${data.error}: ${data.conflict.date} ${data.conflict.start_time}-${data.conflict.end_time}${data.conflict.room ? ` in ${data.conflict.room}` : ""}`;
    }
    return data.error;
  }
  return data?.detail ?? e?.message ?? "Unexpected error";
}

export interface CampaignFormState {
  departmentId: string;
  name: string;
  startDate: string;
  endDate: string;
  dayStart: string;
  dayEnd: string;
  slotDuration: number;
  breakDuration: number;
  dailyCap: number;
  rooms: string;
}

export interface ManualAssignFormState {
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  rapporteurId: string;
  presidentId: string;
}

export function usePfeSessions() {
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [campaigns, setCampaigns] = useState<ManagedPfeCampaignCard[]>([]);
  const [detail, setDetail] = useState<ManagedPfeCampaignDetail | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Campaign creation form
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>({
    departmentId: "",
    name: "PFE Campaign",
    startDate: "",
    endDate: "",
    dayStart: "08:00",
    dayEnd: "16:00",
    slotDuration: 60,
    breakDuration: 15,
    dailyCap: 3,
    rooms: "A1,A2",
  });

  // Manual assignment form
  const [manualForm, setManualForm] = useState<ManualAssignFormState>({
    subjectId: "",
    date: "",
    startTime: "08:00",
    endTime: "09:00",
    room: "",
    rapporteurId: "",
    presidentId: "",
  });

  const roomList = useMemo(
    () => campaignForm.rooms.split(",").map((item) => item.trim()).filter(Boolean),
    [campaignForm.rooms],
  );

  const teacherOptions = useMemo(() => {
    const departmentName = detail?.campaign.department_name;
    return teachers.filter((teacher) => teacher.department === departmentName);
  }, [detail?.campaign.department_name, teachers]);

  const selectedUnresolved = useMemo(
    () => detail?.unresolved.find((item) => item.subject_id === manualForm.subjectId) ?? null,
    [detail?.unresolved, manualForm.subjectId],
  );

  const juryTeacherOptions = useMemo(() => {
    if (!selectedUnresolved) {
      return teacherOptions;
    }
    return teacherOptions.filter((teacher) => teacher.id !== selectedUnresolved.supervisor_id);
  }, [selectedUnresolved, teacherOptions]);

  const presidentOptions = useMemo(
    () => juryTeacherOptions.filter((teacher) => teacher.id !== manualForm.rapporteurId),
    [juryTeacherOptions, manualForm.rapporteurId],
  );

  const refreshCampaigns = useCallback(async () => {
    const [departmentsResponse, teachersResponse, campaignsResponse] = await Promise.all([
      getAdminDepartments(),
      getAdminTeachers(),
      listManagedPfeCampaigns(),
    ]);
    setDepartments(departmentsResponse);
    setTeachers(teachersResponse);
    setCampaigns(campaignsResponse);
    if (!campaignForm.departmentId && departmentsResponse.length > 0) {
      setCampaignForm((prev) => ({ ...prev, departmentId: departmentsResponse[0].id }));
    }
    if (!selectedCampaignId && campaignsResponse.length > 0) {
      setSelectedCampaignId(campaignsResponse[0].id);
    }
  }, [campaignForm.departmentId, selectedCampaignId]);

  const loadDetail = useCallback(async (campaignId: string) => {
    if (!campaignId) {
      setDetail(null);
      return;
    }
    const response = await getManagedPfeCampaignDetail(campaignId);
    setDetail(response);
    if (response.unresolved.length > 0) {
      const first = response.unresolved[0];
      setManualForm((prev) => ({
        ...prev,
        subjectId: first.subject_id,
        date: response.campaign.start_date,
        room: response.campaign.rooms[0] ?? "",
      }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setBusy(true);
    setFeedback("");
    try {
      await refreshCampaigns();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  }, [refreshCampaigns]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!selectedCampaignId) {
      return;
    }
    setBusy(true);
    setFeedback("");
    getManagedPfeCampaignDetail(selectedCampaignId)
      .then((response) => {
        setDetail(response);
        if (response.unresolved.length > 0) {
          setManualForm((prev) => ({
            ...prev,
            subjectId: response.unresolved[0].subject_id,
            date: response.campaign.start_date,
            room: response.campaign.rooms[0] ?? "",
          }));
        }
      })
      .catch((error) => setFeedback(parseError(error)))
      .finally(() => setBusy(false));
  }, [selectedCampaignId]);

  useEffect(() => {
    if (!detail || !manualForm.subjectId) {
      return;
    }

    const unresolvedItem = detail.unresolved.find((item) => item.subject_id === manualForm.subjectId);
    if (!unresolvedItem) {
      return;
    }

    const validTeacherIds = new Set(
      teachers
        .filter(
          (teacher) =>
            teacher.department === detail.campaign.department_name &&
            teacher.id !== unresolvedItem.supervisor_id,
        )
        .map((teacher) => teacher.id),
    );

    if (!validTeacherIds.has(manualForm.rapporteurId)) {
      setManualForm((prev) => ({ ...prev, rapporteurId: "" }));
    }
    if (!validTeacherIds.has(manualForm.presidentId) || manualForm.presidentId === manualForm.rapporteurId) {
      setManualForm((prev) => ({ ...prev, presidentId: "" }));
    }
  }, [
    detail,
    manualForm.subjectId,
    manualForm.rapporteurId,
    manualForm.presidentId,
    teachers,
  ]);

  const createCampaign = async () => {
    if (!campaignForm.departmentId || roomList.length === 0 || !campaignForm.startDate || !campaignForm.endDate) {
      setFeedback("Department, dates, and rooms are required.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await createManagedPfeCampaign({
        department_id: campaignForm.departmentId,
        name: campaignForm.name,
        start_date: campaignForm.startDate,
        end_date: campaignForm.endDate,
        day_start_time: campaignForm.dayStart,
        day_end_time: campaignForm.dayEnd,
        slot_duration_minutes: campaignForm.slotDuration,
        break_duration_minutes: campaignForm.breakDuration,
        rooms: roomList,
        weekdays: ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi"],
        daily_cap_per_teacher: campaignForm.dailyCap,
      });
      setFeedback(response.message);
      await refreshCampaigns();
      setSelectedCampaignId(response.campaign.id);
      await loadDetail(response.campaign.id);
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const generateSchedule = async () => {
    if (!detail) {
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const response = await generateManagedPfeCampaignSchedule({
        campaign_id: detail.campaign.id,
      });
      setDetail(response);
      setFeedback(
        `${response.message}. Assigned ${response.plan.stats.assigned_count}/${response.plan.stats.subjects_total}.`,
      );
      await refreshCampaigns();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const manualAssign = async () => {
    if (
      !detail ||
      !manualForm.subjectId ||
      !manualForm.date ||
      !manualForm.room ||
      !manualForm.rapporteurId ||
      !manualForm.presidentId
    ) {
      setFeedback("Complete the manual assignment form first.");
      return;
    }
    if (manualForm.rapporteurId === manualForm.presidentId) {
      setFeedback("Rapporteur and president must be different teachers.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await manualAssignManagedPfePresentation({
        campaign_id: detail.campaign.id,
        subject_id: manualForm.subjectId,
        presentation_date: manualForm.date,
        start_time: manualForm.startTime,
        end_time: manualForm.endTime,
        room: manualForm.room,
        rapporteur_id: manualForm.rapporteurId,
        president_id: manualForm.presidentId,
      });
      setDetail(response);
      setFeedback(response.message);
      await refreshCampaigns();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const autoFitLeftovers = async () => {
    if (!detail) {
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await autoFitManagedPfeLeftovers({
        campaign_id: detail.campaign.id,
      });
      setDetail(response);
      setFeedback(response.message);
      await refreshCampaigns();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  return {
    // data
    departments,
    campaigns,
    detail,
    selectedCampaignId,
    busy,
    feedback,
    // form state
    campaignForm,
    setCampaignForm,
    manualForm,
    setManualForm,
    roomList,
    teacherOptions,
    selectedUnresolved,
    juryTeacherOptions,
    presidentOptions,
    // actions
    setSelectedCampaignId,
    setFeedback,
    refreshAll,
    createCampaign,
    generateSchedule,
    manualAssign,
    autoFitLeftovers,
  };
}
