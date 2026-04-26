import axios from "axios";
import { getStoredSession } from "./auth";

export type TeacherAvailabilityLevel = "preferred" | "available" | "unavailable";

export interface TeacherPfeCampaign {
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
}

export interface TeacherPfeSessionState {
  teacher: {
    id: string;
    username: string;
    department: string;
    is_department_head: boolean;
  };
  department: {
    id: string;
    name: string;
    head_id: string | null;
    head_username: string | null;
  } | null;
  campaign: TeacherPfeCampaign | null;
  can_start_collection: boolean;
  can_submit_availability: boolean;
  my_supervised_pfe_count: number;
  my_entries: Array<{
    id: string;
    availability_date: string;
    start_time: string;
    end_time: string;
    level: TeacherAvailabilityLevel;
  }>;
}

export interface TeacherPfeScheduleResponse {
  campaign: TeacherPfeCampaign | null;
  schedule: Array<{
    subject_id: string;
    subject_title: string;
    student_id: string | null;
    student_name: string;
    slot: {
      date: string;
      start_time: string;
      end_time: string;
      room: string;
    } | null;
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

export async function getTeacherPfeSessionState(): Promise<TeacherPfeSessionState> {
  const response = await axios.get<TeacherPfeSessionState>(
    `${API_BASE_URL}/api/teacher/pfe/session/state/`,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function headStartPfeDateCollection(payload: {
  name: string;
  start_date: string;
  end_date: string;
  day_start_time: string;
  day_end_time: string;
  slot_duration_minutes: number;
  break_duration_minutes: number;
  daily_cap_per_teacher?: number | null;
  weekdays?: string[];
  rooms: string[];
}): Promise<{ message: string; campaign: TeacherPfeCampaign }> {
  const response = await axios.post<{ message: string; campaign: TeacherPfeCampaign }>(
    `${API_BASE_URL}/api/teacher/pfe/session/start/`,
    payload,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function submitTeacherPfeAvailability(payload: {
  campaign_id: string;
  entries: Array<{
    availability_date: string;
    start_time: string;
    end_time: string;
    level: TeacherAvailabilityLevel;
  }>;
}): Promise<{ message: string; campaign_id: string; entries_count: number }> {
  const response = await axios.post<{
    message: string;
    campaign_id: string;
    entries_count: number;
  }>(`${API_BASE_URL}/api/teacher/pfe/availability/submit/`, payload, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function headGeneratePfeSchedule(payload?: {
  campaign_id?: string;
}): Promise<{
  message: string;
  campaign: TeacherPfeCampaign;
  plan: {
    stats: {
      subjects_total: number;
      assigned_count: number;
      unresolved_count: number;
      slots_generated: number;
    };
  };
}> {
  const response = await axios.post<{
    message: string;
    campaign: TeacherPfeCampaign;
    plan: {
      stats: {
        subjects_total: number;
        assigned_count: number;
        unresolved_count: number;
        slots_generated: number;
      };
    };
  }>(`${API_BASE_URL}/api/teacher/pfe/session/generate/`, payload ?? {}, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function getMyPfeSchedule(campaignId?: string): Promise<TeacherPfeScheduleResponse> {
  const response = await axios.get<TeacherPfeScheduleResponse>(
    `${API_BASE_URL}/api/teacher/pfe/schedule/`,
    {
      params: campaignId ? { campaign_id: campaignId } : undefined,
      headers: authHeaders(),
    },
  );
  return response.data;
}
