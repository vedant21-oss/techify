import { explain } from "./explain";
import { getFactor } from "./factors";
import { requireProfile } from "./profiles";
import { relativeScaler } from "./scales";
import type {
  BaselinePenalty,
  Category,
  EngineDevice,
  FactorKey,
  FactorScore,
  ScoredDevice,
  ScoringContext,
  SortMode,
  UseCase,
  UseCaseProfile,
} from "./types";

/**
 * Share of each sub-score that comes from the fixed reference scale; the rest comes
 * from the device's position within the pool. Pure pool-relative scoring would call
 * the best of a weak pool "100", and pure absolute scoring would barely separate
 * devices at the same price point. Blending keeps scores honest and discriminating.
 */
export const ABSOLUTE_SHARE = 0.5;

/** Sub-score used for a missing spec when no device in the pool lists it either. */
const TYPICAL_SCORE = 50;

/** Value score uses points per ₹10,000 so the raw numbers stay readable in tests. */
const VALUE_UNIT = 10_000;

export interface RecommendationQuery {
  category: Category;
  useCase: UseCase;
  budget: number;
}

export interface ScorePoolOptions {
  sort?: SortMode;
}

/** Filters a catalog down to the devices a query should rank. */
export function selectPool(devices: EngineDevice[], query: RecommendationQuery): EngineDevice[] {
  return devices.filter((d) => d.category === query.category && d.price <= query.budget);
}

/**
 * Scores every device in `pool` against a use-case profile. The pool must be a
 * single category; relative sub-scores are computed across exactly these devices.
 */
export function scorePool(
  pool: EngineDevice[],
  profile: UseCaseProfile,
  ctx: ScoringContext,
  options: ScorePoolOptions = {},
): ScoredDevice[] {
  if (pool.length === 0) return [];
  if (pool.some((d) => d.category !== profile.category)) {
    throw new Error(`Pool contains devices outside the ${profile.category} category`);
  }

  const weighted = (Object.entries(profile.weights) as [FactorKey, number][])
    .filter(([, weight]) => weight > 0)
    .map(([key, weight]) => {
      const factor = getFactor(profile.category, key);
      const values = pool.map(factor.read).filter((v): v is number => v !== null);
      return { factor, weight, toRelative: relativeScaler(values, factor.direction) };
    });

  // Sub-scores for devices that list each spec, so gaps can be filled with the median.
  const known = weighted.map(({ factor, toRelative }) => {
    const scores = new Map<string, { rawValue: number; absolute: number; relative: number | null; score: number }>();
    for (const device of pool) {
      const rawValue = factor.read(device);
      if (rawValue === null) continue;
      const absolute = factor.absolute(rawValue, ctx);
      const relative = toRelative(rawValue);
      const score = relative === null ? absolute : ABSOLUTE_SHARE * absolute + (1 - ABSOLUTE_SHARE) * relative;
      scores.set(device.id, { rawValue, absolute, relative, score });
    }
    return { scores, median: median([...scores.values()].map((s) => s.score)) };
  });

  const partial = pool.map((device) => {
    const breakdown = weighted.map(({ factor, weight }, i): FactorScore => {
      const found = known[i].scores.get(device.id);
      if (!found) {
        const score = known[i].median ?? TYPICAL_SCORE;
        return {
          key: factor.key,
          label: factor.label,
          weight,
          rawValue: null,
          displayValue: "Not listed",
          absolute: score,
          relative: null,
          score,
          contribution: weight * score,
          estimated: true,
        };
      }
      return {
        key: factor.key,
        label: factor.label,
        weight,
        ...found,
        displayValue: factor.format(found.rawValue),
        contribution: weight * found.score,
        estimated: false,
      };
    });
    const weightedScore = breakdown.reduce((sum, f) => sum + f.contribution, 0);
    const penalties = baselinePenalties(breakdown, profile);
    const matchScore = penalties.reduce((score, p) => score * p.multiplier, weightedScore);
    return {
      device,
      breakdown,
      weightedScore,
      penalties,
      matchScore,
      rawValue: matchScore / (device.price / VALUE_UNIT),
    };
  });

  const bestRawValue = Math.max(...partial.map((p) => p.rawValue));

  const byMatch = [...partial].sort(
    (a, b) =>
      b.matchScore - a.matchScore ||
      a.device.price - b.device.price ||
      a.device.name.localeCompare(b.device.name),
  );
  const byValue = [...partial].sort(
    (a, b) =>
      b.rawValue - a.rawValue ||
      b.matchScore - a.matchScore ||
      a.device.name.localeCompare(b.device.name),
  );
  const matchRank = new Map(byMatch.map((p, i) => [p.device.id, i + 1]));
  const valueRank = new Map(byValue.map((p, i) => [p.device.id, i + 1]));

  const ordered = options.sort === "value" ? byValue : byMatch;

  return ordered.map((p) => {
    const rank = matchRank.get(p.device.id)!;
    return {
      device: p.device,
      weightedScore: p.weightedScore,
      matchScore: p.matchScore,
      penalties: p.penalties,
      valueScore: bestRawValue > 0 ? (p.rawValue / bestRawValue) * 100 : 0,
      matchRank: rank,
      valueRank: valueRank.get(p.device.id)!,
      breakdown: p.breakdown,
      explanation: explain(p.breakdown, p.penalties, profile, rank, pool.length),
    };
  });
}

/**
 * Each absolute point below a baseline costs PENALTY_PER_POINT of the weighted
 * score, capped at MAX_PENALTY per factor, so a near miss stays competitive while
 * a device that plainly lacks the essential spec drops down the list.
 */
export const PENALTY_PER_POINT = 0.015;
export const MAX_PENALTY = 0.35;

function baselinePenalties(breakdown: FactorScore[], profile: UseCaseProfile): BaselinePenalty[] {
  const penalties: BaselinePenalty[] = [];
  for (const [key, baseline] of Object.entries(profile.baselines ?? {}) as [FactorKey, number][]) {
    const factor = breakdown.find((f) => f.key === key);
    // A spec the listing doesn't publish can't prove the device misses the baseline.
    if (!factor || factor.estimated) continue;
    const shortfall = baseline - factor.absolute;
    if (shortfall <= 0) continue;
    penalties.push({
      key,
      label: factor.label,
      baseline,
      absolute: factor.absolute,
      multiplier: 1 - Math.min(MAX_PENALTY, shortfall * PENALTY_PER_POINT),
    });
  }
  return penalties;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Full pipeline: filter the catalog by category and budget, then score and rank. */
export function recommend(
  catalog: EngineDevice[],
  query: RecommendationQuery,
  options: ScorePoolOptions = {},
): ScoredDevice[] {
  const profile = requireProfile(query.category, query.useCase);
  return scorePool(selectPool(catalog, query), profile, { budget: query.budget }, options);
}
