import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/features/alerts";
import {
  afterFailedLogin,
  type AuthError,
  hashPassword,
  hashToken,
  isLocked,
  newToken,
  passwordProblem,
  RESET_TOKEN_MINUTES,
  SESSION_COOKIE,
  SESSION_DAYS,
  VERIFY_TOKEN_HOURS,
  verifyPassword,
} from "@/lib/features/auth";
import { appUrl, sendEmail } from "@/lib/server/mailer";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  /** Not secret: lets the browser tell one login from the next when syncing lists. */
  sessionId: string;
}

export type AuthResult = { ok: true } | { ok: false; error: AuthError };

async function startSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** The logged-in user for this request, or null. Read once per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  const { user } = session;
  return { id: user.id, email: user.email, name: user.name, verified: user.emailVerifiedAt !== null, sessionId: session.id };
});

/** Use at the top of pages and actions that need an account. */
export async function requireUser(next = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?${new URLSearchParams({ next })}`);
  return user;
}

async function issueToken(userId: string, kind: "VERIFY_EMAIL" | "RESET_PASSWORD") {
  const token = newToken();
  const ms = kind === "VERIFY_EMAIL" ? VERIFY_TOKEN_HOURS * 3_600_000 : RESET_TOKEN_MINUTES * 60_000;
  // A new link replaces any earlier unused one of the same kind.
  await prisma.authToken.deleteMany({ where: { userId, kind, usedAt: null } });
  await prisma.authToken.create({ data: { userId, kind, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ms) } });
  return token;
}

async function consumeToken(token: string, kind: "VERIFY_EMAIL" | "RESET_PASSWORD") {
  const row = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.kind !== kind || row.usedAt || row.expiresAt < new Date()) return null;
  await prisma.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return row;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function emailShell(title: string, body: string, cta: { href: string; label: string }, footer: string) {
  return `<div style="font-family:Arial,sans-serif;color:#0c0d52;max-width:520px">
  <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#1d1fcf">Techify</p>
  <h1 style="font-size:24px;margin:8px 0">${title}</h1>
  <p>${body}</p>
  <p><a href="${cta.href}" style="display:inline-block;background:#1d1fcf;color:#f1f1ec;padding:10px 16px;text-decoration:none">${cta.label}</a></p>
  <p style="font-size:12px;color:#3d3f8f">${footer}</p>
</div>`;
}

export async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  const link = appUrl(`/verify-email?token=${await issueToken(user.id, "VERIFY_EMAIL")}`);
  return sendEmail({
    to: user.email,
    subject: "Confirm your Techify email",
    text: `Hi ${user.name},\n\nConfirm this email to connect your price alerts and Pro to your Techify account:\n${link}\n\nThe link works for ${VERIFY_TOKEN_HOURS} hours. If you didn't create an account, ignore this email.`,
    html: emailShell(
      "Confirm your email",
      `Hi ${escapeHtml(user.name)}, confirm this email to connect your price alerts and Pro to your Techify account.`,
      { href: link, label: "Confirm email" },
      `The link works for ${VERIFY_TOKEN_HOURS} hours. If you didn't create an account, ignore this email.`,
    ),
  });
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const problem = passwordProblem(input.password, email);
  if (problem) return { ok: false, error: problem };
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return { ok: false, error: "email_taken" };
  const user = await prisma.user.create({
    data: { email, name: input.name.trim(), passwordHash: await hashPassword(input.password) },
  });
  await startSession(user.id);
  await sendVerificationEmail(user);
  return { ok: true };
}

// Compared against when the email has no account, so both paths take about as long.
const decoyHash = hashPassword("techify-decoy-password");

export async function logIn(input: { email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({ where: { email } });
  const wrong = { ok: false as const, error: "wrong_credentials" as const };

  if (!user) {
    await verifyPassword(input.password, await decoyHash);
    return wrong;
  }
  if (isLocked(user)) {
    return { ok: false, error: "locked" };
  }
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    await prisma.user.update({ where: { id: user.id }, data: afterFailedLogin(user.failedLogins) });
    return wrong;
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await startSession(user.id);
  return { ok: true };
}

export async function logOut() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

export async function verifyEmail(token: string): Promise<boolean> {
  const row = await consumeToken(token, "VERIFY_EMAIL");
  if (!row) return false;
  await prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
  return true;
}

/** Always succeeds from the caller's view, so the form never reveals which emails have accounts. */
export async function requestPasswordReset(rawEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(rawEmail) } });
  if (!user) return;
  const link = appUrl(`/reset-password?token=${await issueToken(user.id, "RESET_PASSWORD")}`);
  await sendEmail({
    to: user.email,
    subject: "Reset your Techify password",
    text: `Hi ${user.name},\n\nChoose a new password here:\n${link}\n\nThe link works for ${RESET_TOKEN_MINUTES} minutes and only once. If you didn't ask for this, you can ignore it; your password hasn't changed.`,
    html: emailShell(
      "Reset your password",
      `Hi ${escapeHtml(user.name)}, use this link to choose a new password.`,
      { href: link, label: "Choose a new password" },
      `The link works for ${RESET_TOKEN_MINUTES} minutes and only once. If you didn't ask for this, ignore it; your password hasn't changed.`,
    ),
  });
}

export async function resetPassword(token: string, password: string): Promise<AuthResult> {
  const row = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!row || row.kind !== "RESET_PASSWORD" || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, error: "reset_invalid" };
  }
  const problem = passwordProblem(password, row.user.email);
  if (problem) return { ok: false, error: problem };
  if (!(await consumeToken(token, "RESET_PASSWORD"))) return { ok: false, error: "reset_invalid" };

  // Reading the email proves the address, and every other signed-in browser is logged out.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null, emailVerifiedAt: row.user.emailVerifiedAt ?? new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: row.userId } }),
  ]);
  await startSession(row.userId);
  return { ok: true };
}

export async function changePassword(user: CurrentUser, current: string, next: string): Promise<AuthResult> {
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(current, record.passwordHash))) return { ok: false, error: "wrong_current" };
  const problem = passwordProblem(next, user.email);
  if (problem) return { ok: false, error: problem };
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } }),
    // Keep this browser signed in; sign out everywhere else.
    prisma.session.deleteMany({ where: { userId: user.id, NOT: { tokenHash: hashToken(token ?? "") } } }),
  ]);
  return { ok: true };
}
