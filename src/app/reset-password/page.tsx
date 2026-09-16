import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { getMessages } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const t = await getMessages();
  return (
    <AuthShell id="reset-title" lines={t.auth.resetLines} lede={t.auth.resetLede}>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-4 p-6 sm:p-7">
          <p role="alert">{t.auth.missingToken}</p>
          <Link href="/forgot-password" className="label-mono underline underline-offset-4">
            {t.auth.sendLink}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
