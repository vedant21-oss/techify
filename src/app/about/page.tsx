import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: "About",
  description: "Why Techify exists, where its numbers come from, and how it makes money without letting brands buy a ranking.",
};

export default async function AboutPage() {
  const t = MESSAGES[await getLang()];
  return (
    <div className="pb-20">
      <PageHero id="about-title" lines={t.about.lines} lede={t.about.lede} />
      <div className="mx-auto max-w-6xl px-(--gutter) pt-14">
        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
          {t.about.sections.map((section, i) => (
            <section key={section.title} aria-labelledby={`about-${i}`} className="min-w-0">
              <span aria-hidden className="grid size-10 place-items-center border-[3px] border-ink bg-pink font-heading text-xl font-black text-ink-deep">
                {i + 1}
              </span>
              <h2 id={`about-${i}`} className="mt-5 text-4xl">
                {section.title}
              </h2>
              <p className="mt-4 max-w-[58ch] leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-16 flex flex-wrap gap-4 border-t-[3px] border-ink pt-8">
          <Link href="/how-it-works" className="flex items-center gap-2 border-[3px] border-ink bg-ink px-5 py-3 label-mono text-paper shadow-hard hover:bg-pink hover:text-ink-deep">
            {t.about.cta} <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/contact" className="flex items-center gap-2 border-[3px] border-ink bg-paper px-5 py-3 label-mono shadow-hard hover:-translate-y-0.5">
            {t.about.contactCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
