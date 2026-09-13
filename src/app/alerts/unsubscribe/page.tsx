import type { Metadata } from "next";
import Link from "next/link";
import { unsubscribeAlert } from "@/lib/server/alerts";

export const metadata: Metadata = { title: "Price alert stopped", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: PageProps<"/alerts/unsubscribe">) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const result = token ? await unsubscribeAlert(token) : null;

  return (
    <div className="mx-auto max-w-2xl px-(--gutter) py-28 text-center">
      <h1 className="text-6xl sm:text-7xl">{result ? "Alert stopped" : "Link already used"}</h1>
      <p className="mt-5 text-lg text-ink-soft">
        {result
          ? `You won't get price emails for the ${result.device} any more.`
          : "This alert was already stopped or has expired. There's nothing else to do."}
      </p>
      <Link href="/" className="mt-8 inline-block border-[3px] border-ink bg-pink px-5 py-3 label-mono text-ink-deep shadow-hard">
        Back to Techify
      </Link>
    </div>
  );
}
