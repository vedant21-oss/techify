import Link from "next/link";
import { HomeLink } from "@/components/home-link";

const footerLinks = [
  { href: "/laptops", label: "Laptops" },
  { href: "/phones", label: "Phones" },
  { href: "/picks", label: "Picks" },
  { href: "/saved", label: "Saved" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pro", label: "Techify Pro" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto overflow-hidden border-t-[3px] border-ink">
      <div className="mx-auto max-w-6xl px-(--gutter)">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 pt-8 label-mono">
          <HomeLink className="hover:bg-pink-tint">Home</HomeLink>
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
            Prices are approximate Indian street prices and change often. Check the store before you buy.
          </p>
          <p className="label-mono sm:text-right">Store links are plain searches, not affiliate links.</p>
        </div>
      </div>
    </footer>
  );
}
