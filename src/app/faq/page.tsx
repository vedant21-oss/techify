import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: "FAQ",
  description: "How Techify's scores are worked out, where prices come from, how price alerts work and what happens to your email.",
};

export default async function FaqPage() {
  const t = MESSAGES[await getLang()];
  return (
    <div className="pb-20">
      <PageHero id="faq-title" lines={t.faq.lines} lede={t.faq.lede} />
      <div className="mx-auto max-w-3xl px-(--gutter) pt-12">
        <dl className="border-t-[3px] border-ink">
          {t.faq.items.map((item) => (
            <div key={item.q} className="border-b border-ink py-7">
              <dt className="font-heading text-3xl font-black uppercase leading-tight">{item.q}</dt>
              <dd className="mt-3 max-w-[62ch] leading-relaxed text-ink-soft">{item.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 flex flex-wrap items-center gap-3">
          <span className="font-heading text-2xl font-black uppercase">{t.faq.stillStuck}</span>
          <Link href="/contact" className="border-[3px] border-ink bg-pink px-4 py-2 label-mono text-ink-deep shadow-hard hover:-translate-y-0.5">
            {t.faq.contact}
          </Link>
        </p>
      </div>
    </div>
  );
}
