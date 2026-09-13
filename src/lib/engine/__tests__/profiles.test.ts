import { describe, expect, it } from "vitest";
import { FACTORS } from "../factors";
import { PROFILES } from "../profiles";
import type { FactorKey } from "../types";

const allProfiles = [...PROFILES.laptop, ...PROFILES.phone];

describe("use-case profiles", () => {
  it.each(allProfiles.map((p) => [`${p.category}/${p.id}`, p] as const))(
    "%s weights sum to 1",
    (_, profile) => {
      const total = Object.values(profile.weights).reduce((sum, w) => sum + (w ?? 0), 0);
      expect(total).toBeCloseTo(1, 10);
    },
  );

  it.each(allProfiles.map((p) => [`${p.category}/${p.id}`, p] as const))(
    "%s only weights factors defined for its category",
    (_, profile) => {
      for (const key of Object.keys(profile.weights) as FactorKey[]) {
        expect(FACTORS[profile.category][key], `${key} missing`).toBeDefined();
      }
    },
  );

  it("offers five use cases per category with unique ids", () => {
    for (const profiles of Object.values(PROFILES)) {
      expect(profiles).toHaveLength(5);
      expect(new Set(profiles.map((p) => p.id)).size).toBe(5);
    }
  });

  it("puts graphics first for laptop gaming and battery/portability first for students", () => {
    const heaviest = (category: "laptop" | "phone", id: string) => {
      const profile = PROFILES[category].find((p) => p.id === id)!;
      return Object.entries(profile.weights).sort((a, b) => b[1]! - a[1]!)[0][0];
    };
    expect(heaviest("laptop", "gaming")).toBe("gpu");
    expect(["battery", "portability"]).toContain(heaviest("laptop", "student"));
    expect(heaviest("phone", "photography")).toBe("camera");
    expect(heaviest("phone", "battery")).toBe("battery");
  });
});
