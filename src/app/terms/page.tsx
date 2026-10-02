import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { LegalSections } from "@/components/legal-sections";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: "Terms",
  description: "Techify is information, not advice: how to treat its prices and specs, store links, accounts and Pro payments.",
};

export default async function TermsPage() {
  const lang = await getLang();
  const t = MESSAGES[lang];
  return (
    <div className="pb-20">
      <PageHero id="terms-title" lines={t.legal.termsLines} lede={t.legal.termsLede} />
      <LegalSections lang={lang} sections={t.legal.terms} />
    </div>
  );
}
