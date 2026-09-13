import { describe, expect, it } from "vitest";
import { clamp, inverseLinearScale, linearScale, logScale, relativeScaler } from "../scales";

describe("scales", () => {
  it("clamps to 0–100 by default", () => {
    expect(clamp(-5)).toBe(0);
    expect(clamp(150)).toBe(100);
    expect(clamp(42)).toBe(42);
  });

  it("maps linearly between reference points", () => {
    expect(linearScale(35, 35, 90)).toBe(0);
    expect(linearScale(90, 35, 90)).toBe(100);
    expect(linearScale(62.5, 35, 90)).toBeCloseTo(50);
    expect(linearScale(200, 35, 90)).toBe(100);
  });

  it("inverts for lower-is-better specs", () => {
    expect(inverseLinearScale(1100, 1100, 2800)).toBe(100);
    expect(inverseLinearScale(2800, 1100, 2800)).toBe(0);
  });

  it("gives equal credit to each doubling on a log scale", () => {
    const eightToSixteen = logScale(16, 4, 64) - logScale(8, 4, 64);
    const sixteenToThirtyTwo = logScale(32, 4, 64) - logScale(16, 4, 64);
    expect(eightToSixteen).toBeCloseTo(sixteenToThirtyTwo);
    expect(logScale(0, 4, 64)).toBe(0);
  });

  describe("relativeScaler", () => {
    it("ranks the pool best → 100 and worst → 0", () => {
      const toRelative = relativeScaler([10, 20, 30], "higher");
      expect(toRelative(10)).toBe(0);
      expect(toRelative(20)).toBe(50);
      expect(toRelative(30)).toBe(100);
    });

    it("flips direction for lower-is-better specs", () => {
      const toRelative = relativeScaler([1200, 2400], "lower");
      expect(toRelative(1200)).toBe(100);
      expect(toRelative(2400)).toBe(0);
    });

    it("returns null when the pool has no spread", () => {
      expect(relativeScaler([16, 16, 16], "higher")(16)).toBeNull();
      expect(relativeScaler([], "higher")(16)).toBeNull();
    });
  });
});
