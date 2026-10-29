import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/data/catalog";
import { OWNED_DEVICES } from "@/data/owned";
import { laptop, phone } from "@/lib/engine/__tests__/fixtures";
import { requireProfile, scorePool, type FactorKey } from "@/lib/engine";
import {
  decodePayment,
  describeDiscount,
  emiPlan,
  encodePayment,
  noCostEmiPlan,
  offerDiscount,
  planFor,
  quotePrice,
  type CardOffer,
} from "../offers";
import { offerFormSchema } from "../offer-form";
import { planUpgrades, upgradeLevel, withoutPrice } from "../upgrade";

const NOW = new Date("2026-10-19T12:00:00Z");

function offer(overrides: Partial<CardOffer> = {}): CardOffer {
  return {
    id: "o1",
    bank: "hdfc",
    cardType: "credit",
    kind: "flat",
    amount: 3000,
    maxDiscount: null,
    emiOnly: false,
    noCostEmiMonths: null,
    store: "Amazon",
    validUntil: null,
    ...overrides,
  };
}

describe("payment in the URL", () => {
  it("round-trips a card choice", () => {
    expect(encodePayment({ bank: "icici", card: "debit", emi: false })).toBe("icici-debit");
    expect(decodePayment("hdfc-credit-emi")).toEqual({ bank: "hdfc", card: "credit", emi: true });
  });

  it.each(["", "nobank-credit", "hdfc", "hdfc-gold", "hdfc-credit-later", "hdfc-credit-emi-x"])(
    "treats %j as no card",
    (value) => {
      expect(decodePayment(value)).toBeNull();
    },
  );
});

describe("offer discounts", () => {
  it("caps percentage discounts and never goes below zero", () => {
    expect(offerDiscount(offer({ kind: "percent", amount: 10, maxDiscount: 4000 }), 60_000)).toBe(4000);
    expect(offerDiscount(offer({ kind: "percent", amount: 10, maxDiscount: null }), 25_999)).toBe(2599);
    expect(offerDiscount(offer({ amount: 5000 }), 3000)).toBe(3000);
  });

  it("picks the single biggest offer the card qualifies for, without stacking", () => {
    const offers = [
      offer({ id: "flat", amount: 3000 }),
      offer({ id: "pct", kind: "percent", amount: 10, maxDiscount: 5000 }),
      offer({ id: "other-bank", bank: "sbi", amount: 9000 }),
    ];
    const quote = quotePrice(40_000, offers, { bank: "hdfc", card: "credit", emi: false }, NOW);
    expect(quote.offer?.id).toBe("pct");
    expect(quote.discount).toBe(4000);
    expect(quote.price).toBe(36_000);
  });

  it("respects card type, EMI-only offers and end dates", () => {
    const offers = [
      offer({ id: "debit-only", cardType: "debit", amount: 1000 }),
      offer({ id: "emi-only", emiOnly: true, amount: 4000, noCostEmiMonths: 6 }),
      offer({ id: "expired", amount: 8000, validUntil: "2026-10-01T00:00:00Z" }),
    ];
    const full = quotePrice(50_000, offers, { bank: "hdfc", card: "credit", emi: false }, NOW);
    expect(full.offer).toBeNull();
    expect(full.price).toBe(50_000);
    expect(full.noCostEmiMonths).toBeNull();

    const emi = quotePrice(50_000, offers, { bank: "hdfc", card: "credit", emi: true }, NOW);
    expect(emi.offer?.id).toBe("emi-only");
    expect(emi.noCostEmiMonths).toBe(6);
  });

  it("describes discounts in plain words", () => {
    const fmt = (n: number) => `₹${n}`;
    expect(describeDiscount(offer({ amount: 3000 }), fmt)).toBe("₹3000 off");
    expect(describeDiscount(offer({ kind: "percent", amount: 10, maxDiscount: 5000 }), fmt)).toBe("10% off up to ₹5000");
    expect(describeDiscount(offer({ amount: 0, noCostEmiMonths: 6 }), fmt)).toBeNull();
  });
});

describe("EMI", () => {
  it("matches the standard reducing-balance instalment", () => {
    // ₹1,00,000 at 12% for 12 months is ₹8,885 a month, the textbook figure.
    const plan = emiPlan(100_000, 12, 12);
    expect(plan.monthly).toBe(8885);
    expect(plan.interest).toBe(6619);
    expect(plan.gst).toBe(Math.round(6618.55 * 0.18));
    expect(plan.total).toBe(Math.round(8884.88 * 12 + 6618.55 * 0.18));
  });

  it("splits the price evenly with no-cost EMI and still counts GST on the interest", () => {
    const plan = noCostEmiPlan(60_000, 15, 6);
    expect(plan.monthly).toBe(10_000);
    expect(plan.noCost).toBe(true);
    expect(plan.interest).toBeGreaterThan(0);
    expect(plan.total).toBe(60_000 + plan.gst);
  });

  it("uses no-cost EMI only up to the tenure the offer allows", () => {
    expect(planFor(60_000, 6, 6).noCost).toBe(true);
    expect(planFor(60_000, 9, 6).noCost).toBe(false);
    expect(planFor(60_000, 6, null).noCost).toBe(false);
  });
});

describe("upgrades", () => {
  it("names the size of an upgrade", () => {
    expect(upgradeLevel(25)).toBe("big");
    expect(upgradeLevel(12)).toBe("clear");
    expect(upgradeLevel(6)).toBe("small");
    expect(upgradeLevel(2)).toBe("none");
    expect(upgradeLevel(-4)).toBe("none");
  });

  it("drops price from the weights and keeps the rest in proportion", () => {
    const budget = requireProfile("phone", "budget");
    const stripped = withoutPrice(budget);
    expect(stripped.weights.price).toBeUndefined();
    expect(Object.values(stripped.weights).reduce((s, w) => s + (w ?? 0), 0)).toBeCloseTo(1);
    expect(stripped.weights.cpu! / stripped.weights.camera!).toBeCloseTo(budget.weights.cpu! / budget.weights.camera!);
    expect(withoutPrice(requireProfile("phone", "gaming"))).toEqual(requireProfile("phone", "gaming"));
  });

  it("finds the cheapest, biggest and best-per-rupee upgrades, and skips sidegrades", () => {
    const old = phone("Old", 30_000, { cpuScore: 20, cameraScore: 20, displayScore: 30, ramGb: 4, storageGb: 64, batteryCapacity: 3000, chargingWatts: 18 });
    const sidegrade = phone("Sidegrade", 12_000, { cpuScore: 22, cameraScore: 20, displayScore: 30, ramGb: 4, storageGb: 64, batteryCapacity: 3100, chargingWatts: 18 });
    const solid = phone("Solid", 20_000, { cpuScore: 50, cameraScore: 50, displayScore: 60 });
    const flagship = phone("Flagship", 30_000, { cpuScore: 95, cameraScore: 95, displayScore: 90, ramGb: 12, storageGb: 256, batteryCapacity: 5500, chargingWatts: 90 });
    const profile = requireProfile("phone", "all-rounder");
    const plan = planUpgrades(scorePool([old, sidegrade, solid, flagship], profile, { budget: 30_000 }), old.id);

    expect(plan.upgrades.map((u) => u.scored.device.name)).toEqual(["Flagship", "Solid"]);
    expect(plan.biggest?.scored.device.name).toBe("Flagship");
    expect(plan.cheapest?.scored.device.name).toBe("Solid");
    expect(plan.upgrades.every((u) => u.gain >= 10)).toBe(true);
    expect(plan.upgrades[0].improvements[0].points).toBeGreaterThan(0);
    expect(plan.bestPerRupee).not.toBeNull();
  });

  it("doesn't count a device that loses the use case's essential spec, however well it scores", () => {
    const gamingRig = laptop("Gaming rig", 80_000, { cpuScore: 22, gpuScore: 40, ramGb: 8, displayScore: 40 });
    const ultrabook = laptop("Ultrabook", 70_000, { cpuScore: 90, gpuScore: 20, ramGb: 32, storageGb: 2048, displayScore: 95, batteryCapacity: 75, weightGrams: 1200 });
    const newRig = laptop("New rig", 90_000, { cpuScore: 50, gpuScore: 60, ramGb: 16, displayScore: 60 });
    const gaming = requireProfile("laptop", "gaming");
    const scored = scorePool([gamingRig, ultrabook, newRig], gaming, { budget: 90_000 });
    const essentials = Object.keys(gaming.baselines!) as FactorKey[];

    const plan = planUpgrades(scored, gamingRig.id, essentials);
    expect(plan.upgrades.map((u) => u.scored.device.name)).toEqual(["New rig"]);
    // Without the rule the ultrabook would have counted.
    expect(planUpgrades(scored, gamingRig.id).upgrades.map((u) => u.scored.device.name)).toContain("Ultrabook");
    expect(plan.sidegrades).toBe(planUpgrades(scored, gamingRig.id).upgrades.length - 1);
  });

  it("leaves unlisted specs out of what changes", () => {
    const old = phone("Old", 30_000, { cpuScore: 20, cameraScore: 20, weightGrams: 160 });
    const mystery = phone("Mystery", 25_000, { cpuScore: 80, cameraScore: 80, weightGrams: null });
    const plan = planUpgrades(scorePool([old, mystery], requireProfile("phone", "all-rounder"), { budget: 30_000 }), old.id);
    const keys = [...plan.upgrades[0].improvements, ...plan.upgrades[0].downgrades].map((c) => c.key);
    expect(keys).not.toContain("portability");
  });

  it("returns no upgrades when nothing in budget is clearly better", () => {
    const current = phone("Current", 30_000, { cpuScore: 90, cameraScore: 90, displayScore: 90 });
    const weaker = phone("Weaker", 15_000, { cpuScore: 30, cameraScore: 30, displayScore: 40 });
    const plan = planUpgrades(scorePool([current, weaker], requireProfile("phone", "all-rounder"), { budget: 30_000 }), current.id);
    expect(plan.upgrades).toEqual([]);
    expect(plan.cheapest).toBeNull();
  });
});

describe("older devices for the upgrade checker", () => {
  it("resolves every chip and keeps scores in range", () => {
    expect(OWNED_DEVICES.length).toBeGreaterThan(30);
    for (const d of OWNED_DEVICES) {
      for (const score of [d.cpuScore, d.gpuScore, d.cameraScore, d.displayScore]) {
        if (score === null) continue;
        expect(score, d.slug).toBeGreaterThanOrEqual(0);
        expect(score, d.slug).toBeLessThanOrEqual(100);
      }
      if (d.category === "laptop") expect(d.gpuScore, d.slug).not.toBeNull();
      else expect(d.cameraScore, d.slug).not.toBeNull();
    }
  });

  it("never shares a slug with the catalogue or with each other", () => {
    const catalogue = new Set(buildCatalog().map((r) => r.slug));
    const seen = new Set<string>();
    for (const d of OWNED_DEVICES) {
      expect(catalogue.has(d.slug), d.slug).toBe(false);
      expect(seen.has(d.slug), d.slug).toBe(false);
      seen.add(d.slug);
    }
  });
});

describe("admin offer form", () => {
  const base = { slug: "oneplus-13r-12-256", bank: "hdfc", cardType: "CREDIT", kind: "FLAT", amount: "4,000", maxDiscount: "", noCostEmiMonths: "", store: "Amazon", validUntil: "" };

  it("accepts amounts typed with commas and fills in the blanks", () => {
    const parsed = offerFormSchema.parse({ ...base, emiOnly: "on", noCostEmiMonths: "6", validUntil: "2026-11-30" });
    expect(parsed).toMatchObject({ amount: 4000, maxDiscount: null, emiOnly: true, noCostEmiMonths: 6, validUntil: "2026-11-30" });
    expect(offerFormSchema.parse(base).emiOnly).toBe(false);
  });

  it("allows a no-cost-EMI-only offer but not an empty one", () => {
    expect(offerFormSchema.safeParse({ ...base, amount: "0", noCostEmiMonths: "9" }).success).toBe(true);
    expect(offerFormSchema.safeParse({ ...base, amount: "0" }).success).toBe(false);
  });

  it.each([
    [{ bank: "unknown" }],
    [{ kind: "PERCENT", amount: "75" }],
    [{ noCostEmiMonths: "5" }],
    [{ store: " " }],
    [{ validUntil: "30/11/2026" }],
  ])("rejects %j", (change) => {
    expect(offerFormSchema.safeParse({ ...base, ...change }).success).toBe(false);
  });
});
