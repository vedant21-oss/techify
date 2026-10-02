import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { LegalSections } from "@/components/legal-sections";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Techify stores, what stays in your browser, who else sees it, and how to have your data removed.",
};

export default async function PrivacyPage() {
  const lang = await getLang();
  const t = MESSAGES[lang];
  return (
    <div className="pb-20">
      <PageHero id="privacy-title" lines={t.legal.privacyLines} lede={t.legal.privacyLede} />
      <LegalSections lang={lang} sections={t.legal.privacy} />
    </div>
  );
}
