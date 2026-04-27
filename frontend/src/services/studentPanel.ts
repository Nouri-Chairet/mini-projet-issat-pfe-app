import axios from "axios";
import { getStoredSession } from "./auth";

export interface Classmate {
  id: string;
  username: string;
  email: string;
  ncin: string | null;
}

export interface ClassmatesResponse {
  class: string | null;
  class_id: string | null;
  classmates: Classmate[];
  count: number;
}

export interface StudentPost {
  id: string;
  title: string;
  content: string;
  type: "lesson" | "announcement";
  author: string;
  author_role: string;
  class_id: string | null;
  url: string;
  created_at: string;
}

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getStudentClassmates(): Promise<ClassmatesResponse> {
  const response = await axios.get<ClassmatesResponse>(
    `${API_BASE_URL}/api/student/classmates/`,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function getStudentPosts(): Promise<StudentPost[]> {
  const response = await axios.get<{ posts: StudentPost[] }>(
    `${API_BASE_URL}/api/student/posts/`,
    { headers: authHeaders() },
  );
  return response.data?.posts ?? [];
}
