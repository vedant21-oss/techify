"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/features/auth-rules";
import { stopAlert, stopLaunchEmail } from "@/lib/server/account";
import {
  changePassword,
  logIn,
  logOut,
  requestPasswordReset,
  requireUser,
  resetPassword,
  sendVerificationEmail,
  signUp,
} from "@/lib/server/auth";

/** `error` is a key into messages.auth.errors, so the form shows it in the visitor's language. */
export type AuthFormState = { ok?: boolean; error?: string; email?: string; name?: string } | null;

const text = (form: FormData, key: string) => String(form.get(key) ?? "");
const emailSchema = z.email();

export async function signupAction(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const name = text(form, "name").trim();
  const email = text(form, "email").trim();
  // Name and email go back with any error so the form keeps them; passwords never do.
  if (name.length < 2 || name.length > 60) return { error: "name", name, email };
  if (!emailSchema.safeParse(email).success) return { error: "emailInvalid", name, email };
  const result = await signUp({ name, email, password: text(form, "password") });
  if (!result.ok) return { error: result.error, name, email };
  redirect(safeNextPath(form.get("next")));
}

export async function loginAction(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = text(form, "email").trim();
  if (!emailSchema.safeParse(email).success) return { error: "emailInvalid", email };
  const result = await logIn({ email, password: text(form, "password") });
  if (!result.ok) return { error: result.error, email };
  redirect(safeNextPath(form.get("next")));
}

export async function logoutAction() {
  await logOut();
  redirect("/");
}

export async function forgotPasswordAction(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = text(form, "email").trim();
  if (!emailSchema.safeParse(email).success) return { error: "emailInvalid", email };
  await requestPasswordReset(email);
  return { ok: true, email };
}

export async function resetPasswordAction(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const result = await resetPassword(text(form, "token"), text(form, "password"));
  if (!result.ok) return { error: result.error };
  redirect("/account");
}

export async function changePasswordAction(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const user = await requireUser();
  const result = await changePassword(user, text(form, "current"), text(form, "password"));
  return result.ok ? { ok: true } : { error: result.error };
}

export async function resendVerificationAction(): Promise<AuthFormState> {
  const user = await requireUser();
  if (!user.verified) await sendVerificationEmail(user);
  return { ok: true };
}

export async function stopAlertAction(form: FormData) {
  const user = await requireUser();
  await stopAlert(user, text(form, "id"));
  revalidatePath("/account");
}

export async function stopLaunchAction(form: FormData) {
  const user = await requireUser();
  await stopLaunchEmail(user, text(form, "id"));
  revalidatePath("/account");
}
