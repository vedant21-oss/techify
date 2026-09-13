import { z } from "zod";
import { BUDGET_RANGES, DEFAULT_USE_CASE, isUseCaseFor } from "@/lib/catalog-config";
import type { Category, SortMode, UseCase } from "@/lib/engine";
import { MAX_COMPARE } from "@/lib/url";

const category = z.enum(["laptop", "phone"]);
const sort = z.enum(["match", "value"]);
const budget = z.coerce.number().int().positive().max(1_000_000);

export interface RecommendationParams {
  category: Category;
  useCase: UseCase;
  budget: number;
  sort: SortMode;
}

/** Strict parser for the recommend API: every field required except sort. */
export const recommendationSchema = z
  .object({ category, useCase: z.string(), budget, sort: sort.default("match") })
  .refine((q) => isUseCaseFor(q.category, q.useCase), {
    message: "useCase is not valid for this category",
    path: ["useCase"],
  })
  .transform((q) => q as RecommendationParams);

/** Optional scoring context for detail and compare lookups. */
export const contextSchema = z.object({
  useCase: z.string().optional(),
  budget: budget.optional(),
});

export const compareSchema = contextSchema.extend({
  slugs: z
    .string()
    .transform((s) => [...new Set(s.split(",").map((x) => x.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(120)).min(1).max(MAX_COMPARE)),
});

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Lenient parser for page URLs: falls back to sensible defaults instead of
 * erroring, so a hand-edited or stale link still renders something useful.
 */
export function parseFinderParams(params: SearchParams, fixedCategory?: Category): RecommendationParams {
  const cat = fixedCategory ?? category.safeParse(first(params.category)).data ?? "laptop";
  const range = BUDGET_RANGES[cat];
  const rawBudget = budget.safeParse(first(params.budget)).data;
  const useCase = first(params.useCase);
  return {
    category: cat,
    useCase: useCase && isUseCaseFor(cat, useCase) ? useCase : DEFAULT_USE_CASE[cat],
    budget: rawBudget ? Math.min(range.max, Math.max(range.min, rawBudget)) : range.default,
    sort: sort.safeParse(first(params.sort)).data ?? "match",
  };
}

export function zodMessage(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "query"}: ${i.message}`).join("; ");
}
