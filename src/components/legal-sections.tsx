import { LOCALE, type Lang } from "@/lib/i18n/config";
import { MESSAGES } from "@/lib/i18n/messages";

/** Privacy and terms share one layout: dated, numbered plain-language sections. */
export const LEGAL_UPDATED = "2026-09-25";

export function LegalSections({ lang, sections }: { lang: Lang; sections: { title: string; body: string }[] }) {
  const updated = new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(LEGAL_UPDATED),
  );
  return (
    <div className="mx-auto max-w-3xl px-(--gutter) pt-12">
      <p className="label-mono text-ink-soft">{MESSAGES[lang].legal.updated(updated)}</p>
      <div className="mt-8 flex flex-col gap-10">
        {sections.map((section, i) => (
          <section key={section.title} aria-labelledby={`legal-${i}`}>
            <h2 id={`legal-${i}`} className="flex items-baseline gap-3 text-4xl">
              <span aria-hidden className="font-mono text-lg text-pink tabular">
                {String(i + 1).padStart(2, "0")}
              </span>
              {section.title}
            </h2>
            <p className="mt-3 max-w-[62ch] leading-relaxed text-ink-soft">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
