import { describe, expect, it } from "vitest";
import { seedAsEngineDevices } from "@/data/catalog";
import {
  decodeWeights,
  encodeWeights,
  explainGap,
  headToHead,
  normalizeWeights,
  recommend,
  requireProfile,
  scorePool,
  selectPool,
  withCustomWeights,
} from "@/lib/engine";
import { laptop } from "@/lib/engine/__tests__/fixtures";
import { buyLinks } from "@/lib/buy-links";
import { createAdminToken, passwordMatches, verifyAdminToken } from "../admin-session";
import { splitGlossary } from "../glossary";
import { meetsMustHaves, parseMustHaves, type MustHaveSubject } from "../must-haves";
import { isDeal, summarizePrices } from "../price-history";
import { QUIZZES, scoreQuiz } from "../quiz";

describe("custom weights", () => {
  it("normalises points to fractions and drops unknown or zero factors", () => {
    const w = normalizeWeights("phone", { camera: 30, battery: 10, gpu: 50, cpu: 0 });
    expect(Object.keys(w).sort()).toEqual(["battery", "camera"]);
    expect(w.camera).toBeCloseTo(0.75);
  });

  it("round-trips through the URL form and rejects garbage", () => {
    const encoded = encodeWeights({ gpu: 40, cpu: 25.4 });
    expect(encoded).toBe("gpu.40,cpu.25");
    expect(decodeWeights("laptop", encoded)).toEqual({ gpu: 40, cpu: 25 });
    expect(decodeWeights("laptop", "camera.50,gpu.abc,cpu.900")).toBeNull();
  });

  it("changes the ranking while keeping the preset's baselines", () => {
    const light = laptop("Light", 70000, { gpuScore: 20, weightGrams: 1100, batteryCapacity: 80 });
    const gamer = laptop("Gamer", 70000, { gpuScore: 70, weightGrams: 2600, batteryCapacity: 45 });
    const base = requireProfile("laptop", "gaming");
    expect(recommend([light, gamer], { category: "laptop", useCase: "gaming", budget: 80000 })[0].device.name).toBe("Gamer");
    const portable = withCustomWeights(base, { portability: 60, battery: 40 });
    expect(portable.custom).toBe(true);
    expect(portable.baselines).toEqual(base.baselines);
    const [top] = scorePool([light, gamer], portable, { budget: 80000 });
    expect(top.device.name).toBe("Light");
  });
});

describe("why not this one", () => {
  it("explains where a device loses points to the leader", () => {
    const seed = seedAsEngineDevices();
    const pool = selectPool(seed, { category: "laptop", useCase: "gaming", budget: 120000 });
    const scored = scorePool(pool, requireProfile("laptop", "gaming"), { budget: 120000 });
    const leader = scored[0];
    const other = scored.find((s) => s.penalties.length > 0)!;
    const gap = explainGap(other, leader);
    expect(gap.pointsBehind).toBeGreaterThan(0);
    expect(gap.losses[0].pointsBehind).toBeGreaterThan(0);
    expect(gap.summary).toMatch(/costs it [\d.]+ points/);
  });
});

describe("head to head", () => {
  it("names a winner, a margin and per-spec edges", () => {
    const strong = laptop("Strong", 90000, { cpuScore: 80, gpuScore: 70 });
    const weak = laptop("Weak", 90000, { cpuScore: 30, gpuScore: 10 });
    const [a, b] = recommend([strong, weak], { category: "laptop", useCase: "gaming", budget: 90000 });
    const verdict = headToHead(a, b);
    expect(verdict.winner).toBe("a");
    expect(verdict.margin).toBeGreaterThan(0);
    expect(verdict.edges.find((e) => e.key === "gpu")!.winner).toBe("a");
    expect(headToHead(a, a).winner).toBe("tie");
  });
});

describe("must-haves", () => {
  const phone: MustHaveSubject = {
    category: "phone",
    displayName: '6.3" 1.5K LTPO OLED, 120Hz',
    gpuName: null,
    cameraName: "50MP + 48MP 5x periscope + 48MP ultrawide",
    ramGb: 12,
    storageGb: 256,
    batteryCapacity: 5000,
    chargingWatts: 30,
    weightGrams: null,
  };

  it("passes and fails the right checks", () => {
    expect(meetsMustHaves(phone, ["oled", "hz120", "telephoto", "ram12", "compact"])).toBe(true);
    expect(meetsMustHaves(phone, ["battery6000"])).toBe(false);
    expect(meetsMustHaves(phone, ["charge65"])).toBe(false);
  });

  it("treats unlisted specs as not confirmed", () => {
    const heavy = { ...phone, category: "laptop" as const, gpuName: "NVIDIA GeForce RTX 5050", weightGrams: null };
    expect(meetsMustHaves(heavy, ["rtx"])).toBe(true);
    expect(meetsMustHaves(heavy, ["light"])).toBe(false);
  });

  it("parses only ids that exist for the category", () => {
    expect(parseMustHaves("laptop", "rtx,telephoto,oled,rtx")).toEqual(["rtx", "oled"]);
    expect(parseMustHaves("phone", "")).toEqual([]);
  });
});

describe("quiz", () => {
  it("turns answers into a preset, importance points and a budget", () => {
    const result = scoreQuiz("laptop", { main: "games", carry: "daily", gaming: "serious", screen: "nice", spend: "balanced" }, 110000);
    expect(result.useCase).toBe("gaming");
    expect(result.points.gpu).toBe(65);
    expect(result.points.portability).toBe(25);
    expect(result.budget).toBe(110000);
  });

  it("keeps every answer's factors valid for the category", () => {
    for (const quiz of Object.values(QUIZZES)) {
      for (const q of quiz.questions) {
        for (const o of q.options) {
          const decoded = decodeWeights(quiz.category, encodeWeights(o.points));
          if (Object.keys(o.points).length) expect(decoded, `${quiz.category}/${q.id}/${o.id}`).not.toBeNull();
        }
      }
    }
  });
});

describe("glossary", () => {
  it("wraps known spec terms and leaves the rest as text", () => {
    const segments = splitGlossary('6.78" 1.5K LTPO OLED, 120Hz');
    const terms = segments.filter((s) => s.term).map((s) => s.term);
    expect(terms).toEqual(["Resolution", "LTPO", "OLED", "Refresh rate"]);
    expect(segments.map((s) => s.text).join("")).toBe('6.78" 1.5K LTPO OLED, 120Hz');
  });
});

describe("price history", () => {
  const d = (day: number) => new Date(Date.UTC(2026, 8, day));

  it("reports a drop from the previous recorded price", () => {
    const s = summarizePrices([{ price: 40000, recordedAt: d(1) }, { price: 36000, recordedAt: d(10) }], 36000);
    expect(s).toMatchObject({ previous: 40000, change: -4000, changePercent: -10, lowest: 36000, isLowest: true });
    expect(isDeal(s)).toBe(true);
  });

  it("has no previous price when it never changed", () => {
    const s = summarizePrices([{ price: 40000, recordedAt: d(1) }], 40000);
    expect(s.previous).toBeNull();
    expect(isDeal(s)).toBe(false);
  });
});

describe("affiliate links", () => {
  it("adds tags only when configured", () => {
    const device = { brand: "OnePlus", name: "15", searchQuery: null };
    const plain = buyLinks(device, {});
    expect(plain.every((l) => !l.affiliate && !l.url.includes("tag="))).toBe(true);
    const tagged = buyLinks(device, { amazonTag: "techify-21", flipkartId: "abc" });
    expect(tagged[0].url).toContain("tag=techify-21");
    expect(tagged[1].url).toContain("affid=abc");
    expect(tagged.every((l) => l.affiliate)).toBe(true);
  });
});

describe("admin session", () => {
  it("accepts a fresh signed token and rejects tampered or expired ones", () => {
    const token = createAdminToken("secret", 1_000);
    expect(verifyAdminToken(token, "secret", 2_000)).toBe(true);
    expect(verifyAdminToken(token, "other", 2_000)).toBe(false);
    expect(verifyAdminToken(token.replace(/^\d+/, "999999999999"), "secret", 2_000)).toBe(false);
    expect(verifyAdminToken(token, "secret", 1_000 + 13 * 3_600_000)).toBe(false);
    expect(verifyAdminToken(undefined, "secret")).toBe(false);
  });

  it("compares passwords safely", () => {
    expect(passwordMatches("hunter2", "hunter2")).toBe(true);
    expect(passwordMatches("hunter3", "hunter2")).toBe(false);
    expect(passwordMatches("", "")).toBe(false);
  });
});
