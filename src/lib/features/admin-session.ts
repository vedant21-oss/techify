import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "techify_admin";
export const ADMIN_SESSION_HOURS = 12;

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

/** A tamper-proof session token: `<expiry ms>.<signature>`. */
export function createAdminToken(secret: string, now = Date.now()): string {
  const expires = String(now + ADMIN_SESSION_HOURS * 3_600_000);
  return `${expires}.${sign(expires, secret)}`;
}

export function verifyAdminToken(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token || !secret) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < now) return false;
  const expected = Buffer.from(sign(expires, secret));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Constant-time password comparison. */
export function passwordMatches(given: string, expected: string): boolean {
  if (!expected) return false;
  const a = createHmac("sha256", "techify").update(given).digest();
  const b = createHmac("sha256", "techify").update(expected).digest();
  return timingSafeEqual(a, b);
}
