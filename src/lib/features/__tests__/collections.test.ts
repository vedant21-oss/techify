import { describe, expect, it } from "vitest";
import { BUDGET_RANGES, isUseCaseFor } from "@/lib/catalog-config";
import { MESSAGES } from "@/lib/i18n/messages";
import { brandSlug, COLLECTIONS, collectionsFor, findCollection, relatedCollections } from "../collections";
import { MUST_HAVES } from "../must-haves";

describe("collections", () => {
  it("have unique slugs that read as URLs", () => {
    const slugs = COLLECTIONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("use a use case and budget its category actually supports", () => {
    for (const c of COLLECTIONS) {
      expect(isUseCaseFor(c.category, c.useCase), c.slug).toBe(true);
      const range = BUDGET_RANGES[c.category];
      expect(c.budget, c.slug).toBeGreaterThanOrEqual(range.min);
      expect(c.budget, c.slug).toBeLessThanOrEqual(range.max);
    }
  });

  it("only ask for must-haves that exist for that category", () => {
    for (const c of COLLECTIONS) {
      for (const id of c.mustHaves ?? []) {
        expect(MUST_HAVES.some((m) => m.id === id && m.category === c.category), `${c.slug}: ${id}`).toBe(true);
      }
    }
  });

  it("name every list in both languages", () => {
    for (const c of COLLECTIONS) {
      for (const lang of ["en", "hi"] as const) {
        expect(MESSAGES[lang].best.kinds[`${c.category}:${c.useCase}`], `${lang} ${c.slug}`).toBeTruthy();
      }
    }
  });

  it("finds a list by slug and ignores unknown ones", () => {
    expect(findCollection("phones-under-20000")?.budget).toBe(20_000);
    expect(findCollection("phones-under-1")).toBeUndefined();
  });

  it("suggests related lists from the same category, nearest budget first", () => {
    const collection = findCollection("laptops-under-60000")!;
    const related = relatedCollections(collection, 3);
    expect(related).toHaveLength(3);
    expect(related.every((c) => c.category === "laptop")).toBe(true);
    expect(related.some((c) => c.slug === collection.slug)).toBe(false);
    const gaps = related.map((c) => Math.abs(c.budget - collection.budget));
    expect([...gaps].sort((a, b) => a - b)).toEqual(gaps);
  });

  it("splits lists by category", () => {
    expect(collectionsFor("phone").every((c) => c.category === "phone")).toBe(true);
    expect(collectionsFor("phone").length + collectionsFor("laptop").length).toBe(COLLECTIONS.length);
  });
});

describe("brandSlug", () => {
  it("makes a URL-safe slug and keeps brands apart", () => {
    expect(brandSlug("Samsung")).toBe("samsung");
    expect(brandSlug("OnePlus")).toBe("oneplus");
    expect(brandSlug("Xiaomi ")).toBe("xiaomi");
    expect(brandSlug("realme")).toBe("realme");
    expect(brandSlug("Nothing+")).toBe("nothing-plus");
    expect(brandSlug("HP")).not.toBe(brandSlug("HPE"));
  });
});
