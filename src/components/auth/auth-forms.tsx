"use client";

import { Check, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useState } from "react";
import {
  changePasswordAction,
  forgotPasswordAction,
  loginAction,
  resendVerificationAction,
  resetPasswordAction,
  signupAction,
  type AuthFormState,
} from "@/app/auth-actions";
import { useMessages } from "@/components/lang-provider";
import { MIN_PASSWORD_LENGTH } from "@/lib/features/auth-rules";

const field = "mt-2 w-full border-[3px] border-ink bg-paper px-3 py-2.5 text-base outline-none placeholder:text-ink-soft focus:bg-pink-tint";
const submit =
  "flex w-full items-center justify-center gap-2 border-t-[3px] border-ink bg-ink px-5 py-4 font-heading text-2xl font-black uppercase text-paper transition-colors hover:bg-pink hover:text-ink-deep disabled:opacity-70";

function ErrorNote({ state }: { state: AuthFormState }) {
  const t = useMessages();
  if (!state?.error) return null;
  return (
    <p role="alert" className="border-[3px] border-ink bg-pink-tint px-3 py-2.5 text-sm font-medium text-ink-deep">
      {t.auth.errors[state.error] ?? t.auth.errors.wrong_credentials}
    </p>
  );
}

function Field({ label, children, hint }: { label: React.ReactNode; children: (id: string) => React.ReactNode; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label-mono">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function PasswordInput({ id, name, autoComplete, describedBy }: { id: string; name: string; autoComplete: string; describedBy?: string }) {
  const t = useMessages();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required
        minLength={autoComplete === "new-password" ? MIN_PASSWORD_LENGTH : undefined}
        maxLength={200}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        className={`${field} pr-24`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        className="absolute top-2 right-1 flex h-[calc(100%-0.5rem)] items-center gap-1.5 px-3 label-mono hover:bg-pink-tint"
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        {visible ? t.auth.hide : t.auth.show}
      </button>
    </div>
  );
}

export function LoginForm({ next }: { next: string }) {
  const t = useMessages();
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action}>
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <input type="hidden" name="next" value={next} />
        <Field label={t.auth.email}>
          {(id) => (
            <input id={id} name="email" type="email" required autoComplete="email" defaultValue={state?.email} placeholder="you@example.com" className={field} />
          )}
        </Field>
        <Field
          label={
            <span className="flex items-baseline justify-between gap-3">
              {t.auth.password}
              <Link href="/forgot-password" className="normal-case tracking-normal underline underline-offset-4 hover:bg-pink-tint">
                {t.auth.forgot}
              </Link>
            </span>
          }
        >
          {(id) => <PasswordInput id={id} name="password" autoComplete="current-password" />}
        </Field>
        <ErrorNote state={state} />
      </div>
      <button type="submit" disabled={pending} className={submit}>
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {pending ? t.auth.loggingIn : t.auth.login}
      </button>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const t = useMessages();
  const [state, action, pending] = useActionState(signupAction, null);
  const hintId = useId();
  return (
    <form action={action}>
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <input type="hidden" name="next" value={next} />
        <Field label={t.auth.name}>
          {(id) => <input id={id} name="name" required minLength={2} maxLength={60} autoComplete="name" defaultValue={state?.name} className={field} />}
        </Field>
        <Field label={t.auth.email}>
          {(id) => (
            <input id={id} name="email" type="email" required autoComplete="email" defaultValue={state?.email} placeholder="you@example.com" className={field} />
          )}
        </Field>
        <Field label={t.auth.password}>
          {(id) => (
            <>
              <PasswordInput id={id} name="password" autoComplete="new-password" describedBy={hintId} />
              <p id={hintId} className="mt-1.5 text-xs text-ink-soft">
                {t.auth.passwordHint(MIN_PASSWORD_LENGTH)}
              </p>
            </>
          )}
        </Field>
        <ErrorNote state={state} />
        <p className="text-xs text-ink-soft">{t.auth.terms}</p>
      </div>
      <button type="submit" disabled={pending} className={submit}>
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {pending ? t.auth.creating : t.auth.signup}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useMessages();
  const [state, action, pending] = useActionState(forgotPasswordAction, null);
  const typed = state?.error ? state.email : undefined;
  if (state?.ok && state.email) {
    return (
      <div role="status" className="flex flex-col gap-4 p-6 sm:p-7">
        <MailCheck className="size-8 text-pink" aria-hidden />
        <p className="leading-relaxed">{t.auth.forgotSent(state.email)}</p>
        <Link href="/login" className="label-mono underline underline-offset-4 hover:bg-pink-tint">
          {t.auth.backToLogin}
        </Link>
      </div>
    );
  }
  return (
    <form action={action}>
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <Field label={t.auth.email}>
          {(id) => (
            <input id={id} name="email" type="email" required autoComplete="email" defaultValue={typed} placeholder="you@example.com" className={field} />
          )}
        </Field>
        <ErrorNote state={state} />
      </div>
      <button type="submit" disabled={pending} className={submit}>
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {pending ? t.auth.sending : t.auth.sendLink}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useMessages();
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  return (
    <form action={action}>
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <input type="hidden" name="token" value={token} />
        <Field label={t.auth.newPassword} hint={t.auth.passwordHint(MIN_PASSWORD_LENGTH)}>
          {(id) => <PasswordInput id={id} name="password" autoComplete="new-password" />}
        </Field>
        <ErrorNote state={state} />
        {state?.error === "reset_invalid" && (
          <Link href="/forgot-password" className="label-mono underline underline-offset-4 hover:bg-pink-tint">
            {t.auth.sendLink}
          </Link>
        )}
      </div>
      <button type="submit" disabled={pending} className={submit}>
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {pending ? t.auth.saving : t.auth.savePassword}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const t = useMessages();
  const [state, action, pending] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label={t.auth.currentPassword}>{(id) => <PasswordInput id={id} name="current" autoComplete="current-password" />}</Field>
      <Field label={t.auth.newPassword} hint={t.auth.passwordHint(MIN_PASSWORD_LENGTH)}>
        {(id) => <PasswordInput id={id} name="password" autoComplete="new-password" />}
      </Field>
      <ErrorNote state={state} />
      {state?.ok && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium">
          <Check className="size-4" aria-hidden /> {t.account.passwordChanged}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 self-start border-[3px] border-ink bg-ink px-5 py-2.5 label-mono text-paper hover:bg-pink hover:text-ink-deep disabled:opacity-70"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? t.auth.saving : t.account.changePassword}
      </button>
    </form>
  );
}

export function ResendVerificationButton() {
  const t = useMessages();
  const [state, action, pending] = useActionState(resendVerificationAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending || Boolean(state?.ok)}
        className="flex items-center gap-2 border-[3px] border-ink bg-paper px-4 py-2 label-mono shadow-hard hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t.account.resend}
      </button>
      {state?.ok && (
        <span role="status" className="text-sm">
          {t.account.resent}
        </span>
      )}
    </form>
  );
}
