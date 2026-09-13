import { describe, expect, it } from "vitest";
import { buildCatalog } from "../catalog";
import { describeDisplay, laptopDisplayScore, phoneDisplayScore } from "../display-score";
import { LAPTOP_CPUS, lookupTier } from "../tiers";

describe("catalogue", () => {
  const catalog = buildCatalog();

  it("resolves every chip to a tier and keeps every score in range", () => {
    for (const r of catalog) {
      for (const score of [r.cpuScore, r.gpuScore, r.cameraScore, r.displayScore]) {
        if (score === null) continue;
        expect(score, r.slug).toBeGreaterThanOrEqual(0);
        expect(score, r.slug).toBeLessThanOrEqual(100);
      }
    }
  });

  it("has a price, source and category-appropriate fields for every device", () => {
    for (const r of catalog) {
      expect(r.price, r.slug).toBeGreaterThan(1000);
      expect(r.priceSource, r.slug).not.toBe("");
      if (r.category === "laptop") expect(r.gpuScore, r.slug).not.toBeNull();
      else expect(r.cameraScore, r.slug).not.toBeNull();
    }
  });

  it("fails loudly for a chip that isn't in the tier table", () => {
    expect(() => lookupTier(LAPTOP_CPUS, "Imaginary Core 9000", "laptop CPU")).toThrow(/tiers\.ts/);
  });
});

describe("display scores", () => {
  it("ranks phone panels by type, refresh rate and resolution", () => {
    const hdLcd = phoneDisplayScore({ sizeIn: 6.7, panel: "LCD", width: 720, height: 1600, refreshHz: 90 });
    const fhdOled = phoneDisplayScore({ sizeIn: 6.7, panel: "OLED", width: 1080, height: 2400, refreshHz: 120 });
    const qhdLtpo = phoneDisplayScore({ sizeIn: 6.9, panel: "LTPO OLED", width: 1440, height: 3120, refreshHz: 120 });
    expect(hdLcd).toBeLessThan(fhdOled);
    expect(fhdOled).toBeLessThan(qhdLtpo);
  });

  it("caps laptop display scores at 100", () => {
    expect(laptopDisplayScore({ sizeIn: 16, panel: "Liquid Retina XDR", width: 3456, height: 2234, refreshHz: 120 })).toBe(100);
    expect(laptopDisplayScore({ sizeIn: 15.6, panel: "TN", width: 1366, height: 768, refreshHz: 60 })).toBe(12);
  });

  it("describes displays the way spec sheets do", () => {
    expect(describeDisplay({ sizeIn: 14, panel: "OLED", width: 2880, height: 1800, refreshHz: 120 }, false)).toBe('14" 3K OLED, 120Hz');
    expect(describeDisplay({ sizeIn: 6.78, panel: "OLED", width: 1272, height: 2800, refreshHz: 165 }, true)).toBe('6.78" 1.5K OLED, 165Hz');
  });
});
