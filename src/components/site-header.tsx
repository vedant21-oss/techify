import { Search } from "lucide-react";
import Link from "next/link";
import { HomeLink } from "@/components/home-link";
import { SavedNavLink } from "@/components/saved-controls";

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

const links = [
  { href: "/laptops", label: "Laptops" },
  { href: "/phones", label: "Phones" },
  { href: "/picks", label: "Picks" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex h-14 max-w-6xl items-stretch justify-between px-(--gutter)">
        <HomeLink aria-label="Techify home" className="flex items-center gap-2.5 pr-4">
          <RegisterMark className="size-6" />
          <span className="font-heading text-2xl font-black uppercase tracking-wide">Techify</span>
        </HomeLink>

        <div className="flex items-stretch">
          <nav aria-label="Main" className="hidden items-stretch md:flex">
            <HomeLink className={cell}>Home</HomeLink>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cell}>
                {l.label}
              </Link>
            ))}
            <SavedNavLink className={cell} />
          </nav>

          <form action="/search" role="search" className="hidden items-stretch border-l-[3px] border-ink lg:flex">
            <label htmlFor="header-search" className="sr-only">
              Search models
            </label>
            <input
              id="header-search"
              name="q"
              type="search"
              placeholder="Search models"
              className="w-40 bg-transparent px-4 text-sm outline-none placeholder:text-ink-soft focus:bg-pink-tint xl:w-52"
            />
            <button type="submit" aria-label="Search" className="px-3 hover:bg-ink hover:text-paper">
              <Search className="size-4" />
            </button>
          </form>
          <Link href="/search" aria-label="Search models" className={`${cell} lg:hidden`}>
            <Search className="size-4" />
          </Link>

          <Link href="/pro" className="flex items-center border-l-[3px] border-ink bg-pink px-4 label-mono text-ink-deep hover:bg-ink hover:text-paper lg:px-5">
            Pro
          </Link>
        </div>
      </div>

      <nav aria-label="Main" className="flex overflow-x-auto border-t border-ink md:hidden">
        <HomeLink className={mobileLink}>Home</HomeLink>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={mobileLink}>
            {l.label}
          </Link>
        ))}
        <SavedNavLink className={mobileLink} />
        <Link href="/how-it-works" className={mobileLink}>
          How it works
        </Link>
      </nav>
    </header>
  );
}
