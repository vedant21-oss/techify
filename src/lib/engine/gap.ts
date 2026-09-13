import { formatPrice } from "./format";
import type { FactorKey, ScoredDevice } from "./types";

export interface FactorGap {
  key: FactorKey;
  label: string;
  /** Match points this device loses (positive) or gains (negative) versus the leader on this factor. */
  pointsBehind: number;
  deviceValue: string;
  leaderValue: string;
}

export interface GapExplanation {
  pointsBehind: number;
  losses: FactorGap[];
  gains: FactorGap[];
  penaltyPoints: number;
  priceDifference: number;
  summary: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * "Why not this one?": where a device loses match points to the #1 device in the
 * same pool, factor by factor, plus anything lost to a missed baseline.
 */
export function explainGap(device: ScoredDevice, leader: ScoredDevice): GapExplanation {
  const leaderFactors = new Map(leader.breakdown.map((f) => [f.key, f]));
  const gaps: FactorGap[] = device.breakdown
    .map((f) => {
      const l = leaderFactors.get(f.key);
      return {
        key: f.key,
        label: f.label,
        pointsBehind: round1((l?.contribution ?? 0) - f.contribution),
        deviceValue: f.displayValue,
        leaderValue: l?.displayValue ?? "n/a",
      };
    })
    .filter((g) => Math.abs(g.pointsBehind) >= 0.5);

  const losses = gaps.filter((g) => g.pointsBehind > 0).sort((a, b) => b.pointsBehind - a.pointsBehind);
  const gains = gaps.filter((g) => g.pointsBehind < 0).sort((a, b) => a.pointsBehind - b.pointsBehind);
  const penaltyPoints = round1(device.weightedScore - device.matchScore - (leader.weightedScore - leader.matchScore));
  const pointsBehind = round1(leader.matchScore - device.matchScore);
  const priceDifference = device.device.price - leader.device.price;

  const parts: string[] = [];
  if (losses.length) {
    parts.push(
      `It trails on ${losses
        .slice(0, 2)
        .map((g) => `${g.label.toLowerCase()} (${g.deviceValue} vs ${g.leaderValue})`)
        .join(" and ")}`,
    );
  }
  if (penaltyPoints >= 0.5) parts.push(`misses a baseline the job needs`);
  let summary =
    parts.length > 0
      ? `${parts.join(", and ")}, which costs it ${pointsBehind} points.`
      : `It's within ${Math.max(0, pointsBehind)} points of the leader.`;
  if (gains.length) summary += ` It does beat the leader on ${gains[0].label.toLowerCase()}.`;
  if (priceDifference < 0) summary += ` It's also ${formatPrice(-priceDifference)} cheaper.`;

  return { pointsBehind, losses, gains, penaltyPoints: Math.max(0, penaltyPoints), priceDifference, summary };
}
