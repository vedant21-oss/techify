import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { getCurrentUser } from "@/lib/server/auth";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Report a wrong price, a missing device or a bug, or send an idea for what Techify should do next.",
};

export default async function ContactPage() {
  const [lang, user] = await Promise.all([getLang(), getCurrentUser()]);
  const t = MESSAGES[lang];
  return (
    <div className="pb-20">
      <PageHero id="contact-title" lines={t.contact.lines} lede={t.contact.lede} />
      <div className="mx-auto grid max-w-6xl gap-12 px-(--gutter) pt-12 lg:grid-cols-[1fr_20rem]">
        <ContactForm name={user?.name ?? ""} email={user?.email ?? ""} />
        <aside className="border-[3px] border-ink bg-paper p-6 lg:self-start">
          <h2 className="text-3xl">{t.contact.faqFirst}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.contact.faqNote}</p>
          <Link href="/faq" className="mt-4 inline-block label-mono underline underline-offset-4 hover:bg-pink-tint">
            {t.contact.readFaq}
          </Link>
        </aside>
      </div>
    </div>
  );
}
