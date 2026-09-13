import type { DisplaySpec, LaptopPanel, PhonePanel } from "./types";

/*
 * Display tiers derived from the spec sheet instead of hand-picked. Panel type sets
 * the base, then refresh rate and resolution add or subtract. Capped at 100.
 */

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function refreshBonus(hz: number, steps: [number, number][]): number {
  let bonus = 0;
  for (const [minHz, points] of steps) if (hz >= minHz) bonus = points;
  return bonus;
}

const PHONE_PANEL_BASE: Record<PhonePanel, number> = { LCD: 28, OLED: 58, "LTPO OLED": 66 };

export function phoneDisplayScore(d: DisplaySpec<PhonePanel>): number {
  const shortEdge = Math.min(d.width, d.height);
  const resolution = shortEdge <= 800 ? -8 : shortEdge <= 1100 ? 0 : shortEdge < 1400 ? 6 : 10;
  const refresh = refreshBonus(d.refreshHz, [
    [90, 4],
    [120, 12],
    [144, 15],
    [165, 17],
  ]);
  return clamp(PHONE_PANEL_BASE[d.panel] + resolution + refresh);
}

const LAPTOP_PANEL_BASE: Record<LaptopPanel, number> = {
  TN: 18,
  LCD: 32,
  "Liquid Retina": 58,
  OLED: 62,
  "Liquid Retina XDR": 88,
};

export function laptopDisplayScore(d: DisplaySpec<LaptopPanel>): number {
  const longEdge = Math.max(d.width, d.height);
  const resolution = longEdge < 1600 ? -6 : longEdge < 2000 ? 0 : longEdge < 2400 ? 3 : longEdge < 2800 ? 8 : longEdge < 3200 ? 11 : 14;
  const refresh = refreshBonus(d.refreshHz, [
    [90, 3],
    [120, 8],
    [144, 9],
    [165, 10],
    [240, 12],
  ]);
  return clamp(LAPTOP_PANEL_BASE[d.panel] + resolution + refresh);
}

const RESOLUTION_NAMES: [number, string][] = [
  [3800, "4K"],
  [2880, "3K"],
  [2560, "2.5K"],
  [2400, "2.4K"],
  [1900, "FHD"],
  [0, "HD"],
];

function resolutionName(longEdge: number, shortEdge: number, isPhone: boolean): string {
  if (isPhone) {
    if (shortEdge >= 1400) return "QHD+";
    if (shortEdge > 1100) return "1.5K";
    if (shortEdge > 800) return "FHD+";
    return "HD+";
  }
  return RESOLUTION_NAMES.find(([min]) => longEdge >= min)![1];
}

export function describeDisplay(d: DisplaySpec<string>, isPhone: boolean): string {
  const longEdge = Math.max(d.width, d.height);
  const shortEdge = Math.min(d.width, d.height);
  return `${d.sizeIn}" ${resolutionName(longEdge, shortEdge, isPhone)} ${d.panel}, ${d.refreshHz}Hz`;
}
