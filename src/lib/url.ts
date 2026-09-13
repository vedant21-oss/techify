import { encodeWeights } from "@/lib/engine";
import type { RecommendationParams } from "@/lib/query";

export const MAX_COMPARE = 3;

/** Serialises finder state; custom weights become `w` and must-haves `must`. */
export function toSearchParams(params: Partial<RecommendationParams> & { slugs?: string[] }): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (key === "weights") {
      const encoded = encodeWeights(value as NonNullable<RecommendationParams["weights"]>);
      if (encoded) search.set("w", encoded);
    } else if (key === "mustHaves") {
      if ((value as string[]).length) search.set("must", (value as string[]).join(","));
    } else {
      search.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
  }
  return search.toString();
}

export function categoryPath(category: "laptop" | "phone"): "/laptops" | "/phones" {
  return category === "laptop" ? "/laptops" : "/phones";
}

/** The finder URL for a category, keeping use case, budget and sort in the query. */
export function finderHref(params: {
  category: "laptop" | "phone";
  useCase?: string;
  budget?: number;
  sort?: string;
  weights?: RecommendationParams["weights"];
  mustHaves?: string[];
}): string {
  const { category, ...rest } = params;
  const qs = toSearchParams(rest as Partial<RecommendationParams>);
  return qs ? `${categoryPath(category)}?${qs}` : categoryPath(category);
}

/** Canonical head-to-head URL; slugs are ordered so both directions share one page. */
export function versusHref(a: string, b: string): string {
  const [first, second] = [a, b].sort();
  return `/vs/${first}-vs-${second}`;
}

export function parseVersusPair(pair: string): [string, string] | null {
  const parts = pair.split("-vs-");
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : null;
}
