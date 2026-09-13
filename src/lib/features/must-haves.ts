import type { Category } from "@/lib/engine";

/** The spec fields a must-have can test. Unlisted (null) values never pass. */
export interface MustHaveSubject {
  category: Category;
  displayName: string;
  gpuName: string | null;
  cameraName: string | null;
  ramGb: number;
  storageGb: number;
  batteryCapacity: number | null;
  chargingWatts: number | null;
  weightGrams: number | null;
}

export interface MustHave {
  id: string;
  label: string;
  category: Category;
  test: (d: MustHaveSubject) => boolean;
}

const refreshHz = (d: MustHaveSubject) => Number(d.displayName.match(/(\d+)\s*Hz/i)?.[1] ?? 0);
const inches = (d: MustHaveSubject) => Number(d.displayName.match(/^([\d.]+)"/)?.[1] ?? 0);
const isOled = (d: MustHaveSubject) => /OLED/i.test(d.displayName);

export const MUST_HAVES: MustHave[] = [
  // Phones
  { id: "oled", label: "OLED screen", category: "phone", test: isOled },
  { id: "hz120", label: "120Hz or faster", category: "phone", test: (d) => refreshHz(d) >= 120 },
  { id: "telephoto", label: "Zoom (telephoto) camera", category: "phone", test: (d) => /tele|periscope|\d(\.\d)?x\b/i.test(d.cameraName ?? "") },
  { id: "battery6000", label: "6,000 mAh+ battery", category: "phone", test: (d) => (d.batteryCapacity ?? 0) >= 6000 },
  { id: "charge65", label: "65W+ charging", category: "phone", test: (d) => (d.chargingWatts ?? 0) >= 65 },
  { id: "ram12", label: "12GB+ RAM", category: "phone", test: (d) => d.ramGb >= 12 },
  { id: "storage256", label: "256GB+ storage", category: "phone", test: (d) => d.storageGb >= 256 },
  { id: "compact", label: "Compact (6.4\" or smaller)", category: "phone", test: (d) => inches(d) > 0 && inches(d) <= 6.4 },
  // Laptops
  { id: "rtx", label: "NVIDIA RTX graphics", category: "laptop", test: (d) => /RTX/i.test(d.gpuName ?? "") },
  { id: "oled", label: "OLED screen", category: "laptop", test: isOled },
  { id: "hz120", label: "120Hz or faster", category: "laptop", test: (d) => refreshHz(d) >= 120 },
  { id: "ram16", label: "16GB+ RAM", category: "laptop", test: (d) => d.ramGb >= 16 },
  { id: "ram32", label: "32GB+ RAM", category: "laptop", test: (d) => d.ramGb >= 32 },
  { id: "storage1tb", label: "1TB+ storage", category: "laptop", test: (d) => d.storageGb >= 1024 },
  { id: "light", label: "Under 1.5 kg", category: "laptop", test: (d) => d.weightGrams !== null && d.weightGrams < 1500 },
  { id: "battery60", label: "60Wh+ battery", category: "laptop", test: (d) => (d.batteryCapacity ?? 0) >= 60 },
];

export function mustHavesFor(category: Category): MustHave[] {
  return MUST_HAVES.filter((m) => m.category === category);
}

/** Parses `oled,hz120` into known must-have ids for the category, dropping anything else. */
export function parseMustHaves(category: Category, encoded: string | null | undefined): string[] {
  if (!encoded) return [];
  const known = new Set(mustHavesFor(category).map((m) => m.id));
  return [...new Set(encoded.split(",").map((s) => s.trim()))].filter((id) => known.has(id));
}

/** True when the device passes every selected must-have. */
export function meetsMustHaves(device: MustHaveSubject, ids: string[]): boolean {
  if (ids.length === 0) return true;
  const checks = mustHavesFor(device.category).filter((m) => ids.includes(m.id));
  return checks.every((m) => m.test(device));
}
