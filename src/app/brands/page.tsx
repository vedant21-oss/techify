import { ArrowRight, Laptop, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { getBrands } from "@/lib/recommendations";

export const metadata: Metadata = {
  title: "Brands",
  description: "Every laptop and phone brand Techify tracks in India, with how many devices and the price range for each.",
};

export default async function BrandsPage() {
  const [lang, brands] = await Promise.all([getLang(), getBrands()]);
  const t = MESSAGES[lang];

  return (
    <div className="pb-20">
      <PageHero id="brands-title" lines={t.brands.hubLines} lede={t.brands.hubLede} />
      <div className="mx-auto max-w-6xl px-(--gutter) pt-12">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <li key={brand.slug}>
              <Link
                href={`/brand/${brand.slug}`}
                className="flex h-full flex-col gap-3 border-[3px] border-ink bg-paper p-5 transition-[transform,box-shadow] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--pink)]"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-heading text-3xl font-black uppercase leading-none">{brand.brand}</span>
                  <span className="flex shrink-0 gap-1.5 text-ink-soft">
                    {brand.laptops > 0 && <Laptop className="size-4" aria-hidden />}
                    {brand.phones > 0 && <Smartphone className="size-4" aria-hidden />}
                  </span>
                </span>
                <span className="label-mono text-ink-soft">{t.brands.counts(brand.laptops, brand.phones)}</span>
                <span className="mt-auto flex items-center justify-between gap-3 text-sm">
                  {t.brands.range(brand.minPrice, brand.maxPrice)}
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
