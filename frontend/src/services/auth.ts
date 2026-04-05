import axios from "axios";
import type { AppUser, AppUserRole } from "../types/app";

interface TokenPair {
  access: string;
  refresh: string;
}

interface JwtPayload {
  user_id?: string;
  role?: string;
  exp?: number;
}

export interface AuthSession {
  tokens: TokenPair;
  user: AppUser;
}

const SESSION_STORAGE_KEY = "pfe-auth-session";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(normalized);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(accessToken: string): boolean {
  const payload = decodeJwtPayload(accessToken);
  if (!payload?.exp) {
    return true;
  }
  return payload.exp <= Math.floor(Date.now() / 1000);
}

function mapBackendRoleToAppRole(role: string | undefined): AppUserRole {
  if (role === "admin") {
    return "chef";
  }
  if (role === "teacher") {
    return "enseignant";
  }
  return "etudiant";
}

function makeDisplayName(email: string): string {
  return email.split("@")[0]?.replace(/[._-]/g, " ") || "Utilisateur";
}

function makeAvatar(name: string): string {
  const chunks = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "");
  return chunks.join("") || "U";
}

function makeNumericId(seed: string): number {
  return [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

async function hydrateUser(tokens: TokenPair, email: string): Promise<AppUser> {
  const payload = decodeJwtPayload(tokens.access);
  const backendRole = payload?.role;
  const appRole = mapBackendRoleToAppRole(backendRole);
  let name = makeDisplayName(email);
  let department: string | undefined;

  if (backendRole === "teacher") {
    const response = await axios.get(`${API_BASE_URL}/api/auth/user/teacher/`, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
    });
    name = response.data?.user?.username ?? name;
    department = response.data?.department;
  }

  if (backendRole === "student") {
    const response = await axios.get(`${API_BASE_URL}/api/auth/user/student/`, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
    });
    name = response.data?.user?.username ?? name;
  }

  const schemaUserId = payload?.user_id;
  const idSeed = schemaUserId ?? email;

  return {
    id: makeNumericId(idSeed),
    name,
    role: appRole,
    avatar: makeAvatar(name),
    email,
    password: "",
    department,
    schemaUserId,
  };
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.tokens?.access || isTokenExpired(parsed.tokens.access)) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthSession> {
  const response = await axios.post<TokenPair>(`${API_BASE_URL}/api/auth/login/`, {
    email,
    password,
  });

  const tokens = response.data;
  const user = await hydrateUser(tokens, email);
  const session: AuthSession = { tokens, user };
  saveSession(session);
  return session;
}

export async function requestPasswordReset(email: string): Promise<string> {
  const response = await axios.post<{ detail?: string }>(
    `${API_BASE_URL}/api/auth/forgot-password/`,
    { email },
  );
  return response.data?.detail ?? "Email de réinitialisation envoyé.";
}
