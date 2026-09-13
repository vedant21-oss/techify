import { BUDGET_RANGES, DEFAULT_USE_CASE, isUseCaseFor } from "@/lib/catalog-config";
import type { ParsedQuery, ParseQueryResponse } from "./types";

export class UnclearCategoryError extends Error {
  constructor() {
    super('Say whether you want a laptop or a phone, for example "phone under 30k for photography".');
  }
}

/**
 * Merges a primary parse with a fallback parse field by field, then fills gaps with
 * finder defaults and clamps the budget to the slider range.
 */
export function resolveQuery(
  primary: ParsedQuery,
  fallback: ParsedQuery,
  source: ParseQueryResponse["source"],
): ParseQueryResponse {
  const category = primary.category ?? fallback.category;
  if (!category) throw new UnclearCategoryError();

  const candidateUseCase = [primary.useCase, fallback.useCase].find((u) => u && isUseCaseFor(category, u)) ?? null;
  const requestedBudget = primary.budget ?? fallback.budget;
  const range = BUDGET_RANGES[category];

  const assumed: ParseQueryResponse["assumed"] = [];
  if (!candidateUseCase) assumed.push("useCase");
  if (!requestedBudget) assumed.push("budget");

  const budget = requestedBudget
    ? Math.min(range.max, Math.max(range.min, Math.round(requestedBudget / range.step) * range.step))
    : range.default;

  return {
    category,
    useCase: candidateUseCase ?? DEFAULT_USE_CASE[category],
    budget,
    source,
    assumed,
    requestedBudget,
  };
}
