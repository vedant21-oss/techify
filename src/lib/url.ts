import type { RecommendationParams } from "@/lib/query";

export const MAX_COMPARE = 3;

export function toSearchParams(params: Partial<RecommendationParams> & { slugs?: string[] }): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return search.toString();
}

export function categoryPath(category: "laptop" | "phone"): "/laptops" | "/phones" {
  return category === "laptop" ? "/laptops" : "/phones";
}

/** The finder URL for a category, keeping use case, budget and sort in the query. */
export function finderHref(params: { category: "laptop" | "phone"; useCase?: string; budget?: number; sort?: string }): string {
  const { category, ...rest } = params;
  const qs = toSearchParams(rest as Partial<RecommendationParams>);
  return qs ? `${categoryPath(category)}?${qs}` : categoryPath(category);
}
