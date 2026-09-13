export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Maps value linearly so `low` → 0 and `high` → 100, clamped. */
export function linearScale(value: number, low: number, high: number): number {
  return clamp(((value - low) / (high - low)) * 100);
}

/** Inverse of linearScale: `low` → 100 and `high` → 0. For lower-is-better specs. */
export function inverseLinearScale(value: number, low: number, high: number): number {
  return 100 - linearScale(value, low, high);
}

/**
 * Logarithmic scale for specs with diminishing returns: going from 8 GB to 16 GB
 * of RAM matters as much as 16 GB to 32 GB.
 */
export function logScale(value: number, low: number, high: number): number {
  if (value <= 0) return 0;
  return clamp(((Math.log2(value) - Math.log2(low)) / (Math.log2(high) - Math.log2(low))) * 100);
}

/** Below this spread, values are treated as identical and the pool can't rank them. */
const MIN_SPREAD = 1e-9;

/**
 * Builds a min–max normalizer for a set of pool values. Returns null for every
 * input when the pool has no spread, so callers can fall back to absolute scores.
 */
export function relativeScaler(
  values: number[],
  direction: "higher" | "lower",
): (value: number) => number | null {
  if (values.length === 0) return () => null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  if (spread < MIN_SPREAD) return () => null;
  return (value) => {
    const position = ((value - min) / spread) * 100;
    return clamp(direction === "higher" ? position : 100 - position);
  };
}
