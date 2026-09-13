import { describe, expect, it } from "vitest";
import { explainGap, FACTORS, PROFILES, scorePool, type Category, type EngineDevice } from "@/lib/engine";
import { MUST_HAVES } from "@/lib/features/must-haves";
import { QUIZZES } from "@/lib/features/quiz";
import { isLang } from "../config";
import { explainHi, factorLabel, localizeGap, localizeScored, mustHaveLabel, profileText } from "../engine-hi";
import { MESSAGES } from "../messages";

const CATEGORIES: Category[] = ["phone", "laptop"];
const hasDevanagari = (text: string) => /[ऀ-ॿ]/.test(text);

function phone(id: string, price: number, specs: Partial<EngineDevice["specs"]>): EngineDevice {
  return {
    id,
    slug: id,
    category: "phone",
    brand: "Test",
    name: id,
    price,
    specs: {
      cpuScore: 60,
      gpuScore: null,
      cameraScore: 60,
      displayScore: 60,
      ramGb: 8,
      storageGb: 256,
      batteryCapacity: 5000,
      chargingWatts: 45,
      weightGrams: 190,
      ...specs,
    },
  };
}

const pool = [
  phone("fast", 30000, { cpuScore: 92, displayScore: 85, batteryCapacity: 6500 }),
  phone("slow", 18000, { cpuScore: 35, cameraScore: 40, batteryCapacity: 4000, chargingWatts: 18 }),
  phone("mid", 24000, { cpuScore: 65, batteryCapacity: null }),
];

describe("Hindi coverage", () => {
  it("names every factor, use case and must-have in Hindi", () => {
    for (const category of CATEGORIES) {
      for (const key of Object.keys(FACTORS[category]) as (keyof (typeof FACTORS)[Category])[]) {
        expect(hasDevanagari(factorLabel("hi", category, key)), `${category}.${key}`).toBe(true);
      }
      for (const profile of PROFILES[category]) {
        const text = profileText("hi", profile);
        expect(hasDevanagari(text.label), profile.id).toBe(true);
        expect(hasDevanagari(text.description), profile.id).toBe(true);
      }
    }
    for (const m of MUST_HAVES) expect(mustHaveLabel("hi", m.id, "missing"), m.id).not.toBe("missing");
  });

  it("translates every quiz question and answer", () => {
    for (const category of CATEGORIES) {
      for (const question of QUIZZES[category].questions) {
        const text = MESSAGES.hi.quiz.text[category][question.id];
        expect(text, `${category}.${question.id}`).toBeDefined();
        for (const option of question.options) expect(text.options[option.id], `${question.id}.${option.id}`).toBeTruthy();
      }
    }
  });

  it("keeps English output unchanged", () => {
    const profile = PROFILES.phone[0];
    expect(profileText("en", profile)).toEqual({ label: profile.label, description: profile.description });
    const [first] = scorePool(pool, PROFILES.phone[1], { budget: 40000 });
    expect(localizeScored("en", first, PROFILES.phone[1], pool.length)).toBe(first);
  });

  it("accepts only supported languages", () => {
    expect(isLang("hi")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});

describe("explainHi", () => {
  const gaming = PROFILES.phone.find((p) => p.id === "gaming")!;
  const scored = scorePool(pool, gaming, { budget: 40000 });

  it("mentions the same number of strengths and trade-offs as the English explanation", () => {
    for (const s of scored) {
      const hi = explainHi(s.breakdown, s.penalties, gaming, s.matchRank, scored.length);
      expect(hi.strengths).toHaveLength(s.explanation.strengths.length);
      expect(hi.tradeoffs).toHaveLength(s.explanation.tradeoffs.length);
      expect(hasDevanagari(hi.summary)).toBe(true);
    }
  });

  it("calls the leader the best match and ranks the rest", () => {
    const [leader, second] = scored;
    expect(explainHi(leader.breakdown, leader.penalties, gaming, 1, 3).summary).toContain("सबसे अच्छा मैच");
    expect(explainHi(second.breakdown, second.penalties, gaming, 2, 3).summary).toContain("3 में से #2");
  });

  it("localizes labels and tier values without touching scores", () => {
    const hi = localizeScored("hi", scored[0], gaming, scored.length);
    expect(hi.matchScore).toBe(scored[0].matchScore);
    expect(hi.breakdown.find((f) => f.key === "cpu")!.label).toBe("परफ़ॉर्मेंस");
    expect(hi.breakdown.find((f) => f.key === "cpu")!.displayValue).toMatch(/\/100 स्तर$/);
  });

  it("explains the gap to #1 in Hindi with the same numbers", () => {
    const gap = explainGap(scored[1], scored[0]);
    const hi = localizeGap("hi", gap, "phone");
    expect(hi.pointsBehind).toBe(gap.pointsBehind);
    expect(hi.losses.map((l) => l.key)).toEqual(gap.losses.map((l) => l.key));
    expect(hi.summary).toContain("पॉइंट");
  });
});
