import { buildSiblingApiUrl } from "./apiUrl";

export const AUTH_SESSION_INVALIDATED_EVENT =
  "cinematheque:auth-session-invalidated";
export const AUTH_TOKEN_STORAGE_KEY = "token";
export const AUTH_EXPIRY_STORAGE_KEY = "expiresAtUtc";

export type AuthSession = {
  token: string;
  expiresAtUtc: string;
};

export type AuthInvalidationReason = "expired" | "unauthorized";

export class AuthApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<AuthSession> {
  const response = await fetch(buildSiblingApiUrl("auth", "login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw await createAuthError(response);
  }

  const session = await readLoginResponse(response);
  storeAuthSession(session);
  return session;
}

export function getStoredAuthSession(): AuthSession | null {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const expiresAtUtc = localStorage.getItem(AUTH_EXPIRY_STORAGE_KEY);

  if (!token || !expiresAtUtc || !isFutureTimestamp(expiresAtUtc)) {
    clearAuthSession();
    return null;
  }

  return { token, expiresAtUtc };
}

export function storeAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
  localStorage.setItem(AUTH_EXPIRY_STORAGE_KEY, session.expiresAtUtc);
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_EXPIRY_STORAGE_KEY);
}

export function invalidateAuthSession(reason: AuthInvalidationReason): void {
  clearAuthSession();
  window.dispatchEvent(
    new CustomEvent<AuthInvalidationReason>(AUTH_SESSION_INVALIDATED_EVENT, {
      detail: reason,
    }),
  );
}

function isFutureTimestamp(value: string): boolean {
  const expiresAt = Date.parse(value);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

async function readLoginResponse(response: Response): Promise<AuthSession> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The authentication service returned invalid JSON.");
  }

  if (typeof body !== "object" || body === null) {
    throw new Error("The authentication service returned an invalid session.");
  }

  const candidate = body as Record<string, unknown>;
  if (
    typeof candidate.token !== "string" ||
    !candidate.token.trim() ||
    typeof candidate.expiresAtUtc !== "string" ||
    !isFutureTimestamp(candidate.expiresAtUtc)
  ) {
    throw new Error("The authentication service returned an expired or invalid session.");
  }

  return {
    token: candidate.token,
    expiresAtUtc: candidate.expiresAtUtc,
  };
}

async function createAuthError(response: Response): Promise<AuthApiError> {
  let message =
    response.status === 401
      ? "Invalid username or password."
      : `Could not log in (${response.status}).`;

  try {
    const body = (await response.json()) as { title?: string };
    if (body.title) message = body.title;
  } catch {
    // Keep the status-specific fallback when no JSON problem response exists.
  }

  return new AuthApiError(message, response.status);
}
