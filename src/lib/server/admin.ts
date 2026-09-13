import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_SESSION_HOURS, createAdminToken, passwordMatches, verifyAdminToken } from "@/lib/features/admin-session";

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value, secret());
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function logIn(password: string): Promise<boolean> {
  if (!adminConfigured() || !passwordMatches(password, process.env.ADMIN_PASSWORD!)) return false;
  const store = await cookies();
  store.set(ADMIN_COOKIE, createAdminToken(secret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_HOURS * 3600,
  });
  return true;
}

export async function logOut(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
