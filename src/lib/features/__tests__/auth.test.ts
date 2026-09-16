import { describe, expect, it } from "vitest";
import {
  afterFailedLogin,
  hashPassword,
  hashToken,
  isLocked,
  LOCKOUT_MINUTES,
  MAX_FAILED_LOGINS,
  newToken,
  passwordProblem,
  safeNextPath,
  verifyPassword,
} from "../auth";

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(stored).not.toContain("correct horse");
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("correct horse batterY", stored)).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same password")).not.toBe(await hashPassword("same password"));
  });

  it("rejects malformed stored values instead of throwing", async () => {
    expect(await verifyPassword("anything", "")).toBe(false);
    expect(await verifyPassword("anything", "bcrypt$abc")).toBe(false);
  });
});

describe("tokens", () => {
  it("are long, random and stored only as a hash", () => {
    const a = newToken();
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(newToken()).not.toBe(a);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).toBe(hashToken(a));
  });
});

describe("password rules", () => {
  it("flags short, email-as-password and common passwords", () => {
    expect(passwordProblem("short")).toBe("too_short");
    expect(passwordProblem("me@example.com", "me@example.com")).toBe("is_email");
    expect(passwordProblem("aaaaaaaaaa")).toBe("too_common");
    expect(passwordProblem("Password")).toBe("too_common");
    expect(passwordProblem("x".repeat(201))).toBe("too_long");
    expect(passwordProblem("chai at four")).toBeNull();
  });
});

describe("login lockout", () => {
  it(`locks for ${LOCKOUT_MINUTES} minutes after ${MAX_FAILED_LOGINS} failures`, () => {
    const now = new Date("2026-09-15T10:00:00Z");
    let state = { failedLogins: 0, lockedUntil: null as Date | null };
    for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
      state = afterFailedLogin(state.failedLogins, now);
      expect(state.lockedUntil).toBeNull();
    }
    state = afterFailedLogin(state.failedLogins, now);
    expect(state.lockedUntil?.getTime()).toBe(now.getTime() + LOCKOUT_MINUTES * 60_000);
    expect(isLocked(state, now)).toBe(true);
    expect(isLocked(state, new Date(now.getTime() + LOCKOUT_MINUTES * 60_000 + 1))).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps same-site paths and blocks everything else", () => {
    expect(safeNextPath("/pro")).toBe("/pro");
    expect(safeNextPath("/device/x?useCase=gaming")).toBe("/device/x?useCase=gaming");
    expect(safeNextPath("https://evil.example")).toBe("/account");
    expect(safeNextPath("//evil.example")).toBe("/account");
    expect(safeNextPath("/\\evil.example")).toBe("/account");
    expect(safeNextPath(undefined)).toBe("/account");
    expect(safeNextPath(["/pro"])).toBe("/account");
  });
});
