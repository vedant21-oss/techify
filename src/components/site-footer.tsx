import Link from "next/link";
import { HomeLink } from "@/components/home-link";
import { hasAffiliates } from "@/lib/buy-links";
import { getMessages } from "@/lib/i18n/server";

export async function SiteFooter() {
  const t = await getMessages();
  const footerLinks = [
    { href: "/laptops", label: t.nav.laptops },
    { href: "/phones", label: t.nav.phones },
    { href: "/quiz", label: t.nav.helpMeChoose },
    { href: "/picks", label: t.nav.picks },
    { href: "/deals", label: t.nav.priceDrops },
    { href: "/upcoming", label: t.nav.upcoming },
    { href: "/saved", label: t.nav.saved },
    { href: "/how-it-works", label: t.nav.howItWorks },
    { href: "/pro", label: t.nav.techifyPro },
  ];

  return (
    <footer className="mt-auto overflow-hidden border-t-[3px] border-ink">
      <div className="mx-auto max-w-6xl px-(--gutter)">
        <nav aria-label={t.nav.footer} className="flex flex-wrap gap-x-6 gap-y-2 pt-8 label-mono">
          <HomeLink className="hover:bg-pink-tint">{t.nav.home}</HomeLink>
          {footerLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:bg-pink-tint">
              {l.label}
            </Link>
          ))}
        </nav>
        <p
          aria-hidden="true"
          className="whitespace-nowrap pt-6 font-heading text-[clamp(4rem,19vw,13rem)] font-black uppercase leading-[0.8] text-transparent transition-colors [-webkit-text-stroke:2px_var(--ink)] hover:text-pink"
        >
          Techify
        </p>
        <div className="flex flex-col gap-3 border-t-[3px] border-ink py-6 text-sm sm:flex-row sm:justify-between sm:gap-10">
          <p className="max-w-[60ch]">
            {t.footer.prices}
          </p>
          <p className="label-mono sm:text-right">
            {hasAffiliates() ? t.footer.affiliate : t.footer.noAffiliate}
          </p>
        </div>
      </div>
    </footer>
  );
}
