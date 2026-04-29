import axios from "axios";
import { getStoredSession } from "./auth";

export interface PfeImportPreviewRow {
  row: number;
  title: string;
  student_name: string;
  supervisor_name: string;
  action: "create" | "reject";
  errors: string[];
}

export interface PfeImportStats {
  create: number;
  reject: number;
  total: number;
}

export interface PfeImportDryRunResult {
  valid: boolean;
  errors: string[];
  preview: PfeImportPreviewRow[];
  stats: PfeImportStats;
  parsed_count: number;
}

export interface PfeImportSkipped {
  row: number;
  student_name: string;
  reason: string;
}

export interface PfeImportCommitResult {
  message: string;
  created_count: number;
  skipped_count: number;
  errors: string[];
  skipped: PfeImportSkipped[];
  created_ids: string[];
  stats: PfeImportStats;
}

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function pfeImportDryRun(
  file: File,
): Promise<PfeImportDryRunResult> {
  const form = new FormData();
  form.append("file", file);
  const response = await axios.post<PfeImportDryRunResult>(
    `${API_BASE_URL}/api/admin/pfe/import/dry-run/`,
    form,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function pfeImportCommit(
  file: File,
): Promise<PfeImportCommitResult> {
  const form = new FormData();
  form.append("file", file);
  const response = await axios.post<PfeImportCommitResult>(
    `${API_BASE_URL}/api/admin/pfe/import/commit/`,
    form,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function downloadPfeImportTemplate(): Promise<Blob> {
  const response = await axios.get(
    `${API_BASE_URL}/api/admin/pfe/import/template/`,
    { headers: authHeaders(), responseType: "blob" },
  );
  return response.data as Blob;
}
