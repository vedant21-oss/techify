import { Search } from "lucide-react";
import Link from "next/link";
import { HomeLink } from "@/components/home-link";
import { LanguageToggle } from "@/components/lang-provider";
import { SavedNavLink } from "@/components/saved-controls";
import { getMessages } from "@/lib/i18n/server";

export function RegisterMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true" className={className}>
      <circle cx="13" cy="13" r="8" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M13 0v26M0 13h26" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="13" cy="13" r="3.2" fill="var(--pink)" />
    </svg>
  );
}

const cell = "flex shrink-0 items-center border-l-[3px] border-ink px-4 label-mono transition-colors hover:bg-ink hover:text-paper lg:px-5";
const mobileLink = "shrink-0 border-r border-ink px-4 py-2.5 label-mono hover:bg-pink-tint";

export async function SiteHeader() {
  const t = await getMessages();
  const links = [
    { href: "/laptops", label: t.nav.laptops },
    { href: "/phones", label: t.nav.phones },
    { href: "/quiz", label: t.nav.quiz },
  ];
  const exploreLinks = [
    { href: "/picks", label: t.nav.picksOfWeek },
    { href: "/deals", label: t.nav.priceDrops },
    { href: "/upcoming", label: t.nav.upcomingLaunches },
    { href: "/how-it-works", label: t.nav.howScoringWorks },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex h-14 max-w-6xl items-stretch justify-between px-(--gutter)">
        <HomeLink aria-label={t.nav.homeAria} className="flex items-center gap-2.5 pr-4">
          <RegisterMark className="size-6" />
          <span className="font-heading text-2xl font-black uppercase tracking-wide">Techify</span>
        </HomeLink>

        <div className="flex items-stretch">
          <nav aria-label={t.nav.main} className="hidden items-stretch md:flex">
            <HomeLink className={cell}>{t.nav.home}</HomeLink>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cell}>
                {l.label}
              </Link>
            ))}
            <details className="group relative flex">
              <summary className={`${cell} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>{t.nav.more}</summary>
              <div className="absolute top-full right-0 z-50 mt-[3px] w-56 border-[3px] border-ink bg-paper shadow-hard">
                {exploreLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="block border-b border-ink px-4 py-3 text-sm last:border-b-0 hover:bg-pink-tint">
                    {l.label}
                  </Link>
                ))}
              </div>
            </details>
            <SavedNavLink className={cell} />
            <LanguageToggle className={cell} />
          </nav>

          <form action="/search" role="search" className="hidden items-stretch border-l-[3px] border-ink lg:flex">
            <label htmlFor="header-search" className="sr-only">
              {t.nav.searchModels}
            </label>
            <input
              id="header-search"
              name="q"
              type="search"
              placeholder={t.nav.searchModels}
              className="w-40 bg-transparent px-4 text-sm outline-none placeholder:text-ink-soft focus:bg-pink-tint xl:w-52"
            />
            <button type="submit" aria-label={t.nav.search} className="px-3 hover:bg-ink hover:text-paper">
              <Search className="size-4" />
            </button>
          </form>
          <LanguageToggle className={`${cell} md:hidden`} />
          <Link href="/search" aria-label={t.nav.searchModels} className={`${cell} lg:hidden`}>
            <Search className="size-4" />
          </Link>

          <Link href="/pro" className="flex items-center border-l-[3px] border-ink bg-pink px-4 label-mono text-ink-deep hover:bg-ink hover:text-paper lg:px-5">
            {t.nav.pro}
          </Link>
        </div>
      </div>

      <nav aria-label={t.nav.main} className="flex overflow-x-auto border-t border-ink md:hidden">
        <HomeLink className={mobileLink}>{t.nav.home}</HomeLink>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={mobileLink}>
            {l.label}
          </Link>
        ))}
        <SavedNavLink className={mobileLink} />
        {exploreLinks.map((l) => (
          <Link key={l.href} href={l.href} className={mobileLink}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
