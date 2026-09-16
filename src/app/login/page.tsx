import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { safeNextPath } from "@/lib/features/auth-rules";
import { getMessages } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  const t = await getMessages();
  return (
    <AuthShell
      id="login-title"
      lines={t.auth.loginLines}
      lede={t.auth.loginLede}
      footer={
        <p>
          {t.auth.noAccount}{" "}
          <Link href={`/signup?${new URLSearchParams({ next })}`} className="font-medium underline decoration-pink decoration-2 underline-offset-4">
            {t.auth.signup}
          </Link>
        </p>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
