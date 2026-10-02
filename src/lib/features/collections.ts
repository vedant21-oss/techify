import type { Category, UseCase } from "@/lib/engine";

/**
 * Ready-made shortlists: the questions people actually type into a search box
 * ("best phones under 20000"). Each one is a saved finder query, so the list is
 * produced by the same scoring engine and stays current as prices change.
 */
export interface Collection {
  /** URL segment under /best. */
  slug: string;
  category: Category;
  useCase: UseCase;
  budget: number;
  /** Hard requirements applied before ranking, from features/must-haves. */
  mustHaves?: string[];
}

export const COLLECTION_SIZE = 8;

export const COLLECTIONS: Collection[] = [
  // Phones
  { slug: "phones-under-15000", category: "phone", useCase: "budget", budget: 15_000 },
  { slug: "phones-under-20000", category: "phone", useCase: "all-rounder", budget: 20_000 },
  { slug: "phones-under-30000", category: "phone", useCase: "all-rounder", budget: 30_000 },
  { slug: "phones-under-50000", category: "phone", useCase: "all-rounder", budget: 50_000 },
  { slug: "camera-phones-under-30000", category: "phone", useCase: "photography", budget: 30_000 },
  { slug: "camera-phones-under-60000", category: "phone", useCase: "photography", budget: 60_000 },
  { slug: "gaming-phones-under-30000", category: "phone", useCase: "gaming", budget: 30_000 },
  { slug: "battery-phones-under-20000", category: "phone", useCase: "battery", budget: 20_000, mustHaves: ["battery6000"] },
  { slug: "flagship-phones", category: "phone", useCase: "all-rounder", budget: 180_000 },
  // Laptops
  { slug: "laptops-under-40000", category: "laptop", useCase: "student", budget: 40_000 },
  { slug: "laptops-under-60000", category: "laptop", useCase: "all-rounder", budget: 60_000 },
  { slug: "laptops-under-80000", category: "laptop", useCase: "all-rounder", budget: 80_000 },
  { slug: "gaming-laptops-under-90000", category: "laptop", useCase: "gaming", budget: 90_000 },
  { slug: "gaming-laptops-under-150000", category: "laptop", useCase: "gaming", budget: 150_000 },
  { slug: "laptops-for-coding-under-100000", category: "laptop", useCase: "coding", budget: 100_000 },
  { slug: "editing-laptops-under-150000", category: "laptop", useCase: "video-editing", budget: 150_000 },
  { slug: "light-laptops-under-100000", category: "laptop", useCase: "student", budget: 100_000, mustHaves: ["light"] },
];

export function findCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function collectionsFor(category: Category): Collection[] {
  return COLLECTIONS.filter((c) => c.category === category);
}

/** Other lists worth a look from one list: same category, nearest budgets first. */
export function relatedCollections(collection: Collection, limit = 4): Collection[] {
  return collectionsFor(collection.category)
    .filter((c) => c.slug !== collection.slug)
    .sort((a, b) => Math.abs(a.budget - collection.budget) - Math.abs(b.budget - collection.budget))
    .slice(0, limit);
}

/** A brand's own page lives at /brand/<slug>. */
export function brandSlug(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
