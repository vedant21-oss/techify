import { describe, expect, it } from "vitest";
import { seedAsEngineDevices } from "@/data/catalog";
import { requireProfile } from "../profiles";
import { ABSOLUTE_SHARE, MAX_PENALTY, PENALTY_PER_POINT, recommend, scorePool, selectPool } from "../score";
import { laptop, phone } from "./fixtures";

const gamingRig = laptop("Gaming Rig", 80000, {
  cpuScore: 65,
  gpuScore: 70,
  displayScore: 60,
  batteryCapacity: 60,
  weightGrams: 2400,
});
const ultrabook = laptop("Ultrabook", 78000, {
  cpuScore: 60,
  gpuScore: 25,
  displayScore: 80,
  batteryCapacity: 75,
  weightGrams: 1200,
});
const budgetBox = laptop("Budget Box", 35000, {
  cpuScore: 30,
  gpuScore: 10,
  displayScore: 35,
  ramGb: 8,
  batteryCapacity: 42,
  weightGrams: 1650,
});
const catalog = [gamingRig, ultrabook, budgetBox, phone("Some Phone", 20000)];

describe("selectPool", () => {
  it("keeps only the requested category at or under budget", () => {
    const pool = selectPool(catalog, { category: "laptop", useCase: "gaming", budget: 78000 });
    expect(pool.map((d) => d.name).sort()).toEqual(["Budget Box", "Ultrabook"]);
  });
});

describe("recommend", () => {
  it("returns nothing when no device fits the budget", () => {
    expect(recommend(catalog, { category: "laptop", useCase: "coding", budget: 10000 })).toEqual([]);
  });

  it("ranks the dedicated-GPU machine first for gaming", () => {
    const results = recommend(catalog, { category: "laptop", useCase: "gaming", budget: 90000 });
    expect(results[0].device.name).toBe("Gaming Rig");
  });

  it("ranks the light, long-lasting machine first for students", () => {
    const results = recommend(catalog, { category: "laptop", useCase: "student", budget: 90000 });
    expect(results[0].device.name).toBe("Ultrabook");
    expect(results.at(-1)!.device.name).not.toBe("Ultrabook");
  });

  it("assigns sequential ranks and keeps scores within 0–100", () => {
    const results = recommend(catalog, { category: "laptop", useCase: "all-rounder", budget: 90000 });
    expect(results.map((r) => r.matchRank)).toEqual([1, 2, 3]);
    for (const r of results) {
      expect(r.matchScore).toBeGreaterThanOrEqual(0);
      expect(r.matchScore).toBeLessThanOrEqual(100);
      expect(r.valueScore).toBeGreaterThanOrEqual(0);
      expect(r.valueScore).toBeLessThanOrEqual(100);
    }
  });

  it("builds the match score from the weighted contributions and penalties", () => {
    for (const r of recommend(catalog, { category: "laptop", useCase: "gaming", budget: 90000 })) {
      const summed = r.breakdown.reduce((s, f) => s + f.contribution, 0);
      expect(r.weightedScore).toBeCloseTo(summed, 10);
      const multiplier = r.penalties.reduce((m, p) => m * p.multiplier, 1);
      expect(r.matchScore).toBeCloseTo(summed * multiplier, 10);
      for (const f of r.breakdown) expect(f.contribution).toBeCloseTo(f.weight * f.score, 10);
    }
  });

  it("blends absolute and pool-relative sub-scores", () => {
    const [top] = recommend(catalog, { category: "laptop", useCase: "gaming", budget: 90000 });
    const gpu = top.breakdown.find((f) => f.key === "gpu")!;
    expect(gpu.relative).toBe(100);
    expect(gpu.score).toBeCloseTo(ABSOLUTE_SHARE * 70 + (1 - ABSOLUTE_SHARE) * 100);
  });

  it("falls back to absolute scores when the pool cannot differentiate", () => {
    const [only] = recommend([budgetBox], { category: "laptop", useCase: "coding", budget: 40000 });
    for (const f of only.breakdown) {
      expect(f.relative).toBeNull();
      expect(f.score).toBe(f.absolute);
    }
    expect(only.valueScore).toBe(100);
  });

  it("sorts by value on request while preserving match ranks", () => {
    const query = { category: "laptop", useCase: "all-rounder", budget: 90000 } as const;
    const byMatch = recommend(catalog, query);
    const byValue = recommend(catalog, query, { sort: "value" });
    expect(byValue[0].valueScore).toBe(100);
    expect(byValue.map((r) => r.valueRank)).toEqual([1, 2, 3]);
    for (const r of byValue) {
      expect(r.matchRank).toBe(byMatch.find((m) => m.device.id === r.device.id)!.matchRank);
    }
  });

  it("gives a cheaper device with identical specs the better value score", () => {
    const a = laptop("Twin A", 60000);
    const b = laptop("Twin B", 50000);
    const results = recommend([a, b], { category: "laptop", useCase: "coding", budget: 70000 }, { sort: "value" });
    expect(results[0].device.name).toBe("Twin B");
    expect(results[0].matchScore).toBeCloseTo(results[1].matchScore);
    expect(results[1].valueScore).toBeCloseTo((50000 / 60000) * 100);
  });

  it("breaks exact match-score ties by lower price", () => {
    const pricey = laptop("Same Specs Pricey", 60000);
    const cheap = laptop("Same Specs Cheap", 55000);
    const results = recommend([pricey, cheap], { category: "laptop", useCase: "gaming", budget: 70000 });
    expect(results.map((r) => r.device.name)).toEqual(["Same Specs Cheap", "Same Specs Pricey"]);
  });

  it("rewards spending less for the budget-conscious phone profile", () => {
    const cheap = phone("Cheap", 12000);
    const expensive = phone("Expensive", 24000);
    const results = recommend([cheap, expensive], { category: "phone", useCase: "budget", budget: 25000 });
    expect(results[0].device.name).toBe("Cheap");
  });

  it("scores a missing spec as the pool median and keeps it out of the explanation", () => {
    const light = laptop("Light", 60000, { weightGrams: 1200, batteryCapacity: 70 });
    const heavy = laptop("Heavy", 60000, { weightGrams: 2600, batteryCapacity: 70 });
    const middle = laptop("Middle", 60000, { weightGrams: 1900, batteryCapacity: 70 });
    const unknown = laptop("Unlisted weight", 60000, { weightGrams: null, batteryCapacity: 70 });
    const results = recommend([light, heavy, middle, unknown], { category: "laptop", useCase: "student", budget: 70000 });

    const portability = (name: string) => results.find((r) => r.device.name === name)!.breakdown.find((f) => f.key === "portability")!;
    expect(portability("Unlisted weight")).toMatchObject({ estimated: true, rawValue: null, displayValue: "Not listed" });
    expect(portability("Unlisted weight").score).toBeCloseTo(portability("Middle").score);

    const explanation = results.find((r) => r.device.name === "Unlisted weight")!.explanation;
    expect([...explanation.strengths, ...explanation.tradeoffs].join(" ")).not.toMatch(/Not listed|portab|heav/i);
    expect(explanation.summary).toMatch(/Portability isn't listed yet, so it's scored as typical\.$/);
  });

  it("never applies a baseline penalty for a spec the listing doesn't publish", () => {
    const [scored] = recommend([laptop("Unknown GPU", 50000, { gpuScore: null })], {
      category: "laptop",
      useCase: "gaming",
      budget: 60000,
    });
    expect(scored.breakdown.find((f) => f.key === "gpu")!.estimated).toBe(true);
    expect(scored.penalties).toEqual([]);
  });

  it("rejects pools that mix categories", () => {
    expect(() =>
      scorePool([gamingRig, phone("Stray", 10000)], requireProfile("laptop", "gaming"), { budget: 100000 }),
    ).toThrow(/category/);
  });
});

describe("baselines", () => {
  const query = { category: "laptop", useCase: "gaming", budget: 90000 } as const;

  it("penalizes a gaming laptop in proportion to its graphics shortfall", () => {
    const results = recommend(catalog, query);
    const ultra = results.find((r) => r.device.name === "Ultrabook")!;
    const [penalty] = ultra.penalties;
    expect(penalty.key).toBe("gpu");
    const baseline = requireProfile("laptop", "gaming").baselines!.gpu!;
    expect(penalty.multiplier).toBeCloseTo(1 - (baseline - 25) * PENALTY_PER_POINT);
    expect(ultra.matchScore).toBeLessThan(ultra.weightedScore);
  });

  it("caps the penalty per factor", () => {
    const noGpu = laptop("No GPU", 30000, { gpuScore: 0 });
    const scored = recommend([...catalog, noGpu], query).find((r) => r.device.name === "No GPU")!;
    expect(scored.penalties.find((p) => p.key === "gpu")!.multiplier).toBeCloseTo(1 - MAX_PENALTY);
  });

  it("leaves devices that meet every baseline untouched", () => {
    const rig = recommend(catalog, query).find((r) => r.device.name === "Gaming Rig")!;
    expect(rig.penalties).toEqual([]);
    expect(rig.matchScore).toBe(rig.weightedScore);
  });

  it("keeps a great screen from carrying integrated graphics past a real GPU", () => {
    const oledNoGpu = laptop("OLED Integrated", 80000, {
      cpuScore: 70,
      gpuScore: 30,
      displayScore: 90,
      storageGb: 1024,
      batteryCapacity: 70,
      weightGrams: 1400,
    });
    const plainGamer = laptop("Plain Gamer", 80000, {
      cpuScore: 62,
      gpuScore: 66,
      displayScore: 58,
      batteryCapacity: 60,
      weightGrams: 2400,
    });
    const [top, second] = recommend([oledNoGpu, plainGamer], query);
    expect(top.device.name).toBe("Plain Gamer");
    expect(second.explanation.tradeoffs[0]).toMatch(/^Below the gaming baseline for graphics performance/);
    expect(second.explanation.strengths.join(" ")).not.toMatch(/graphics/);
  });
});

describe("explanations", () => {
  it("credits graphics for the gaming pick and flags its weight for students", () => {
    const [gamingTop] = recommend(catalog, { category: "laptop", useCase: "gaming", budget: 90000 });
    expect(gamingTop.explanation.summary).toMatch(/^The best gaming match in your budget/);
    expect(gamingTop.explanation.strengths[0]).toMatch(/graphics performance/);

    const student = recommend(catalog, { category: "laptop", useCase: "student", budget: 90000 });
    const rig = student.find((r) => r.device.name === "Gaming Rig")!;
    expect(rig.explanation.tradeoffs.join(" ")).toMatch(/heavy build \(2\.40 kg\)/);
    expect(rig.explanation.summary).toMatch(/held back by/);
  });

  it("describes non-leaders by rank", () => {
    const results = recommend(catalog, { category: "laptop", useCase: "gaming", budget: 90000 });
    expect(results[2].explanation.summary).toMatch(/^Ranked #3 of 3 for gaming/);
  });
});

describe("seed catalog sanity", () => {
  const seed = seedAsEngineDevices();
  const gpuTier = (r: { breakdown: { key: string; rawValue: number | null }[] }) =>
    r.breakdown.find((f) => f.key === "gpu")!.rawValue ?? 0;

  it("has unique slugs and a broad catalogue in each category", () => {
    expect(new Set(seed.map((d) => d.slug)).size).toBe(seed.length);
    expect(seed.filter((d) => d.category === "laptop").length).toBeGreaterThanOrEqual(30);
    expect(seed.filter((d) => d.category === "phone").length).toBeGreaterThanOrEqual(70);
  });

  it("recommends a dedicated-GPU laptop for gaming under ₹1.2L", () => {
    const [top] = recommend(seed, { category: "laptop", useCase: "gaming", budget: 120000 });
    expect(gpuTier(top)).toBeGreaterThanOrEqual(38);
  });

  it("recommends a light laptop for students under ₹1.2L", () => {
    const [top] = recommend(seed, { category: "laptop", useCase: "student", budget: 120000 });
    const weight = top.breakdown.find((f) => f.key === "portability")!.rawValue;
    expect(weight).not.toBeNull();
    expect(weight!).toBeLessThan(1500);
  });

  it("recommends a top-tier camera phone for photography at a flagship budget", () => {
    const [top] = recommend(seed, { category: "phone", useCase: "photography", budget: 180000 });
    expect(top.breakdown.find((f) => f.key === "camera")!.rawValue).toBeGreaterThanOrEqual(90);
  });

  it("recommends a flagship-class chipset for phone gaming under ₹40k", () => {
    const [top] = recommend(seed, { category: "phone", useCase: "gaming", budget: 40000 });
    expect(top.breakdown.find((f) => f.key === "cpu")!.rawValue).toBeGreaterThanOrEqual(66);
  });
});
