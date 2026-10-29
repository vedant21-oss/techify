import { describe, expect, it } from "vitest";
import { adFormSchema } from "../ad-form";
import { isAdLive, pickWeighted, safeAdUrl } from "../ads";

const NOW = new Date("2026-10-20T12:00:00Z");

describe("ad scheduling", () => {
  it("shows active ads inside their window only", () => {
    const base = { active: true, startsAt: null, endsAt: null };
    expect(isAdLive(base, NOW)).toBe(true);
    expect(isAdLive({ ...base, active: false }, NOW)).toBe(false);
    expect(isAdLive({ ...base, startsAt: new Date("2026-10-21T00:00:00Z") }, NOW)).toBe(false);
    expect(isAdLive({ ...base, endsAt: new Date("2026-10-20T11:59:59Z") }, NOW)).toBe(false);
    expect(isAdLive({ ...base, startsAt: new Date("2026-10-01"), endsAt: new Date("2026-10-31") }, NOW)).toBe(true);
  });
});

describe("weighted rotation", () => {
  const ads = [
    { id: "a", weight: 1 },
    { id: "b", weight: 3 },
    { id: "off", weight: 0 },
  ];

  it("gives each ad a share in proportion to its weight", () => {
    expect(pickWeighted(ads, 0)?.id).toBe("a");
    expect(pickWeighted(ads, 0.24)?.id).toBe("a");
    expect(pickWeighted(ads, 0.25)?.id).toBe("b");
    expect(pickWeighted(ads, 0.999)?.id).toBe("b");
  });

  it("returns nothing when no ad can show", () => {
    expect(pickWeighted([], 0.5)).toBeNull();
    expect(pickWeighted([{ id: "off", weight: 0 }], 0.5)).toBeNull();
  });
});

describe("ad links", () => {
  it.each([
    ["https://www.samsung.com/in/smartphones/", "https://www.samsung.com/in/smartphones/"],
    ["  /device/oneplus-13r-12-256 ", "/device/oneplus-13r-12-256"],
    ["/phones?budget=40000", "/phones?budget=40000"],
  ])("allows %j", (raw, expected) => {
    expect(safeAdUrl(raw)).toBe(expected);
  });

  it.each(["javascript:alert(1)", "http://example.com", "//evil.example", "/\\evil.example", "data:text/html,hi", "https://localhost", "samsung.com"])(
    "refuses %j",
    (raw) => {
      expect(safeAdUrl(raw)).toBeNull();
    },
  );
});

describe("admin ad form", () => {
  const base = {
    advertiser: "Samsung",
    headline: "Galaxy S24 FE: ₹4,000 off",
    body: "With HDFC Bank cards this week.",
    cta: "See the offer",
    url: "https://www.samsung.com/in/",
    results: "on",
    category: "PHONE",
    deviceSlug: "",
    weight: "2",
    startsAt: "",
    endsAt: "",
  };

  it("collects ticked placements and blanks", () => {
    const parsed = adFormSchema.parse({ ...base, device: "on" });
    expect(parsed).toMatchObject({ placements: ["RESULTS", "DEVICE"], category: "PHONE", weight: 2, deviceSlug: "" });
    expect(adFormSchema.parse({ ...base, category: "" }).category).toBeNull();
  });

  it.each([
    [{ results: undefined }],
    [{ url: "javascript:alert(1)" }],
    [{ headline: "x".repeat(71) }],
    [{ weight: "0" }],
    [{ startsAt: "2026-11-10", endsAt: "2026-11-01" }],
  ])("rejects %j", (change) => {
    expect(adFormSchema.safeParse({ ...base, ...change }).success).toBe(false);
  });
});
