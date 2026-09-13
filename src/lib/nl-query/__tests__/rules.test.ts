import { describe, expect, it } from "vitest";
import { parseBudget, parseQueryWithRules, wordsToDigits } from "../rules";

describe("wordsToDigits", () => {
  it("converts Indian-English number words", () => {
    expect(wordsToDigits("seventy thousand").trim()).toBe("70000");
    expect(wordsToDigits("one lakh twenty thousand").trim()).toBe("120000");
    expect(wordsToDigits("seventy five thousand").trim()).toBe("75000");
    expect(wordsToDigits("a lakh").trim()).toBe("100000");
  });

  it("leaves ordinary words alone", () => {
    expect(wordsToDigits("a laptop for coding")).toBe("a laptop for coding");
  });
});

describe("parseBudget", () => {
  it.each([
    ["under 70k", 70_000],
    ["below ₹45,000", 45_000],
    ["budget of 1.5 lakh", 150_000],
    ["under seventy thousand", 70_000],
    ["rs 25000 max", 25_000],
    ["between 50k and 70k", 70_000],
    ["around 1 lac", 100_000],
  ])("%s → %i", (text, expected) => {
    expect(parseBudget(text)).toBe(expected);
  });

  it("ignores specs that look like numbers", () => {
    expect(parseBudget("phone with 5000 mah battery under 20k")).toBe(20_000);
    expect(parseBudget("16gb ram laptop")).toBeNull();
  });
});

describe("parseQueryWithRules", () => {
  it("parses the example from the brief", () => {
    expect(parseQueryWithRules("laptop under seventy thousand for coding and light gaming")).toEqual({
      category: "laptop",
      useCase: "coding",
      budget: 70_000,
    });
  });

  it("infers category from a category-specific use case", () => {
    expect(parseQueryWithRules("best camera under 40k")).toMatchObject({ category: "phone", useCase: "photography" });
    expect(parseQueryWithRules("something for college notes, 50000")).toMatchObject({ category: "laptop", useCase: "student" });
  });

  it("handles phone gaming and battery requests", () => {
    expect(parseQueryWithRules("mobile for bgmi under 30k")).toEqual({ category: "phone", useCase: "gaming", budget: 30_000 });
    expect(parseQueryWithRules("phone with long lasting battery below 20,000")).toMatchObject({ useCase: "battery", budget: 20_000 });
  });

  it("returns nulls for what the sentence doesn't say", () => {
    expect(parseQueryWithRules("I need a laptop")).toEqual({ category: "laptop", useCase: null, budget: null });
    expect(parseQueryWithRules("gaming under 90k")).toEqual({ category: null, useCase: null, budget: 90_000 });
  });
});

describe("resolveQuery", () => {
  it("fills gaps from the fallback parse and defaults, and clamps the budget", async () => {
    const { resolveQuery } = await import("../resolve");
    const result = resolveQuery(
      { category: "phone", useCase: null, budget: 2_000_000 },
      { category: "phone", useCase: "photography", budget: null },
      "claude",
    );
    expect(result).toEqual({
      category: "phone",
      useCase: "photography",
      budget: 180_000,
      source: "claude",
      assumed: [],
      requestedBudget: 2_000_000,
    });
  });

  it("rejects use cases from the wrong category and marks assumptions", async () => {
    const { resolveQuery } = await import("../resolve");
    const result = resolveQuery({ category: "laptop", useCase: "photography", budget: null }, { category: null, useCase: null, budget: null }, "rules");
    expect(result).toMatchObject({ useCase: "all-rounder", budget: 80_000, assumed: ["useCase", "budget"] });
  });

  it("throws when the category is unknown", async () => {
    const { resolveQuery, UnclearCategoryError } = await import("../resolve");
    expect(() => resolveQuery({ category: null, useCase: null, budget: 1 }, { category: null, useCase: null, budget: 1 }, "rules")).toThrow(UnclearCategoryError);
  });
});
