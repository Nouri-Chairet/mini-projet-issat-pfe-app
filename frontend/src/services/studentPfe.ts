import axios from "axios";

import { getStoredSession } from "./auth";

export interface StudentNotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  campaign_name: string | null;
  subject_id: string;
  subject_title: string;
  slot: {
    date: string;
    start_time: string;
    end_time: string;
    room: string;
  } | null;
}

export interface StudentPfeOverview {
  subject: {
    id: string;
    title: string;
    student_name: string;
    supervisor_name: string;
    slot: {
      date: string;
      start_time: string;
      end_time: string;
      room: string;
    } | null;
    jury: Array<{
      teacher_id: string;
      teacher_name: string;
      role: string;
    }>;
  } | null;
}

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getStudentNotifications(): Promise<{
  notifications: StudentNotificationItem[];
  unread_count: number;
}> {
  const response = await axios.get<{
    notifications: StudentNotificationItem[];
    unread_count: number;
  }>(`${API_BASE_URL}/api/student/notifications/`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function markStudentNotificationRead(notificationId: string): Promise<void> {
  await axios.post(
    `${API_BASE_URL}/api/student/notifications/mark-read/`,
    { notification_id: notificationId },
    { headers: authHeaders() },
  );
}

export async function getStudentPfeOverview(): Promise<StudentPfeOverview> {
  const response = await axios.get<StudentPfeOverview>(
    `${API_BASE_URL}/api/student/pfe/overview/`,
    { headers: authHeaders() },
  );
  return response.data;
}
