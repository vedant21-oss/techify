import { FACTORS } from "./factors";
import type { Category, FactorKey, UseCaseProfile } from "./types";

export type WeightMap = Partial<Record<FactorKey, number>>;

/** Largest number of points a single factor can be given in the URL/UI. */
export const MAX_WEIGHT_POINTS = 100;

/**
 * Turns relative importance points (any scale) into weights that sum to 1,
 * dropping factors the category doesn't have and anything at zero.
 */
export function normalizeWeights(category: Category, points: WeightMap): WeightMap {
  const valid = (Object.entries(points) as [FactorKey, number][]).filter(
    ([key, value]) => FACTORS[category][key] && Number.isFinite(value) && value > 0,
  );
  const total = valid.reduce((sum, [, value]) => sum + value, 0);
  if (total <= 0) return {};
  return Object.fromEntries(valid.map(([key, value]) => [key, value / total]));
}

/**
 * A use-case profile with the viewer's own weights. The base profile's baselines
 * stay, so a "gaming, but I care about battery" mix still expects a real GPU.
 */
export function withCustomWeights(base: UseCaseProfile, points: WeightMap): UseCaseProfile {
  const weights = normalizeWeights(base.category, points);
  if (Object.keys(weights).length === 0) return base;
  return { ...base, weights, custom: true };
}

/** Compact URL form: `gpu.40,cpu.25,battery.10`. Points are whole numbers 1–100. */
export function encodeWeights(points: WeightMap): string {
  return (Object.entries(points) as [FactorKey, number][])
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${key}.${Math.round(Math.min(MAX_WEIGHT_POINTS, value))}`)
    .join(",");
}

export function decodeWeights(category: Category, encoded: string | undefined | null): WeightMap | null {
  if (!encoded) return null;
  const points: WeightMap = {};
  for (const part of encoded.split(",")) {
    const [key, raw] = part.split(".");
    const value = Number(raw);
    if (!FACTORS[category][key as FactorKey]) continue;
    if (!Number.isInteger(value) || value < 0 || value > MAX_WEIGHT_POINTS) continue;
    if (value > 0) points[key as FactorKey] = value;
  }
  return Object.keys(points).length ? points : null;
}

/** Profile weights (fractions) as whole points, for pre-filling sliders. */
export function weightsToPoints(weights: WeightMap): WeightMap {
  return Object.fromEntries(
    (Object.entries(weights) as [FactorKey, number][]).map(([key, value]) => [key, Math.round(value * 100)]),
  );
}
