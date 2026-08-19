import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_EXPIRY_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  getStoredAuthSession,
  loginAdmin,
} from "./auth";

describe("admin authentication", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv("VITE_API_URL", "https://movies.example.test/api/Movies///");
  });

  it("logs in and stores only the token and expiry", async () => {
    const expiresAtUtc = new Date(Date.now() + 60_000).toISOString();
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        jsonResponse({ token: "signed.jwt.token", expiresAtUtc }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(loginAdmin("archive-admin", "not-stored")).resolves.toEqual({
      token: "signed.jwt.token",
      expiresAtUtc,
    });

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://movies.example.test/api/auth/login",
    );
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "archive-admin",
        password: "not-stored",
      }),
    });
    expect(Object.keys(localStorage).sort()).toEqual(
      [AUTH_EXPIRY_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY].sort(),
    );
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("signed.jwt.token");
    expect(localStorage.getItem(AUTH_EXPIRY_STORAGE_KEY)).toBe(expiresAtUtc);
    expect(JSON.stringify(localStorage)).not.toContain("not-stored");
    expect(JSON.stringify(localStorage)).not.toContain("archive-admin");
  });

  it("does not store credentials when login fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 401)));

    await expect(loginAdmin("admin", "wrong")).rejects.toEqual(
      expect.objectContaining({ name: "AuthApiError", status: 401 }),
    );
    expect(localStorage).toHaveLength(0);
  });

  it("clears and rejects an expired stored session", () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "expired-token");
    localStorage.setItem(
      AUTH_EXPIRY_STORAGE_KEY,
      new Date(Date.now() - 1_000).toISOString(),
    );

    expect(getStoredAuthSession()).toBeNull();
    expect(localStorage).toHaveLength(0);
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => structuredClone(body),
  } as Response;
}
