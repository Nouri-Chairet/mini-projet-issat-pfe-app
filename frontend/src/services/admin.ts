import axios from "axios";
import { getStoredSession } from "./auth";

export interface AdminTeacher {
  id: string;
  username: string;
  email: string;
  department: string;
  ncin?: string;
}

export interface AdminClass {
  id: string;
  niveau: string;
  section: string;
  num: string;
}

export interface AdminStudent {
  username: string;
  parent_contact?: string;
  access_status: boolean;
  email: string;
}

export interface AdminDashboardStats {
  teachers: number;
  classes: number;
  students: number;
  departments: number;
  heads_assigned: number;
}

export interface AdminDepartment {
  id: string;
  name: string;
  teachers_count: number;
  head: {
    id: string;
    username: string;
    email: string;
  } | null;
}

export interface PfeSessionDepartment {
  department_id: string;
  department_name: string;
  head: {
    id: string;
    username: string;
    email: string;
  } | null;
  campaign: PfeCampaign | null;
}

export type AvailabilityLevel = "preferred" | "available" | "unavailable";

export interface PfeSubjectItem {
  id: string;
  title: string;
  student_id: string | null;
  student_name: string;
  student_email?: string | null;
  supervisor_id: string;
  supervisor_name: string;
  created_at: string;
}

export interface PfeStudentCandidate {
  id: string;
  username: string;
  email: string;
  class_id: string | null;
  class_label: string | null;
  assigned_to_pfe: boolean;
}

export interface PfeCampaign {
  id: string;
  department_id: string;
  department_name: string;
  name: string;
  start_date: string;
  end_date: string;
  day_start_time: string;
  day_end_time: string;
  slot_duration_minutes: number;
  break_duration_minutes: number;
  weekdays: string[];
  rooms: string[];
  daily_cap_per_teacher: number | null;
  head_can_start: boolean;
  availability_open: boolean;
  schedule_generated: boolean;
  generated_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignQuotaInput {
  teacher_id: string;
  target_presentations: number;
}

export interface WeeklyAvailabilityInput {
  context: "surveillance" | "pfe";
  teacher_id?: string;
  campaign_id?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  level: AvailabilityLevel;
}

export interface DateExceptionInput {
  context?: "surveillance" | "pfe";
  teacher_id?: string;
  campaign_id?: string;
  availability_date: string;
  start_time: string;
  end_time: string;
  level: AvailabilityLevel;
}

export interface TeacherAvailabilityResponse {
  teacher: {
    id: string;
    username: string;
  };
  context: string;
  campaign_id: string | null;
  weekly: Array<{
    id: string;
    teacher_id: string;
    context: string;
    campaign_id: string | null;
    day_of_week: string;
    start_time: string;
    end_time: string;
    level: AvailabilityLevel;
  }>;
  date_exceptions: Array<{
    id: string;
    teacher_id: string;
    context: string;
    campaign_id: string | null;
    availability_date: string;
    start_time: string;
    end_time: string;
    level: AvailabilityLevel;
  }>;
}

export interface AutoAssignPlan {
  campaign_id: string;
  assigned: Array<{
    subject_id: string;
    subject_title: string;
    slot: {
      date: string;
      start_time: string;
      end_time: string;
      room: string;
    };
    encadreur_id: string;
    rapporteur_id: string;
    president_id: string;
    levels: {
      encadreur: AvailabilityLevel;
      rapporteur: AvailabilityLevel;
      president: AvailabilityLevel;
    };
    score: number;
  }>;
  unresolved: Array<{
    subject_id: string;
    subject_title: string;
    reason: string;
  }>;
  teacher_load: Array<{
    teacher_id: string;
    teacher_name: string;
    target: number;
    assigned: number;
    delta: number;
  }>;
  stats: {
    subjects_total: number;
    assigned_count: number;
    unresolved_count: number;
    slots_generated: number;
  };
}

export interface CommitAutoAssignResponse extends AutoAssignPlan {
  message: string;
  persist: {
    created_slots: number;
    created_assignments: number;
    updated_assignments: number;
  };
}

export interface SeedPfeSimulationResponse {
  message: string;
  seed: number;
  teachers: number;
  head_department: {
    id: string | null;
    name: string | null;
  };
  presentations: number;
  campaign: PfeCampaign;
  seed_summary: Array<{
    teacher_id: string;
    teacher_name: string;
    target: number;
    preferred_sessions: number;
    available_not_preferred_sessions: number;
    rule_target_6_ok: boolean;
  }>;
  plan: AutoAssignPlan;
  persist: {
    created_slots: number;
    created_assignments: number;
    updated_assignments: number;
  };
}

export interface SeedPfeSessionDemoResponse {
  message: string;
  department: {
    id: string;
    name: string;
  };
  campaign: PfeCampaign;
  accounts: {
    head: {
      email: string;
      password: string;
      role: string;
      username: string;
    };
    teacher: {
      email: string;
      password: string;
      role: string;
      username: string;
      assigned_supervised_pfe_count: number;
    };
  };
}

export interface PfeAssignmentListItem {
  subject_id: string;
  subject_title: string;
  student_id: string | null;
  student_name: string;
  supervisor_id: string;
  supervisor_name: string;
  slot: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    room: string;
  } | null;
  jury: Array<{
    assignment_id: string;
    teacher_id: string;
    teacher_name: string;
    role: string;
    assigned_at: string;
  }>;
}

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function getAdminTeachers(): Promise<AdminTeacher[]> {
  const response = await axios.get<{ teachers: AdminTeacher[] }>(
    `${API_BASE_URL}/api/admin/teacher/get/`,
    { headers: authHeaders() },
  );
  return response.data?.teachers ?? [];
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const response = await axios.get<AdminDashboardStats>(
    `${API_BASE_URL}/api/admin/dashboard/stats/`,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function getAdminClasses(): Promise<AdminClass[]> {
  const response = await axios.get<{ classes: AdminClass[] }>(
    `${API_BASE_URL}/api/admin/get-classes/`,
    { headers: authHeaders() },
  );
  return response.data?.classes ?? [];
}

export async function getAdminDepartments(): Promise<AdminDepartment[]> {
  const response = await axios.get<{ departments: AdminDepartment[] }>(
    `${API_BASE_URL}/api/admin/departments/get/`,
    { headers: authHeaders() },
  );
  return response.data?.departments ?? [];
}

export async function createAdminDepartment(payload: { name: string }): Promise<void> {
  await axios.post(`${API_BASE_URL}/api/admin/departments/create/`, payload, {
    headers: authHeaders(),
  });
}

export async function assignDepartmentHead(payload: {
  department_id: string;
  teacher_id: string;
}): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/admin/departments/assign-head/`,
    payload,
    { headers: authHeaders() },
  );
}

export async function createAdminClasses(payload: {
  level: number;
  section: string;
  nb: number;
}): Promise<void> {
  await axios.post(`${API_BASE_URL}/api/admin/add-classes/`, payload, {
    headers: authHeaders(),
  });
}

export async function getStudentsByClass(classId: string): Promise<AdminStudent[]> {
  const response = await axios.get<{ students: AdminStudent[] }>(
    `${API_BASE_URL}/api/admin/students/get/`,
    {
      params: { class_id: classId },
      headers: authHeaders(),
    },
  );
  return response.data?.students ?? [];
}

export async function registerTeacher(payload: {
  email: string;
  username: string;
  password: string;
  department: string;
  ncin: string;
  age: number;
}): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/auth/register/`,
    {
      ...payload,
      role: "teacher",
    },
    { headers: authHeaders() },
  );
}

export async function registerStudent(payload: {
  email: string;
  username: string;
  password: string;
  class_id: string;
  parent_contact?: string;
}): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/auth/register/`,
    {
      ...payload,
      role: "student",
    },
    { headers: authHeaders() },
  );
}

export async function getPfeSubjects(departmentId?: string): Promise<PfeSubjectItem[]> {
  const response = await axios.get<{ subjects: PfeSubjectItem[] }>(
    `${API_BASE_URL}/api/admin/pfe/subjects/`,
    {
      params: departmentId ? { department_id: departmentId } : undefined,
      headers: authHeaders(),
    },
  );
  return response.data?.subjects ?? [];
}

export async function getPfeSessionDepartments(): Promise<PfeSessionDepartment[]> {
  const response = await axios.get<{ departments: PfeSessionDepartment[] }>(
    `${API_BASE_URL}/api/admin/pfe/sessions/departments/`,
    { headers: authHeaders() },
  );
  return response.data?.departments ?? [];
}

export async function unlockPfeSessionForHead(payload: {
  department_id: string;
}): Promise<{
  message: string;
  campaign: PfeCampaign;
}> {
  const response = await axios.post<{
    message: string;
    campaign: PfeCampaign;
  }>(`${API_BASE_URL}/api/admin/pfe/sessions/unlock-head/`, payload, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function seedPfeSessionDemo(payload?: {
  department_name?: string;
}): Promise<SeedPfeSessionDemoResponse> {
  const response = await axios.post<SeedPfeSessionDemoResponse>(
    `${API_BASE_URL}/api/admin/pfe/sessions/seed-demo/`,
    payload ?? {},
    { headers: authHeaders() },
  );
  return response.data;
}

export async function listPfeStudents(unassignedOnly = false): Promise<PfeStudentCandidate[]> {
  const response = await axios.get<{ students: PfeStudentCandidate[] }>(
    `${API_BASE_URL}/api/admin/pfe/students/`,
    {
      params: { unassigned_only: unassignedOnly },
      headers: authHeaders(),
    },
  );
  return response.data?.students ?? [];
}

export async function assignStudentToPfeSubject(payload: {
  subject_id: string;
  student_id?: string | null;
}): Promise<{
  message: string;
  subject: {
    id: string;
    student_id: string | null;
    student_name: string;
  };
}> {
  const response = await axios.post<{
    message: string;
    subject: {
      id: string;
      student_id: string | null;
      student_name: string;
    };
  }>(`${API_BASE_URL}/api/admin/pfe/subjects/assign-student/`, payload, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function upsertPfeCampaign(payload: {
  campaign_id?: string;
  department_id?: string;
  name: string;
  start_date: string;
  end_date: string;
  day_start_time: string;
  day_end_time: string;
  slot_duration_minutes: number;
  break_duration_minutes: number;
  weekdays: string[];
  rooms: string[];
  daily_cap_per_teacher?: number | null;
  is_active?: boolean;
}): Promise<PfeCampaign> {
  const response = await axios.post<{ campaign: PfeCampaign }>(
    `${API_BASE_URL}/api/admin/pfe/campaign/upsert/`,
    payload,
    { headers: authHeaders() },
  );
  return response.data.campaign;
}

export async function getPfeCampaign(filters?: {
  campaign_id?: string;
  department_id?: string;
}): Promise<PfeCampaign> {
  const response = await axios.get<{ campaign: PfeCampaign }>(
    `${API_BASE_URL}/api/admin/pfe/campaign/get/`,
    {
      params: filters,
      headers: authHeaders(),
    },
  );
  return response.data.campaign;
}

export async function setPfeCampaignQuotaOverrides(payload: {
  campaign_id: string;
  quotas: CampaignQuotaInput[];
}): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/admin/pfe/campaign/quotas/set/`,
    payload,
    { headers: authHeaders() },
  );
}

export async function setTeacherWeeklyAvailability(payload: WeeklyAvailabilityInput): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/admin/teacher/availability/set/`,
    payload,
    { headers: authHeaders() },
  );
}

export async function setTeacherAvailabilityDateException(payload: DateExceptionInput): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/admin/teacher/availability/date-exception/set/`,
    payload,
    { headers: authHeaders() },
  );
}

export async function getTeacherAvailability(filters: {
  context?: "surveillance" | "pfe";
  teacher_id?: string;
  campaign_id?: string;
}): Promise<TeacherAvailabilityResponse> {
  const response = await axios.get<TeacherAvailabilityResponse>(
    `${API_BASE_URL}/api/admin/teacher/availability/get/`,
    {
      params: filters,
      headers: authHeaders(),
    },
  );
  return response.data;
}

export async function pfeAutoAssignDryRun(payload: {
  campaign_id: string;
  subject_ids?: string[];
}): Promise<AutoAssignPlan> {
  const response = await axios.post<AutoAssignPlan>(
    `${API_BASE_URL}/api/admin/pfe/auto-assign/dry-run/`,
    payload,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function pfeAutoAssignCommit(payload: {
  campaign_id: string;
  subject_ids?: string[];
  replace_existing?: boolean;
  block_on_unresolved?: boolean;
}): Promise<CommitAutoAssignResponse> {
  const response = await axios.post<CommitAutoAssignResponse>(
    `${API_BASE_URL}/api/admin/pfe/auto-assign/commit/`,
    payload,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function listPfeAssignments(campaignId?: string): Promise<PfeAssignmentListItem[]> {
  const response = await axios.get<{ assignments: PfeAssignmentListItem[] }>(
    `${API_BASE_URL}/api/admin/pfe/assignments/list/`,
    {
      params: campaignId ? { campaign_id: campaignId } : undefined,
      headers: authHeaders(),
    },
  );
  return response.data?.assignments ?? [];
}

export async function seedPfeSimulationDataset(payload?: {
  seed?: number;
  teachers?: number;
  presentations?: number;
  department_name?: string;
  reset_existing?: boolean;
}): Promise<SeedPfeSimulationResponse> {
  const response = await axios.post<SeedPfeSimulationResponse>(
    `${API_BASE_URL}/api/admin/pfe/simulation/seed/`,
    payload ?? {},
    { headers: authHeaders() },
  );
  return response.data;
}

export interface BookedPfeImportDryRunResponse {
  valid: boolean;
  parsed_count: number;
  stats: {
    create: number;
    update: number;
    unchanged: number;
  };
  errors: string[];
  preview: Array<{
    row_number: number;
    subject_title: string;
    student_name: string;
    student_cin: string;
    encadreur_name: string;
    encadreur_cin: string;
    action: "create" | "update" | "unchanged";
  }>;
}

export interface BookedPfeImportCommitResponse {
  message: string;
  stats: {
    parsed: number;
    deleted: number;
    created: number;
    updated: number;
    unchanged: number;
  };
}

export async function listDepartmentPfeSubjects(
  departmentId?: string,
): Promise<PfeSubjectItem[]> {
  return getPfeSubjects(departmentId);
}

export async function listDepartmentTeachers(
  departmentName?: string,
): Promise<AdminTeacher[]> {
  const teachers = await getAdminTeachers();
  if (!departmentName) {
    return teachers;
  }
  return teachers.filter((teacher) => teacher.department === departmentName);
}

export async function activatePfeCampaign(campaignId: string): Promise<PfeCampaign> {
  const response = await axios.post<{ campaign: PfeCampaign }>(
    `${API_BASE_URL}/api/admin/pfe/campaign/activate/`,
    { campaign_id: campaignId },
    { headers: authHeaders() },
  );
  return response.data.campaign;
}

export async function assignPfeJury(payload: {
  pfe_subject_id: string;
  rapporteur_id?: string;
  president_id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
}): Promise<void> {
  await axios.post(`${API_BASE_URL}/api/admin/pfe/jury/assign/`, payload, {
    headers: authHeaders(),
  });
}

export async function unassignPfeJury(assignmentId: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/api/admin/pfe/jury/unassign/`, {
    params: { assignment_id: assignmentId },
    headers: authHeaders(),
  });
}

export async function exportPfeAssignments(campaignId?: string): Promise<Blob> {
  const response = await axios.get(`${API_BASE_URL}/api/admin/pfe/assignments/export/`, {
    params: campaignId ? { campaign_id: campaignId } : undefined,
    headers: authHeaders(),
    responseType: "blob",
  });
  return response.data;
}

export async function importBookedPfeExcelDryRun(payload: {
  file: File;
  department_id?: string;
  campaign_id?: string;
}): Promise<BookedPfeImportDryRunResponse> {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (payload.department_id) {
    formData.append("department_id", payload.department_id);
  }
  if (payload.campaign_id) {
    formData.append("campaign_id", payload.campaign_id);
  }

  const response = await axios.post<BookedPfeImportDryRunResponse>(
    `${API_BASE_URL}/api/admin/pfe/booked-import/dry-run/`,
    formData,
    {
      headers: {
        ...authHeaders(),
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function importBookedPfeExcelCommit(payload: {
  file: File;
  replace_existing?: boolean;
  department_id?: string;
  campaign_id?: string;
}): Promise<BookedPfeImportCommitResponse> {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("replace_existing", String(Boolean(payload.replace_existing)));
  if (payload.department_id) {
    formData.append("department_id", payload.department_id);
  }
  if (payload.campaign_id) {
    formData.append("campaign_id", payload.campaign_id);
  }

  const response = await axios.post<BookedPfeImportCommitResponse>(
    `${API_BASE_URL}/api/admin/pfe/booked-import/commit/`,
    formData,
    {
      headers: {
        ...authHeaders(),
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}
