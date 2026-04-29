import axios from "axios";
import { getStoredSession } from "./auth";

/*
  Endpoints for the Teacher "single PFE upload" feature.

  Kept separate from `teacherPfe.ts` because that file deals with the
  PFE *campaign* (date-collection / availability / generated schedule),
  while these calls deal with creating individual PFE subjects under
  a single supervisor.
*/

export interface EligibleStudent {
  id: string;
  username: string;
  email: string;
  ncin: string | null;
  class_label: string | null;
}

export interface SupervisedSubject {
  id: string;
  title: string;
  description: string;
  student_id: string | null;
  student_name: string;
  student_email: string | null;
  class_label: string | null;
  supervisor_id: string;
  supervisor_name: string;
  department: string | null;
  created_at: string;
}

export interface CreatePfeSubjectPayload {
  student_id: string;
  title: string;
  description?: string;
}

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listEligibleStudents(): Promise<EligibleStudent[]> {
  const response = await axios.get<{ students: EligibleStudent[] }>(
    `${API_BASE_URL}/api/teacher/pfe/eligible-students/`,
    { headers: authHeaders() },
  );
  return response.data?.students ?? [];
}

export async function listMySupervisedSubjects(): Promise<SupervisedSubject[]> {
  const response = await axios.get<{ subjects: SupervisedSubject[] }>(
    `${API_BASE_URL}/api/teacher/pfe/subjects/`,
    { headers: authHeaders() },
  );
  return response.data?.subjects ?? [];
}

export async function createPfeSubject(
  payload: CreatePfeSubjectPayload,
): Promise<SupervisedSubject> {
  const response = await axios.post<{
    message: string;
    subject: SupervisedSubject;
  }>(`${API_BASE_URL}/api/teacher/pfe/subjects/create/`, payload, {
    headers: authHeaders(),
  });
  return response.data.subject;
}
