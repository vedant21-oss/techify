import { CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getMessages } from "@/lib/i18n/server";
import { verifyEmail } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Confirm email", robots: { index: false }, referrer: "no-referrer" };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const [ok, t] = await Promise.all([token ? verifyEmail(token) : false, getMessages()]);
  const Icon = ok ? CircleCheck : CircleX;
  return (
    <div className="mx-auto max-w-2xl px-(--gutter) py-24 text-center">
      <Icon className="mx-auto size-14 text-pink" aria-hidden />
      <h1 className="mt-6 text-6xl sm:text-7xl">{ok ? t.auth.verifyOk : t.auth.verifyBad}</h1>
      <p className="mx-auto mt-5 max-w-[48ch] text-lg text-ink-soft">{ok ? t.auth.verifyOkNote : t.auth.verifyBadNote}</p>
      <Link href="/account" className="mt-8 inline-block border-[3px] border-ink bg-pink px-5 py-3 label-mono text-ink-deep shadow-hard">
        {t.auth.goToAccount}
      </Link>
    </div>
  );
}
