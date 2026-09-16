import { createHash, randomBytes, scrypt, timingSafeEqual, type BinaryLike, type ScryptOptions } from "node:crypto";

import { LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from "./auth-rules";

export * from "./auth-rules";

const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 64 };

function scryptAsync(password: BinaryLike, salt: BinaryLike, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, keyLength, options, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** Returns `scrypt$N$r$p$salt$hash`, so parameters can be raised later without breaking old hashes. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, SCRYPT.keyLength, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await scryptAsync(password.normalize("NFKC"), Buffer.from(salt, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** A random URL-safe secret for cookies and email links. Only its hash is stored. */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isLocked(user: { lockedUntil: Date | null }, now = new Date()): boolean {
  return user.lockedUntil !== null && user.lockedUntil > now;
}

/** The counters to store after a failed attempt: lock the account once the limit is hit. */
export function afterFailedLogin(failedLogins: number, now = new Date()): { failedLogins: number; lockedUntil: Date | null } {
  const next = failedLogins + 1;
  if (next >= MAX_FAILED_LOGINS) return { failedLogins: 0, lockedUntil: new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) };
  return { failedLogins: next, lockedUntil: null };
}
