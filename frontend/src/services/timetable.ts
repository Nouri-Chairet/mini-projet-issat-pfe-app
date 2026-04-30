import axios from "axios";
import { getStoredSession } from "./auth";

export interface TimetableRow {
  teacher: string;
  class: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  subject: string;
}

export interface TimetableDryRunResult {
  valid: boolean;
  errors: string[];
  conflicts: string[];
  parsed_count: number;
  preview: TimetableRow[];
}

export interface TeacherScheduleItem {
  id: string;
  class: string;
  teacher?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  subject: string;
}

export interface TimetablePublicationStatus {
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  updated_at: string;
}

export interface TimetableReadinessRow {
  schedule_id: string;
  class: string;
  teacher: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  students_expected: number;
  attendance_marked: number;
  ready: boolean;
}

export interface TimetableReadinessResponse {
  date: string;
  rows: TimetableReadinessRow[];
}

export interface ManualTimetablePayload {
  teacher_id: string;
  class_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  subject: string;
}

export interface TeacherCurrentSession {
  day_of_week: string;
  start_time: string;
  end_time: string;
  class_id: string;
  room: string;
  subject: string;
  teacher_name: string;
}

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

const CACHE_TTL_MS = 60_000;
const timetableCache = new Map<string, { expiresAt: number; data: unknown }>();

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function getCache<T>(key: string): T | null {
  const hit = timetableCache.get(key);
  if (!hit) {
    return null;
  }
  if (Date.now() > hit.expiresAt) {
    timetableCache.delete(key);
    return null;
  }
  return hit.data as T;
}

function setCache<T>(key: string, data: T): void {
  timetableCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidateTimetableCache() {
  timetableCache.clear();
}

export async function timetableDryRun(file: File): Promise<TimetableDryRunResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post<TimetableDryRunResult>(
    `${API_BASE_URL}/api/admin/timetable/import/dry-run/`,
    formData,
    {
      headers: {
        ...authHeaders(),
      },
    },
  );

  return response.data;
}

export async function timetableCommit(
  file: File,
  replaceExisting: boolean,
): Promise<{ message: string; created_count: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("replace_existing", replaceExisting ? "true" : "false");

  const response = await axios.post<{ message: string; created_count: number }>(
    `${API_BASE_URL}/api/admin/timetable/import/commit/`,
    formData,
    {
      headers: {
        ...authHeaders(),
      },
    },
  );

  invalidateTimetableCache();

  return response.data;
}

export async function getTimetablePublicationStatus(
  useCache = true,
): Promise<TimetablePublicationStatus> {
  const cacheKey = "publication-status";
  if (useCache) {
    const cached = getCache<TimetablePublicationStatus>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const response = await axios.get<TimetablePublicationStatus>(
    `${API_BASE_URL}/api/admin/timetable/status/`,
    { headers: authHeaders() },
  );
  setCache(cacheKey, response.data);
  return response.data;
}

export async function publishTimetable(): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/admin/timetable/publish/`,
    {},
    { headers: authHeaders() },
  );
  invalidateTimetableCache();
}

export async function unpublishTimetable(): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/admin/timetable/unpublish/`,
    {},
    { headers: authHeaders() },
  );
  invalidateTimetableCache();
}

export async function listTimetableSlots(filters?: {
  teacher_id?: string;
  class_id?: string;
  day_of_week?: string;
}): Promise<TeacherScheduleItem[]> {
  const response = await axios.get<{ schedules: TeacherScheduleItem[] }>(
    `${API_BASE_URL}/api/admin/timetable/list/`,
    {
      params: filters,
      headers: authHeaders(),
    },
  );
  return response.data?.schedules ?? [];
}

export async function createTimetableSlot(payload: ManualTimetablePayload): Promise<void> {
  await axios.post(`${API_BASE_URL}/api/admin/timetable/manual/create/`, payload, {
    headers: authHeaders(),
  });
  invalidateTimetableCache();
}

export async function deleteTimetableSlot(scheduleId: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/api/admin/timetable/manual/delete/`, {
    params: { schedule_id: scheduleId },
    headers: authHeaders(),
  });
  invalidateTimetableCache();
}

export async function getTimetableReadiness(
  dateIso?: string,
): Promise<TimetableReadinessResponse> {
  const response = await axios.get<TimetableReadinessResponse>(
    `${API_BASE_URL}/api/admin/timetable/readiness/`,
    {
      params: dateIso ? { date: dateIso } : undefined,
      headers: authHeaders(),
    },
  );
  return response.data;
}

export async function exportTimetableIcs(scope?: {
  scope?: "teacher" | "class";
  teacher_id?: string;
  class_id?: string;
}): Promise<Blob> {
  const response = await axios.get(`${API_BASE_URL}/api/admin/timetable/export/ics/`, {
    params: scope,
    headers: authHeaders(),
    responseType: "blob",
  });
  return response.data as Blob;
}

export async function downloadTimetableTemplate(): Promise<Blob> {
  const response = await axios.get(
    `${API_BASE_URL}/api/admin/timetable/template/`,
    {
      headers: authHeaders(),
      responseType: "blob",
    },
  );
  return response.data as Blob;
}

export async function logTimetableTelemetry(eventName: string, route: string, payload?: unknown): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/admin/timetable/telemetry/`,
    {
      event_name: eventName,
      route,
      payload,
    },
    { headers: authHeaders() },
  );
}

export async function getTeacherCurrentSession(): Promise<TeacherCurrentSession | null> {
  try {
    const response = await axios.get<TeacherCurrentSession>(
      `${API_BASE_URL}/api/teacher/get_current_session/`,
      { headers: authHeaders() },
    );
    return response.data;
  } catch {
    return null;
  }
}

export async function getTeacherTimetable(
  teacherId: string,
): Promise<TeacherScheduleItem[]> {
  const cacheKey = `teacher:${teacherId}`;
  const cached = getCache<TeacherScheduleItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await axios.get<{ schedules: TeacherScheduleItem[] }>(
    `${API_BASE_URL}/api/admin/teacher/schedule/`,
    {
      params: { teacher_id: teacherId },
      headers: authHeaders(),
    },
  );
  const schedules = response.data?.schedules ?? [];
  setCache(cacheKey, schedules);
  return schedules;
}

export async function getStudentTimetable(): Promise<TeacherScheduleItem[]> {
  const cached = getCache<TeacherScheduleItem[]>("student:self");
  if (cached) {
    return cached;
  }

  const studentResponse = await axios.get<{ class_id: string }>(
    `${API_BASE_URL}/api/auth/user/student/`,
    { headers: authHeaders() },
  );
  const classId = studentResponse.data?.class_id;
  if (!classId) {
    return [];
  }

  const response = await axios.get<{ schedules: TeacherScheduleItem[] }>(
    `${API_BASE_URL}/api/admin/classes/schedule/`,
    {
      params: { class_id: classId },
      headers: authHeaders(),
    },
  );

  const schedules = response.data?.schedules ?? [];
  setCache("student:self", schedules);
  return schedules;
}
