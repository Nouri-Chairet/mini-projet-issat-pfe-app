import axios from "axios";
import { getStoredSession } from "./auth";

export interface ForumAnswer {
  id: string;
  content: string;
  author: string;
  author_id: string;
  author_role: string;
  created_at: string;
}

export interface ForumQuestion {
  id: string;
  title: string;
  content: string;
  author: string;
  author_id: string;
  author_role: string;
  class_id: string | null;
  is_resolved: boolean;
  created_at: string;
  answers_count: number;
  answers?: ForumAnswer[];
}

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getForumQuestions(classId?: string): Promise<ForumQuestion[]> {
  const response = await axios.get<{ questions: ForumQuestion[] }>(
    `${API_BASE_URL}/api/admin/forum/questions/`,
    {
      params: classId ? { class_id: classId } : undefined,
      headers: authHeaders(),
    },
  );
  return response.data?.questions ?? [];
}

export async function getForumQuestionDetail(questionId: string): Promise<ForumQuestion> {
  const response = await axios.get<ForumQuestion>(
    `${API_BASE_URL}/api/admin/forum/questions/${questionId}/`,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function createForumQuestion(
  title: string,
  content: string,
  classId?: string,
): Promise<{ id: string }> {
  const response = await axios.post<{ id: string }>(
    `${API_BASE_URL}/api/admin/forum/questions/create/`,
    { title, content, class_id: classId ?? null },
    { headers: authHeaders() },
  );
  return response.data;
}

export async function answerForumQuestion(
  questionId: string,
  content: string,
): Promise<{ id: string }> {
  const response = await axios.post<{ id: string }>(
    `${API_BASE_URL}/api/admin/forum/questions/answer/`,
    { question_id: questionId, content },
    { headers: authHeaders() },
  );
  return response.data;
}

export async function deleteForumAnswer(answerId: string): Promise<void> {
  await axios.delete(
    `${API_BASE_URL}/api/admin/forum/answers/${answerId}/delete/`,
    { headers: authHeaders() },
  );
}

export async function deleteForumQuestion(questionId: string): Promise<void> {
  await axios.delete(
    `${API_BASE_URL}/api/admin/forum/questions/${questionId}/delete/`,
    { headers: authHeaders() },
  );
}
