/* Account rules shared by the server and the browser forms (no Node APIs here). */

export const SESSION_COOKIE = "techify_session";
export const SESSION_DAYS = 30;
export const VERIFY_TOKEN_HOURS = 48;
export const RESET_TOKEN_MINUTES = 60;
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 8;

export type PasswordProblem = "too_short" | "too_long" | "is_email" | "too_common";

/** What's wrong with a new password, or null when it's acceptable. */
export function passwordProblem(password: string, email = ""): PasswordProblem | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "too_short";
  if (password.length > 200) return "too_long";
  if (email && password.toLowerCase() === email.toLowerCase()) return "is_email";
  if (/^(.)\1+$/.test(password) || ["password", "12345678", "qwertyui", "techify123"].includes(password.toLowerCase())) {
    return "too_common";
  }
  return null;
}

export type AuthError = PasswordProblem | "email_taken" | "wrong_credentials" | "locked" | "reset_invalid" | "wrong_current";

/** Only same-site paths are allowed after login, so a crafted link can't bounce people elsewhere. */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/account";
  return next;
}
