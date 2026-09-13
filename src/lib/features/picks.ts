import { requireProfile, scorePool, type Category, type EngineDevice, type ScoredDevice } from "@/lib/engine";

/*
 * Editorial picks, chosen by rule rather than by hand so they're reproducible:
 * - Of the year: the highest all-rounder match score among devices released that year.
 * - Of the week: rotates weekly through the best-value all-rounders that also score
 *   well, so the pick is a strong device that's also sensibly priced.
 */

export const WEEKLY_MIN_MATCH = 60;
export const WEEKLY_SHORTLIST = 8;

export interface PickCandidate {
  device: EngineDevice;
  releaseYear: number;
}

export interface EditorialPick {
  kind: "week" | "year";
  category: Category;
  scored: ScoredDevice;
  /** Plain-English statement of how this pick was chosen. */
  method: string;
  /** e.g. "Week 37, 2026" or "2026". */
  period: string;
}

/** ISO-8601 week number: weeks start Monday; week 1 contains the year's first Thursday. */
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/** Scores a whole category as all-rounders with no budget ceiling. */
function scoreCategory(candidates: PickCandidate[], category: Category): ScoredDevice[] {
  const pool = candidates.filter((c) => c.device.category === category).map((c) => c.device);
  if (pool.length === 0) return [];
  const budget = Math.max(...pool.map((d) => d.price));
  return scorePool(pool, requireProfile(category, "all-rounder"), { budget });
}

const plural = (category: Category) => (category === "laptop" ? "laptops" : "phones");

export function pickOfTheYear(candidates: PickCandidate[], category: Category, year: number): EditorialPick | null {
  const years = new Map(candidates.map((c) => [c.device.id, c.releaseYear]));
  const released = scoreCategory(candidates, category).filter((s) => years.get(s.device.id) === year);
  if (released.length === 0) return null;
  const [best] = released.sort((a, b) => b.matchScore - a.matchScore || a.device.price - b.device.price);
  return {
    kind: "year",
    category,
    scored: best,
    period: String(year),
    method: `Highest all-rounder score among the ${released.length} ${plural(category)} released in ${year} that we track.`,
  };
}

export function pickOfTheWeek(candidates: PickCandidate[], category: Category, date: Date): EditorialPick | null {
  const shortlist = scoreCategory(candidates, category)
    .filter((s) => s.matchScore >= WEEKLY_MIN_MATCH)
    .sort((a, b) => b.valueScore - a.valueScore || b.matchScore - a.matchScore)
    .slice(0, WEEKLY_SHORTLIST);
  if (shortlist.length === 0) return null;
  const { year, week } = isoWeek(date);
  return {
    kind: "week",
    category,
    scored: shortlist[week % shortlist.length],
    period: `Week ${week}, ${year}`,
    method: `Rotates every Monday through the ${shortlist.length} best-value ${plural(category)} that score at least ${WEEKLY_MIN_MATCH} as all-rounders.`,
  };
}
