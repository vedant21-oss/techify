import type { Category, UseCase } from "@/lib/engine";
import type { ParsedQuery } from "./types";

/*
 * Deterministic parser for sentences like "laptop under seventy thousand for coding
 * and light gaming". Used on its own when no Claude credentials are configured, and
 * as the fallback when a Claude call fails.
 */

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const MULTIPLIERS: Record<string, number> = {
  hundred: 100,
  thousand: 1_000, k: 1_000,
  lakh: 100_000, lakhs: 100_000, lac: 100_000, lacs: 100_000, l: 100_000,
};

/** "one lakh twenty thousand" → "120000", "seventy five thousand" → "75000". */
export function wordsToDigits(text: string): string {
  return text.replace(
    /\b((?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakhs?|lacs?|and|half|a)(?:[\s-]+|$))+/gi,
    (phrase) => {
      const words = phrase.toLowerCase().split(/[\s-]+/).filter((w) => w && w !== "and");
      const hasNumber = words.some((w) => w in UNITS || w === "half");
      const isArticleAmount = words[0] === "a" && words.some((w) => w in MULTIPLIERS);
      if (!hasNumber && !isArticleAmount) return phrase;
      let total = 0;
      let current = 0;
      for (const word of words) {
        if (word in UNITS) current += UNITS[word];
        else if (word === "a") current += current === 0 ? 1 : 0;
        else if (word === "half") current += 0.5;
        else if (word === "hundred") current = (current || 1) * 100;
        else if (word in MULTIPLIERS) {
          total += (current || 1) * MULTIPLIERS[word];
          current = 0;
        }
      }
      const value = total + current;
      return value > 0 ? `${value} ` : phrase;
    },
  );
}

const BUDGET_CUE = /\b(under|below|within|upto|up to|max(?:imum)?|budget(?: of| is)?|less than|around|about|approx(?:imately)?|near|for|at|between|range|spend|rs\.?|inr)\b|₹/;
const AMOUNT = /(?:₹|rs\.?\s*|inr\s*)?(\d+(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|l)?\b/gi;

const MIN_PLAUSIBLE = 3_000;
const MAX_PLAUSIBLE = 1_000_000;

function toRupees(amount: number, unit: string | undefined): number {
  if (!unit) return amount;
  return amount * (MULTIPLIERS[unit.toLowerCase()] ?? 1);
}

export function parseBudget(text: string): number | null {
  const normalized = wordsToDigits(text.toLowerCase()).replace(/(\d),(?=\d)/g, "$1");
  const candidates: { value: number; cued: boolean; index: number }[] = [];
  for (const match of normalized.matchAll(AMOUNT)) {
    const value = toRupees(Number(match[1]), match[2]);
    if (value < MIN_PLAUSIBLE || value > MAX_PLAUSIBLE) continue;
    const before = normalized.slice(Math.max(0, match.index - 20), match.index);
    candidates.push({ value, cued: BUDGET_CUE.test(before) || /₹|rs|inr/.test(match[0]), index: match.index });
  }
  if (candidates.length === 0) return null;
  // A range like "50 to 70k" or "between 50k and 70k": the upper bound is the budget.
  const cued = candidates.filter((c) => c.cued);
  const pool = cued.length ? cued : candidates;
  return Math.round(Math.max(...pool.map((c) => c.value)));
}

const CATEGORY_WORDS: Record<Category, RegExp> = {
  laptop: /\b(laptops?|notebooks?|macbooks?|chromebooks?|ultrabooks?|thinkpads?)\b/,
  phone: /\b(phones?|smartphones?|mobiles?|iphones?|android|handsets?|cell ?phones?)\b/,
};

type Keywords = { useCase: UseCase; pattern: RegExp }[];

const LAPTOP_KEYWORDS: Keywords = [
  { useCase: "video-editing", pattern: /\b(video editing|edit(?:ing)? videos?|premiere|davinci|after effects|final cut|render(?:ing)?|content creat\w*|youtub\w*|editing)\b/g },
  { useCase: "coding", pattern: /\b(cod(?:e|ing)|programm\w*|developer|development|software|dev work|docker|compil\w*|engineering|data science|machine learning|ml)\b/g },
  { useCase: "gaming", pattern: /\b(gam(?:e|es|ing|er)|fps|esports|valorant|gta|steam)\b/g },
  { useCase: "student", pattern: /\b(students?|college|school|university|study|studies|notes|office work|everyday|browsing|netflix|light use|basic use|online classes)\b/g },
  { useCase: "all-rounder", pattern: /\b(all[- ]?rounder|everything|general use|balanced|a bit of everything|mixed use)\b/g },
];

const PHONE_KEYWORDS: Keywords = [
  { useCase: "photography", pattern: /\b(photo\w*|cameras?|pictures?|pics|selfies?|instagram|vlog\w*|portraits?)\b/g },
  { useCase: "gaming", pattern: /\b(gam(?:e|es|ing|er)|bgmi|pubg|free fire|genshin|call of duty|cod mobile)\b/g },
  { useCase: "battery", pattern: /\b(battery|batteries|backup|long[- ]lasting|lasts? (?:all|the whole) day|charging|charge)\b/g },
  { useCase: "budget", pattern: /\b(cheap\w*|budget[- ]friendly|affordable|value for money|basic phone|inexpensive|save money)\b/g },
  { useCase: "all-rounder", pattern: /\b(all[- ]?rounder|everything|general use|balanced|daily driver|a bit of everything)\b/g },
];

/** Words that make the following use case secondary: "light gaming", "occasional editing". */
const SOFTENER = /\b(light|occasional(?:ly)?|casual|some|little|bit of|sometimes|basic)\s+$/;

function scoreUseCases(text: string, keywords: Keywords) {
  return keywords
    .map(({ useCase, pattern }) => {
      let score = 0;
      let first = Infinity;
      for (const match of text.matchAll(pattern)) {
        const softened = SOFTENER.test(text.slice(Math.max(0, match.index - 18), match.index));
        score += softened ? 0.4 : 1;
        first = Math.min(first, match.index);
      }
      return { useCase, score, first };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.first - b.first);
}

export function parseQueryWithRules(input: string): ParsedQuery {
  const text = input.toLowerCase();

  let category: Category | null = null;
  const laptopAt = text.search(CATEGORY_WORDS.laptop);
  const phoneAt = text.search(CATEGORY_WORDS.phone);
  if (laptopAt >= 0 && (phoneAt < 0 || laptopAt <= phoneAt)) category = "laptop";
  else if (phoneAt >= 0) category = "phone";

  const laptopScores = scoreUseCases(text, LAPTOP_KEYWORDS);
  const phoneScores = scoreUseCases(text, PHONE_KEYWORDS);

  if (!category) {
    // Use cases that only exist in one category give the category away.
    const laptopOnly = laptopScores.some((s) => ["coding", "video-editing", "student"].includes(s.useCase));
    const phoneOnly = phoneScores.some((s) => ["photography", "battery", "budget"].includes(s.useCase));
    if (laptopOnly && !phoneOnly) category = "laptop";
    else if (phoneOnly && !laptopOnly) category = "phone";
  }

  const scores = category === "phone" ? phoneScores : category === "laptop" ? laptopScores : [];
  return {
    category,
    useCase: scores[0]?.useCase ?? null,
    budget: parseBudget(text),
  };
}
