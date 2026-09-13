import type { ScoredDevice } from "@/lib/engine";

/** A "cheaper alternative" must cost at most this share of the device's price… */
export const CHEAPER_PRICE_SHARE = 0.85;
/** …and give up no more than this many match points. */
export const CHEAPER_MAX_SCORE_LOSS = 5;
/** "Better for the money" must sit within ±10% of the price… */
export const SAME_PRICE_BAND = 0.1;
/** …and beat the device by at least this many points. */
export const BETTER_MIN_SCORE_GAIN = 3;

export interface Alternatives {
  cheaper: ScoredDevice | null;
  better: ScoredDevice | null;
  similar: ScoredDevice[];
}

/**
 * Finds alternatives within one scored pool, so every score shown alongside the
 * device means the same thing as the device's own.
 */
export function findAlternatives(target: ScoredDevice, pool: ScoredDevice[], similarCount = 3): Alternatives {
  const others = pool.filter((s) => s.device.id !== target.device.id);
  const price = target.device.price;

  const cheaper =
    others
      .filter((s) => s.device.price <= price * CHEAPER_PRICE_SHARE && s.matchScore >= target.matchScore - CHEAPER_MAX_SCORE_LOSS)
      .sort((a, b) => b.matchScore - a.matchScore || a.device.price - b.device.price)[0] ?? null;

  const better =
    others
      .filter(
        (s) =>
          Math.abs(s.device.price - price) <= price * SAME_PRICE_BAND &&
          s.matchScore >= target.matchScore + BETTER_MIN_SCORE_GAIN,
      )
      .sort((a, b) => b.matchScore - a.matchScore || a.device.price - b.device.price)[0] ?? null;

  const taken = new Set([cheaper?.device.id, better?.device.id]);
  const distance = (s: ScoredDevice) =>
    Math.abs(s.device.price - price) / price + Math.abs(s.matchScore - target.matchScore) / 100;
  const similar = others
    .filter((s) => !taken.has(s.device.id))
    .sort((a, b) => distance(a) - distance(b))
    .slice(0, similarCount);

  return { cheaper, better, similar };
}
