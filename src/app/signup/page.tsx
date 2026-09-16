import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/auth-forms";
import { safeNextPath } from "@/lib/features/auth-rules";
import { getMessages } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  const t = await getMessages();
  return (
    <AuthShell
      id="signup-title"
      lines={t.auth.signupLines}
      lede={t.auth.signupLede}
      footer={
        <p>
          {t.auth.haveAccount}{" "}
          <Link href={`/login?${new URLSearchParams({ next })}`} className="font-medium underline decoration-pink decoration-2 underline-offset-4">
            {t.auth.login}
          </Link>
        </p>
      }
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
