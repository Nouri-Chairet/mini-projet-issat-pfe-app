import axios from "axios";
import { getStoredSession } from "./auth";

export interface TeacherTodayClass {
  id: string;
  class_id: string;
  class_label: string;
  subject: string;
  room: string;
  start_time: string;
  end_time: string;
}

export interface TeacherTodayClassesResponse {
  is_published: boolean;
  today?: string;
  schedules: TeacherTodayClass[];
}

export interface PresenceRosterStudent {
  id: string;
  username: string;
  email: string;
  ncin: string | null;
  presence: boolean | null; // null = not yet marked
}

export interface PresenceRosterResponse {
  schedule: {
    id: string;
    class_id: string;
    class_label: string;
    subject: string;
    room: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  };
  session_date: string;
  students: PresenceRosterStudent[];
}

export interface PresenceHistoryRow {
  student_id: string;
  student_name: string;
  sessions_total: number;
  absences: number;
  percent: number;
  warning: boolean;
}

export interface PresenceHistoryResponse {
  subject: string;
  class_id: string;
  threshold_percent: number;
  students: PresenceHistoryRow[];
}

export interface StudentSubjectAbsence {
  subject: string;
  sessions_total: number;
  absences: number;
  percent: number;
  warning: boolean;
}

export interface StudentPresenceSummary {
  class_label: string | null;
  subjects: StudentSubjectAbsence[];
  threshold_percent: number;
  totals: {
    sessions: number;
    absences: number;
    percent: number;
  };
}

export interface SavePresencePayload {
  schedule_id: string;
  students: Array<{ student_id: string; presence: boolean }>;
}

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTodayClasses(): Promise<TeacherTodayClassesResponse> {
  const response = await axios.get<TeacherTodayClassesResponse>(
    `${API_BASE_URL}/api/teacher/presence/today-classes/`,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function getPresenceRoster(
  scheduleId: string,
  date?: string,
): Promise<PresenceRosterResponse> {
  const response = await axios.get<PresenceRosterResponse>(
    `${API_BASE_URL}/api/teacher/presence/students/`,
    {
      params: { schedule_id: scheduleId, ...(date ? { date } : {}) },
      headers: authHeaders(),
    },
  );
  return response.data;
}

export async function getClassPresenceHistory(
  classId: string,
  subject: string,
): Promise<PresenceHistoryResponse> {
  const response = await axios.get<PresenceHistoryResponse>(
    `${API_BASE_URL}/api/teacher/presence/history/`,
    {
      params: { class_id: classId, subject },
      headers: authHeaders(),
    },
  );
  return response.data;
}

export async function savePresence(
  payload: SavePresencePayload,
): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/teacher/make_presence/`,
    payload,
    { headers: authHeaders() },
  );
}

export async function getStudentPresenceSummary(): Promise<StudentPresenceSummary> {
  const response = await axios.get<StudentPresenceSummary>(
    `${API_BASE_URL}/api/student/presence/summary/`,
    { headers: authHeaders() },
  );
  return response.data;
}
