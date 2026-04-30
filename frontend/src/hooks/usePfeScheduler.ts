import { useCallback, useEffect, useMemo, useState } from "react";
import {
  assignStudentToPfeSubject,
  getAdminDepartments,
  getPfeCampaign,
  getPfeSubjects,
  listPfeStudents,
  listPfeAssignments,
  upsertPfeCampaign,
  type AdminDepartment,
  type PfeAssignmentListItem,
  type PfeCampaign,
  type PfeStudentCandidate,
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

export interface SchedulerCampaignForm {
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

export function usePfeScheduler() {
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [campaign, setCampaign] = useState<PfeCampaign | null>(null);
  const [subjects, setSubjects] = useState<PfeSubjectItem[]>([]);
  const [students, setStudents] = useState<PfeStudentCandidate[]>([]);
  const [assignments, setAssignments] = useState<PfeAssignmentListItem[]>([]);
  const [studentSubjectId, setStudentSubjectId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [form, setForm] = useState<SchedulerCampaignForm>({
    name: "PFE Session", startDate: "2026-06-01", endDate: "2026-06-30",
    dayStart: "08:00", dayEnd: "16:00", slotDuration: 60, breakDuration: 15,
    dailyCap: 3, rooms: "A1,A2,A3,A4",
  });
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const roomList = useMemo(
    () => form.rooms.split(",").map((r) => r.trim()).filter(Boolean),
    [form.rooms],
  );

  const loadDepts = useCallback(async () => {
    const list = await getAdminDepartments();
    setDepartments(list);
    if (!selectedDeptId && list.length > 0) setSelectedDeptId(list[0].id);
  }, [selectedDeptId]);

  const loadCampaign = useCallback(async (deptId: string) => {
    if (!deptId) { setCampaign(null); setSubjects([]); setAssignments([]); return; }
    const [cr, sr, st] = await Promise.all([
      getPfeCampaign({ department_id: deptId }).catch(() => null),
      getPfeSubjects(deptId), listPfeStudents(false),
    ]);
    setCampaign(cr); setSubjects(sr); setStudents(st);
    if (sr.length > 0) setStudentSubjectId((p) => p || sr[0].id);
    else { setStudentSubjectId(""); setStudentId(""); }
    if (cr) {
      setAssignments(await listPfeAssignments(cr.id));
      setForm({
        name: cr.name, startDate: cr.start_date, endDate: cr.end_date,
        dayStart: cr.day_start_time.slice(0, 5), dayEnd: cr.day_end_time.slice(0, 5),
        slotDuration: cr.slot_duration_minutes, breakDuration: cr.break_duration_minutes,
        dailyCap: cr.daily_cap_per_teacher ?? 3, rooms: cr.rooms.join(","),
      });
    } else setAssignments([]);
  }, []);

  const refreshAll = useCallback(async () => {
    setBusy(true); setFeedback("");
    try { await loadDepts(); if (selectedDeptId) await loadCampaign(selectedDeptId); setFeedback("Data refreshed."); }
    catch (e) { setFeedback(parseError(e)); }
    finally { setBusy(false); }
  }, [loadCampaign, loadDepts, selectedDeptId]);

  useEffect(() => { void refreshAll(); }, [refreshAll]);
  useEffect(() => {
    if (!selectedDeptId) return;
    void (async () => {
      setBusy(true); setFeedback("");
      try { await loadCampaign(selectedDeptId); }
      catch (e) { setFeedback(parseError(e)); }
      finally { setBusy(false); }
    })();
  }, [loadCampaign, selectedDeptId]);
  useEffect(() => {
    if (!studentSubjectId) return;
    const s = subjects.find((i) => i.id === studentSubjectId);
    if (s) setStudentId(s.student_id ?? "");
  }, [studentSubjectId, subjects]);

  const saveCampaign = async () => {
    if (!selectedDeptId) { setFeedback("Select a department first."); return; }
    if (roomList.length === 0) { setFeedback("Add at least one room."); return; }
    setBusy(true); setFeedback("");
    try {
      const next = await upsertPfeCampaign({
        campaign_id: campaign?.id, department_id: selectedDeptId,
        name: form.name, start_date: form.startDate, end_date: form.endDate,
        day_start_time: form.dayStart, day_end_time: form.dayEnd,
        slot_duration_minutes: form.slotDuration, break_duration_minutes: form.breakDuration,
        weekdays: ["Lundi","Mardi","Mercredi","jeudi","Vendredi"],
        rooms: roomList, daily_cap_per_teacher: form.dailyCap, is_active: true,
      });
      setCampaign(next); setFeedback("Campaign saved.");
      await loadCampaign(selectedDeptId);
    } catch (e) { setFeedback(parseError(e)); }
    finally { setBusy(false); }
  };

  const saveStudentAssignment = async () => {
    if (!studentSubjectId) { setFeedback("Select a subject first."); return; }
    setBusy(true); setFeedback("");
    try {
      const r = await assignStudentToPfeSubject({ subject_id: studentSubjectId, student_id: studentId || null });
      if (selectedDeptId) setSubjects(await getPfeSubjects(selectedDeptId));
      if (campaign) setAssignments(await listPfeAssignments(campaign.id));
      setStudents(await listPfeStudents(false)); setFeedback(r.message);
    } catch (e) { setFeedback(parseError(e)); }
    finally { setBusy(false); }
  };

  return {
    departments, selectedDeptId, setSelectedDeptId, campaign, subjects, students,
    assignments, studentSubjectId, setStudentSubjectId, studentId, setStudentId,
    form, setForm, feedback, setFeedback, busy, roomList,
    refreshAll, saveCampaign, saveStudentAssignment,
  };
}
