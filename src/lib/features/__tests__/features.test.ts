import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { laptop, phone } from "@/lib/engine/__tests__/fixtures";
import { recommend } from "@/lib/engine";
import { canCreateAlert, dueAlerts, FREE_ALERT_LIMIT, normalizeEmail, validateTargetPrice } from "../alerts";
import { findAlternatives } from "../alternatives";
import { isoWeek, pickOfTheWeek, pickOfTheYear, WEEKLY_MIN_MATCH } from "../picks";
import { isValidPaymentSignature, proPriceInr } from "../pro";
import { matchesQuery, searchDevices } from "../search";

describe("isoWeek", () => {
  it.each([
    ["2026-01-01", 2026, 1],
    ["2026-09-13", 2026, 37],
    ["2026-12-31", 2026, 53],
    ["2027-01-01", 2026, 53],
    ["2024-12-30", 2025, 1],
  ])("%s is week %i-%i", (iso, year, week) => {
    expect(isoWeek(new Date(`${iso}T12:00:00Z`))).toEqual({ year, week });
  });
});

describe("picks", () => {
  const flagship = phone("Flagship", 120000, { cpuScore: 95, cameraScore: 95, displayScore: 92, ramGb: 12, storageGb: 256, batteryCapacity: 5000 });
  const midrange = phone("Midrange", 35000, { cpuScore: 70, cameraScore: 60, displayScore: 75, ramGb: 8, storageGb: 256, batteryCapacity: 6500 });
  const budget = phone("Budget", 12000, { cpuScore: 20, cameraScore: 20, displayScore: 35, ramGb: 4, storageGb: 64, batteryCapacity: 5000 });
  const oldFlagship = phone("Old Flagship", 60000, { cpuScore: 96, cameraScore: 96, displayScore: 95, ramGb: 16, storageGb: 512, batteryCapacity: 6000 });
  const candidates = [
    { device: flagship, releaseYear: 2026 },
    { device: midrange, releaseYear: 2026 },
    { device: budget, releaseYear: 2026 },
    { device: oldFlagship, releaseYear: 2025 },
    { device: laptop("A Laptop", 50000), releaseYear: 2026 },
  ];

  it("picks the best all-rounder released in the year, ignoring other years and categories", () => {
    const pick = pickOfTheYear(candidates, "phone", 2026)!;
    expect(pick.scored.device.name).toBe("Flagship");
    expect(pick.method).toMatch(/3 phones released in 2026/);
    expect(pickOfTheYear(candidates, "phone", 2019)).toBeNull();
  });

  it("rotates the weekly pick through strong, good-value devices only", () => {
    const names = new Set<string>();
    for (let day = 0; day < 7 * 12; day += 7) {
      const pick = pickOfTheWeek(candidates, "phone", new Date(Date.UTC(2026, 0, 5 + day)))!;
      expect(pick.scored.matchScore).toBeGreaterThanOrEqual(WEEKLY_MIN_MATCH);
      names.add(pick.scored.device.name);
    }
    expect(names.has("Budget")).toBe(false);
    expect(names.size).toBeGreaterThan(1);
  });

  it("keeps the weekly pick stable within a week", () => {
    const monday = pickOfTheWeek(candidates, "phone", new Date("2026-09-14T08:00:00Z"))!;
    const sunday = pickOfTheWeek(candidates, "phone", new Date("2026-09-20T20:00:00Z"))!;
    expect(sunday.scored.device.id).toBe(monday.scored.device.id);
  });
});

describe("alternatives", () => {
  const base = laptop("Base", 80000, { cpuScore: 60, gpuScore: 50, ramGb: 16 });
  const cheaperNearlyAsGood = laptop("Cheaper Twin", 62000, { cpuScore: 58, gpuScore: 49, ramGb: 16 });
  const cheaperButWorse = laptop("Cheap And Weak", 40000, { cpuScore: 20, gpuScore: 8, ramGb: 8 });
  const samePriceBetter = laptop("Same Price Better", 84000, { cpuScore: 78, gpuScore: 70, ramGb: 32 });
  const muchPricier = laptop("Pricier", 150000, { cpuScore: 95, gpuScore: 90, ramGb: 32 });
  const scored = recommend([base, cheaperNearlyAsGood, cheaperButWorse, samePriceBetter, muchPricier], {
    category: "laptop",
    useCase: "all-rounder",
    budget: 160000,
  });
  const target = scored.find((s) => s.device.name === "Base")!;

  it("finds a cheaper option that gives up little and a better one at the same price", () => {
    const alt = findAlternatives(target, scored);
    expect(alt.cheaper?.device.name).toBe("Cheaper Twin");
    expect(alt.better?.device.name).toBe("Same Price Better");
  });

  it("lists similar devices without repeating the target or the headline alternatives", () => {
    const alt = findAlternatives(target, scored);
    const names = alt.similar.map((s) => s.device.name);
    expect(names).not.toContain("Base");
    expect(names).not.toContain("Cheaper Twin");
    expect(names).not.toContain("Same Price Better");
    expect(names.length).toBeLessThanOrEqual(3);
  });

  it("returns nulls when nothing qualifies", () => {
    const alone = recommend([base], { category: "laptop", useCase: "all-rounder", budget: 90000 });
    expect(findAlternatives(alone[0], alone)).toEqual({ cheaper: null, better: null, similar: [] });
  });
});

describe("price alerts", () => {
  it("enforces the free limit but always allows updates and Pro", () => {
    expect(canCreateAlert(FREE_ALERT_LIMIT - 1, false, false)).toBe(true);
    expect(canCreateAlert(FREE_ALERT_LIMIT, false, false)).toBe(false);
    expect(canCreateAlert(FREE_ALERT_LIMIT, false, true)).toBe(true);
    expect(canCreateAlert(50, true, false)).toBe(true);
  });

  it("rejects targets at or above today's price and implausibly low ones", () => {
    expect(validateTargetPrice(80000, 80000)).toMatch(/below what it costs today/);
    expect(validateTargetPrice(10000, 80000)).toMatch(/Double-check/);
    expect(validateTargetPrice(70000.5, 80000)).toMatch(/whole rupees/);
    expect(validateTargetPrice(70000, 80000)).toBeNull();
  });

  it("marks alerts due only when the price reaches the target and they haven't fired", () => {
    const alerts = [
      { id: "hit", targetPrice: 70000, triggeredAt: null, device: { price: 69999 } },
      { id: "exact", targetPrice: 70000, triggeredAt: null, device: { price: 70000 } },
      { id: "miss", targetPrice: 70000, triggeredAt: null, device: { price: 70001 } },
      { id: "sent", targetPrice: 70000, triggeredAt: new Date(), device: { price: 60000 } },
    ];
    expect(dueAlerts(alerts).map((a) => a.id)).toEqual(["hit", "exact"]);
  });

  it("normalises emails", () => {
    expect(normalizeEmail("  Sanne@Example.COM ")).toBe("sanne@example.com");
  });
});

describe("Pro payments", () => {
  const secret = "test_secret";
  const sign = (orderId: string, paymentId: string) =>
    createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

  it("accepts a correctly signed payment and rejects tampering", () => {
    const signature = sign("order_123", "pay_456");
    expect(isValidPaymentSignature({ orderId: "order_123", paymentId: "pay_456", signature }, secret)).toBe(true);
    expect(isValidPaymentSignature({ orderId: "order_999", paymentId: "pay_456", signature }, secret)).toBe(false);
    expect(isValidPaymentSignature({ orderId: "order_123", paymentId: "pay_456", signature }, "wrong")).toBe(false);
    expect(isValidPaymentSignature({ orderId: "", paymentId: "pay_456", signature }, secret)).toBe(false);
  });

  it("reads the price from the environment with a safe default", () => {
    expect(proPriceInr({})).toBe(99);
    expect(proPriceInr({ TECHIFY_PRO_PRICE_INR: "149" })).toBe(149);
    expect(proPriceInr({ TECHIFY_PRO_PRICE_INR: "free" })).toBe(99);
  });
});

describe("search", () => {
  const devices = [
    { brand: "Samsung", name: "Galaxy S26 Ultra", variant: "12GB · 256GB", cpuName: "Snapdragon 8 Elite Gen 5", gpuName: null, price: 139999 },
    { brand: "Samsung", name: "Galaxy S26", variant: "12GB · 512GB", cpuName: "Samsung Exynos 2600", gpuName: null, price: 79999 },
    { brand: "MSI", name: "Crosshair A16 HX", variant: "Ryzen 9 8940HX · RTX 5060 · 16GB · 1TB", cpuName: "AMD Ryzen 9 8940HX", gpuName: "NVIDIA GeForce RTX 5060", price: 159990 },
  ];

  it("matches every word across name, variant and chips", () => {
    expect(matchesQuery(devices[0], "s26 ultra")).toBe(true);
    expect(matchesQuery(devices[1], "s26 ultra")).toBe(false);
    expect(matchesQuery(devices[2], "rtx 5060")).toBe(true);
    expect(matchesQuery(devices[1], "samsung 512 gb")).toBe(true);
    expect(matchesQuery(devices[0], "   ")).toBe(false);
  });

  it("ranks title matches first, then by price", () => {
    expect(searchDevices(devices, "samsung").map((d) => d.name)).toEqual(["Galaxy S26", "Galaxy S26 Ultra"]);
  });
});
