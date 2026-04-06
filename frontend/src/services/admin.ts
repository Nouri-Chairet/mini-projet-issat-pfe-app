import axios from "axios";
import { getStoredSession } from "./auth";

export interface AdminTeacher {
  id: string;
  username: string;
  email: string;
  department: string;
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
