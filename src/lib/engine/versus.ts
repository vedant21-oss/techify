import type { FactorKey, ScoredDevice } from "./types";

/** Score differences smaller than this are called a tie. */
export const TIE_MARGIN = 2;

export interface FactorEdge {
  key: FactorKey;
  label: string;
  winner: "a" | "b" | "tie";
  aValue: string;
  bValue: string;
  aScore: number;
  bScore: number;
}

export interface Verdict {
  winner: "a" | "b" | "tie";
  margin: number;
  edges: FactorEdge[];
}

/** Who wins a head-to-head for one use case, and on which specs. */
export function headToHead(a: ScoredDevice, b: ScoredDevice): Verdict {
  const bFactors = new Map(b.breakdown.map((f) => [f.key, f]));
  const edges = a.breakdown
    .filter((f) => bFactors.has(f.key))
    .sort((x, y) => y.weight - x.weight)
    .map((fa): FactorEdge => {
      const fb = bFactors.get(fa.key)!;
      const diff = fa.score - fb.score;
      return {
        key: fa.key,
        label: fa.label,
        winner: Math.abs(diff) < TIE_MARGIN ? "tie" : diff > 0 ? "a" : "b",
        aValue: fa.displayValue,
        bValue: fb.displayValue,
        aScore: Math.round(fa.score),
        bScore: Math.round(fb.score),
      };
    });
  const margin = Math.round((a.matchScore - b.matchScore) * 10) / 10;
  return {
    winner: Math.abs(margin) < TIE_MARGIN ? "tie" : margin > 0 ? "a" : "b",
    margin: Math.abs(margin),
    edges,
  };
}
