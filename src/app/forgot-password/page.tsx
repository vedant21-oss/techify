import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { getMessages } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ForgotPasswordPage() {
  const t = await getMessages();
  return (
    <AuthShell
      id="forgot-title"
      lines={t.auth.forgotLines}
      lede={t.auth.forgotLede}
      footer={
        <Link href="/login" className="font-medium underline decoration-pink decoration-2 underline-offset-4">
          {t.auth.backToLogin}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
