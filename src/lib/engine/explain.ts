import { getFactor } from "./factors";
import type { BaselinePenalty, Explanation, FactorScore, UseCaseProfile } from "./types";

/** Factors lighter than this are too minor for the profile to mention. */
const NOTABLE_WEIGHT = 0.08;
const STRENGTH_THRESHOLD = 65;
const WEAKNESS_THRESHOLD = 45;
const MAX_POINTS = 2;

export function describeLevel(score: number): string {
  if (score >= 85) return "excellent";
  if (score >= 70) return "strong";
  if (score >= 55) return "solid";
  if (score >= 40) return "modest";
  return "weak";
}

function strengthText(f: FactorScore, noun: string): string {
  return `${describeLevel(f.score)} ${noun} (${f.displayValue})`;
}

function weaknessText(f: FactorScore, weakPhrase: string): string {
  return `${weakPhrase} (${f.displayValue})`;
}

function joinPhrases(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface ExplanationPoints {
  strengths: FactorScore[];
  /** Missed baselines first, then the notable factors costing the most points. */
  tradeoffs: FactorScore[];
  penalized: Set<FactorScore["key"]>;
  /** Notable factors the spec sheet doesn't list, scored as typical. */
  unlisted: FactorScore[];
}

/**
 * Decides what an explanation mentions, independent of wording. Strengths are the
 * notable factors contributing the most points; trade-offs lead with any missed
 * baselines, then the notable factors costing the most points relative to a perfect score.
 */
export function selectExplanationPoints(breakdown: FactorScore[], penalties: BaselinePenalty[]): ExplanationPoints {
  const notable = breakdown.filter((f) => f.weight >= NOTABLE_WEIGHT && !f.estimated);
  const penalized = new Set(penalties.map((p) => p.key));

  const strengths = notable
    .filter((f) => f.score >= STRENGTH_THRESHOLD && !penalized.has(f.key))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, MAX_POINTS);

  const missedBaselines = [...penalties]
    .sort((a, b) => a.multiplier - b.multiplier)
    .map((p) => breakdown.find((f) => f.key === p.key)!);
  const weakest = notable
    .filter((f) => f.score < WEAKNESS_THRESHOLD && !penalized.has(f.key))
    .sort((a, b) => b.weight * (100 - b.score) - a.weight * (100 - a.score));
  const tradeoffs = [...missedBaselines, ...weakest].slice(0, MAX_POINTS);
  const unlisted = breakdown.filter((f) => f.estimated && f.weight >= NOTABLE_WEIGHT);

  return { strengths, tradeoffs, penalized, unlisted };
}

/** Turns a numeric breakdown into plain English. */
export function explain(
  breakdown: FactorScore[],
  penalties: BaselinePenalty[],
  profile: UseCaseProfile,
  matchRank: number,
  poolSize: number,
): Explanation {
  const noun = (f: FactorScore) => getFactor(profile.category, f.key).noun;
  const weakPhrase = (f: FactorScore) => getFactor(profile.category, f.key).weakPhrase;
  const { strengths, tradeoffs, penalized, unlisted: unlistedFactors } = selectExplanationPoints(breakdown, penalties);

  const standing =
    matchRank === 1 && poolSize > 1
      ? `The best ${profile.label.toLowerCase()} match in your budget`
      : `Ranked #${matchRank} of ${poolSize} for ${profile.label.toLowerCase()}`;

  let body: string;
  if (strengths.length && tradeoffs.length) {
    body = `strong on ${joinPhrases(strengths.map(noun))}, but held back by ${joinPhrases(tradeoffs.map(weakPhrase))}.`;
  } else if (strengths.length) {
    body = `strong on ${joinPhrases(strengths.map(noun))}, with no significant weak spots for this use case.`;
  } else if (tradeoffs.length) {
    body = `no standout strengths for this use case, and held back by ${joinPhrases(tradeoffs.map(weakPhrase))}.`;
  } else {
    body = "a balanced option without standout strengths or weak spots.";
  }

  const unlisted = unlistedFactors.map((f) => f.label.toLowerCase());
  const caveat = unlisted.length
    ? ` ${capitalize(joinPhrases(unlisted))} ${unlisted.length === 1 ? "isn't" : "aren't"} listed yet, so ${unlisted.length === 1 ? "it's" : "they're"} scored as typical.`
    : "";

  return {
    summary: `${standing}: ${body}${caveat}`,
    strengths: strengths.map((f) => capitalize(strengthText(f, noun(f)))),
    tradeoffs: tradeoffs.map((f) =>
      penalized.has(f.key)
        ? `Below the ${profile.label.toLowerCase()} baseline for ${noun(f)} (${f.displayValue})`
        : capitalize(weaknessText(f, weakPhrase(f))),
    ),
  };
}
