import { describe, expect, it } from "vitest";
import { bezier, bezierTimeFor, INTRO_CUES } from "../sound";

/** The curve the proof counter runs on, from `.intro-progress-bar` in globals.css. */
const PROOF = [0.45, 0.05, 0.25, 1] as const;

describe("bezier easing", () => {
  it("pins both ends of the curve", () => {
    expect(bezier(...PROOF, 0)).toBe(0);
    expect(bezier(...PROOF, 1)).toBe(1);
    expect(bezierTimeFor(...PROOF, 0)).toBe(0);
    expect(bezierTimeFor(...PROOF, 1)).toBe(1);
  });

  it("clamps outside 0–1 instead of running off the curve", () => {
    expect(bezier(...PROOF, -0.5)).toBe(0);
    expect(bezier(...PROOF, 1.5)).toBe(1);
    expect(bezierTimeFor(...PROOF, -0.5)).toBe(0);
    expect(bezierTimeFor(...PROOF, 1.5)).toBe(1);
  });

  it("rises without ever going backwards", () => {
    let last = -1;
    for (let i = 0; i <= 50; i += 1) {
      const y = bezier(...PROOF, i / 50);
      expect(y).toBeGreaterThanOrEqual(last);
      last = y;
    }
  });

  it("matches linear when the handles sit on the diagonal", () => {
    for (const x of [0.2, 0.5, 0.75]) {
      expect(bezier(1 / 3, 1 / 3, 2 / 3, 2 / 3, x)).toBeCloseTo(x, 5);
    }
  });

  it("inverts itself: the time for a progress lands back on that progress", () => {
    for (const progress of [0.1, 0.25, 0.5, 0.8, 0.95]) {
      expect(bezier(...PROOF, bezierTimeFor(...PROOF, progress))).toBeCloseTo(progress, 4);
    }
  });

  it("front-loads the proof: half the bar is filled well before half the time", () => {
    expect(bezierTimeFor(...PROOF, 0.5)).toBeLessThan(0.45);
    // ...so the tail is the slow part, and the ratchet thins out towards 100%.
    expect(bezier(...PROOF, 0.5)).toBeGreaterThan(0.5);
  });
});

describe("intro cues", () => {
  it("are ordered and land inside the 4.7s the curtain is on screen", () => {
    let last = -1;
    for (const cue of INTRO_CUES) {
      expect(cue.at).toBeGreaterThanOrEqual(last);
      expect(cue.at).toBeGreaterThanOrEqual(0);
      expect(cue.at).toBeLessThan(4.7);
      last = cue.at;
    }
  });

  it("score every beat of the print", () => {
    const voices = new Set(INTRO_CUES.map((c) => c.voice));
    expect(voices).toEqual(new Set(["plate", "roller", "ratchet", "sheet"]));
  });

  it("open on the plate landing and close on the sheet lifting", () => {
    expect(INTRO_CUES[0]).toMatchObject({ voice: "plate", at: 0.1 });
    expect(INTRO_CUES.at(-1)).toMatchObject({ voice: "sheet", at: 3.75 });
  });

  it("keep every cue quiet enough to sit under the others", () => {
    for (const cue of INTRO_CUES) {
      expect(cue.gain ?? 1).toBeGreaterThan(0);
      expect(cue.gain ?? 1).toBeLessThanOrEqual(1);
    }
  });

  it("ratchet the proof between the bar's own start and end", () => {
    const ticks = INTRO_CUES.filter((c) => c.voice === "ratchet");
    expect(ticks).toHaveLength(25);
    // .intro-progress-bar runs 0.5s → 3.3s.
    expect(ticks[0].at).toBeGreaterThan(0.5);
    expect(ticks.at(-1)!.at).toBeCloseTo(3.3, 5);
  });

  it("space the ratchet by the bar's easing, not evenly", () => {
    const ticks = INTRO_CUES.filter((c) => c.voice === "ratchet");
    const gaps = ticks.slice(1).map((t, i) => t.at - ticks[i].at);
    // Slow at the start, quickest in the middle, slowing again at the end.
    expect(gaps[0]).toBeGreaterThan(Math.min(...gaps) * 1.5);
    expect(gaps.at(-1)!).toBeGreaterThan(Math.min(...gaps) * 1.5);
    expect(Math.min(...gaps)).toBeGreaterThan(0);
  });
});
