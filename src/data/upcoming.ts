import type { Category } from "@/lib/engine";

export interface SeedUpcoming {
  slug: string;
  category: Category;
  brand: string;
  name: string;
  expectedPrice: number | null;
  expectedLaunch: string;
  summary: string;
  sourceUrl: string | null;
}

/* Announced or expected launches, checked on 14 Sep 2026. Add more from /admin. */
export const upcoming: SeedUpcoming[] = [
  {
    slug: "apple-iphone-duo",
    category: "phone",
    brand: "Apple",
    name: "iPhone Duo",
    expectedPrice: 299900,
    expectedLaunch: "October 2026",
    summary: "Apple's first foldable iPhone, announced at the September 9 event. Indian pricing starts at ₹2,99,900.",
    sourceUrl:
      "https://www.brut.media/in/articles/science-technology/technology/apple-iphone-duo-starts-at-rs-2-99-lakh-iphone-18-pro-watches-and-airpods-full-india-price-list",
  },
];
