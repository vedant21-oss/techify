import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { formatBudgetShort } from "@/lib/engine";
import { BUDGET_RANGES } from "@/lib/catalog-config";
import { COLLECTIONS, collectionsFor } from "@/lib/features/collections";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: "Best laptop and phone lists",
  description: "Ready-made shortlists by budget and use: best phones under ₹20,000, gaming laptops under ₹80,000 and more, scored by Techify.",
};

export default async function BestHubPage() {
  const lang = await getLang();
  const t = MESSAGES[lang];

  return (
    <div className="pb-20">
      <PageHero id="best-title" lines={t.best.hubLines} lede={t.best.hubLede} />
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-(--gutter) pt-12">
        {(["phone", "laptop"] as const).map((category) => (
          <section key={category} aria-labelledby={`best-${category}`}>
            <h2 id={`best-${category}`} className="border-b-[3px] border-ink pb-5 text-5xl sm:text-6xl">
              {category === "phone" ? t.nav.phones : t.nav.laptops}
            </h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {collectionsFor(category).map((c) => {
                const capped = c.budget < BUDGET_RANGES[category].max;
                const kind = t.best.kinds[`${c.category}:${c.useCase}`];
                return (
                  <li key={c.slug}>
                    <Link
                      href={`/best/${c.slug}`}
                      className="flex h-full flex-col justify-between gap-6 border-[3px] border-ink bg-paper p-5 transition-[transform,box-shadow] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--pink)]"
                    >
                      <span className="font-heading text-3xl font-black uppercase leading-none">
                        {t.best.title(kind, capped ? c.budget : null)}
                      </span>
                      <span className="flex items-center justify-between gap-3 label-mono text-ink-soft">
                        {capped ? formatBudgetShort(c.budget) : t.best.flagship}
                        <ArrowRight className="size-4 text-ink" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <p className="text-sm text-ink-soft">{COLLECTIONS.length} lists · {t.best.hubLede}</p>
      </div>
    </div>
  );
}
