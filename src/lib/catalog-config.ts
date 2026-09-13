import { PROFILES, type Category, type UseCase } from "@/lib/engine";

export const CATEGORIES: { id: Category; label: string; plural: string }[] = [
  { id: "laptop", label: "Laptop", plural: "Laptops" },
  { id: "phone", label: "Phone", plural: "Phones" },
];

export const BUDGET_RANGES: Record<Category, { min: number; max: number; step: number; default: number }> = {
  laptop: { min: 25_000, max: 300_000, step: 5_000, default: 80_000 },
  phone: { min: 7_000, max: 180_000, step: 1_000, default: 30_000 },
};

export const DEFAULT_USE_CASE: Record<Category, UseCase> = {
  laptop: "all-rounder",
  phone: "all-rounder",
};

export function isUseCaseFor(category: Category, useCase: string): useCase is UseCase {
  return PROFILES[category].some((p) => p.id === useCase);
}
