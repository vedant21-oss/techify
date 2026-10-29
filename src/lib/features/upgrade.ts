import type { Category, FactorKey, ScoredDevice, UseCaseProfile } from "@/lib/engine";

/*
 * "Is it worth upgrading?" The device you own and every candidate are scored in one
 * pool, so their match scores are on the same footing, and the gain is simply the
 * difference. Price is taken out of the weights first: a cheaper phone isn't a
 * better phone, and a device you already own has no price to compare.
 *
 * A bigger total isn't enough on its own. When a use case has essential specs (its
 * baselines: graphics for gaming, the camera for photography), an upgrade has to be
 * better on at least one of them and worse on none. Otherwise a thin laptop with a
 * faster processor would "upgrade" a gaming laptop by losing its graphics card.
 */

/** Budgets offered as one-tap choices. Each category's finder default is among them. */
export const UPGRADE_BUDGETS: Record<Category, number[]> = {
  phone: [15_000, 20_000, 30_000, 40_000, 60_000, 80_000, 120_000, 180_000],
  laptop: [40_000, 60_000, 80_000, 100_000, 130_000, 180_000, 250_000],
};

/** Match points an essential spec must gain (or lose) to count as better (or worse). */
export const ESSENTIAL_MARGIN = 1;

/** Match-point gains that make an upgrade big, clear or small. Below `small` it isn't one. */
export const UPGRADE_STEPS = { big: 20, clear: 10, small: 5 } as const;

export type UpgradeLevel = "big" | "clear" | "small" | "none";

export function upgradeLevel(gain: number): UpgradeLevel {
  if (gain >= UPGRADE_STEPS.big) return "big";
  if (gain >= UPGRADE_STEPS.clear) return "clear";
  if (gain >= UPGRADE_STEPS.small) return "small";
  return "none";
}

/** The use case without its price weight, the rest rescaled to sum to 1. Baselines stay. */
export function withoutPrice(profile: UseCaseProfile): UseCaseProfile {
  const { price, ...rest } = profile.weights;
  if (!price) return profile;
  const total = Object.values(rest).reduce((sum, w) => sum + (w ?? 0), 0);
  const weights = Object.fromEntries(Object.entries(rest).map(([k, w]) => [k, (w ?? 0) / total]));
  return { ...profile, weights };
}

export interface FactorChange {
  key: FactorKey;
  label: string;
  from: string;
  to: string;
  /** Match points gained (negative: lost) on this factor alone. */
  points: number;
}

export interface UpgradeOption {
  scored: ScoredDevice;
  gain: number;
  level: UpgradeLevel;
  /** Match points per ₹10,000 spent. */
  gainPer10k: number;
  improvements: FactorChange[];
  downgrades: FactorChange[];
  /** False when it isn't better on any essential spec, or is worse on one. */
  meetsEssentials: boolean;
}

export interface UpgradePlan {
  current: ScoredDevice;
  /** Clear and big upgrades, biggest gain first. */
  upgrades: UpgradeOption[];
  /** Devices that are better, but only by a small step. */
  smallSteps: number;
  /** Devices that score clearly higher but don't improve what the use case needs most. */
  sidegrades: number;
  cheapest: UpgradeOption | null;
  biggest: UpgradeOption | null;
  bestPerRupee: UpgradeOption | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Factor-by-factor differences. Specs either listing leaves out are skipped: the
 * engine scores those as typical, which is a placeholder, not a difference.
 */
function changes(candidate: ScoredDevice, current: ScoredDevice): FactorChange[] {
  const mine = new Map(current.breakdown.map((f) => [f.key, f]));
  return candidate.breakdown
    .filter((f) => !f.estimated && !mine.get(f.key)?.estimated)
    .map((f) => {
      const m = mine.get(f.key);
      return {
        key: f.key,
        label: f.label,
        from: m?.displayValue ?? "n/a",
        to: f.displayValue,
        points: round1(f.contribution - (m?.contribution ?? 0)),
      };
    })
    .filter((c) => Math.abs(c.points) >= 0.5);
}

/**
 * Upgrades from `currentId` among everything else in `scored`, which must all have
 * been scored in the same pool as the current device. `essentials` are the use
 * case's baseline factors.
 */
export function planUpgrades(scored: ScoredDevice[], currentId: string, essentials: FactorKey[] = []): UpgradePlan {
  const current = scored.find((s) => s.device.id === currentId);
  if (!current) throw new Error(`Current device ${currentId} isn't in the scored pool`);

  const options: UpgradeOption[] = scored
    .filter((s) => s.device.id !== currentId)
    .map((s) => {
      const gain = round1(s.matchScore - current.matchScore);
      const all = changes(s, current);
      const essential = all.filter((c) => essentials.includes(c.key));
      return {
        scored: s,
        gain,
        level: upgradeLevel(gain),
        gainPer10k: round1((gain / s.device.price) * 10_000),
        improvements: all.filter((c) => c.points > 0).sort((a, b) => b.points - a.points),
        downgrades: all.filter((c) => c.points < 0).sort((a, b) => a.points - b.points),
        meetsEssentials:
          essentials.length === 0 ||
          (essential.some((c) => c.points >= ESSENTIAL_MARGIN) && !essential.some((c) => c.points <= -ESSENTIAL_MARGIN)),
      };
    });

  const clearlyHigher = options.filter((o) => o.level === "big" || o.level === "clear");
  const upgrades = clearlyHigher
    .filter((o) => o.meetsEssentials)
    .sort((a, b) => b.gain - a.gain || a.scored.device.price - b.scored.device.price);

  const pick = (compare: (a: UpgradeOption, b: UpgradeOption) => number) =>
    upgrades.length ? [...upgrades].sort(compare)[0] : null;

  return {
    current,
    upgrades,
    smallSteps: options.filter((o) => o.level === "small" && o.meetsEssentials).length,
    sidegrades: clearlyHigher.length - upgrades.length,
    cheapest: pick((a, b) => a.scored.device.price - b.scored.device.price || b.gain - a.gain),
    biggest: upgrades[0] ?? null,
    bestPerRupee: pick((a, b) => b.gainPer10k - a.gainPer10k || b.gain - a.gain),
  };
}
