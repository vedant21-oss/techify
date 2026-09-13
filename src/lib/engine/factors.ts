import { formatNumber, formatPrice, formatStorage, formatWeight } from "./format";
import { clamp, inverseLinearScale, linearScale, logScale } from "./scales";
import type { Category, FactorDefinition, FactorKey } from "./types";

/*
 * Reference ranges define the absolute 0–100 scale for raw specs. They are set to
 * roughly span the Indian market in each category: the low end is what a
 * bottom-of-the-market device ships with, the high end is where extra capacity
 * stops making a practical difference.
 */

const tier = (value: number) => clamp(value);

const price: FactorDefinition = {
  key: "price",
  label: "Price",
  noun: "pricing for your budget",
  weakPhrase: "a price near the top of your budget",
  direction: "lower",
  read: (d) => d.price,
  // Spending 40% of the budget or less earns full marks; spending all of it earns none.
  absolute: (value, ctx) => inverseLinearScale(value / ctx.budget, 0.4, 1),
  format: formatPrice,
};

const laptopFactors: Partial<Record<FactorKey, FactorDefinition>> = {
  cpu: {
    key: "cpu",
    label: "Processor",
    noun: "processor performance",
    weakPhrase: "a slower processor",
    direction: "higher",
    read: (d) => d.specs.cpuScore,
    absolute: tier,
    format: (v) => `${v}/100 tier`,
  },
  gpu: {
    key: "gpu",
    label: "Graphics",
    noun: "graphics performance",
    weakPhrase: "weak graphics performance",
    direction: "higher",
    read: (d) => d.specs.gpuScore ?? null,
    absolute: tier,
    format: (v) => `${v}/100 tier`,
  },
  display: {
    key: "display",
    label: "Display",
    noun: "display quality",
    weakPhrase: "a basic display",
    direction: "higher",
    read: (d) => d.specs.displayScore,
    absolute: tier,
    format: (v) => `${v}/100 tier`,
  },
  ram: {
    key: "ram",
    label: "Memory",
    noun: "memory headroom",
    weakPhrase: "limited RAM",
    direction: "higher",
    read: (d) => d.specs.ramGb,
    absolute: (v) => logScale(v, 4, 64),
    format: (v) => `${v} GB`,
  },
  storage: {
    key: "storage",
    label: "Storage",
    noun: "storage space",
    weakPhrase: "limited storage",
    direction: "higher",
    read: (d) => d.specs.storageGb,
    absolute: (v) => logScale(v, 128, 2048),
    format: formatStorage,
  },
  battery: {
    key: "battery",
    label: "Battery",
    noun: "battery capacity",
    weakPhrase: "a smaller battery",
    direction: "higher",
    read: (d) => d.specs.batteryCapacity ?? null,
    absolute: (v) => linearScale(v, 35, 90),
    format: (v) => `${v} Wh`,
  },
  portability: {
    key: "portability",
    label: "Portability",
    noun: "portability",
    weakPhrase: "a comparatively heavy build",
    direction: "lower",
    read: (d) => d.specs.weightGrams ?? null,
    absolute: (v) => inverseLinearScale(v, 1100, 2800),
    format: (v) => formatWeight(v, "kg"),
  },
  price,
};

const phoneFactors: Partial<Record<FactorKey, FactorDefinition>> = {
  cpu: {
    key: "cpu",
    label: "Performance",
    noun: "chipset performance",
    weakPhrase: "a slower chipset",
    direction: "higher",
    read: (d) => d.specs.cpuScore,
    absolute: tier,
    format: (v) => `${v}/100 tier`,
  },
  camera: {
    key: "camera",
    label: "Camera",
    noun: "camera quality",
    weakPhrase: "an average camera",
    direction: "higher",
    read: (d) => d.specs.cameraScore ?? null,
    absolute: tier,
    format: (v) => `${v}/100 tier`,
  },
  display: {
    key: "display",
    label: "Display",
    noun: "display quality",
    weakPhrase: "a basic display",
    direction: "higher",
    read: (d) => d.specs.displayScore,
    absolute: tier,
    format: (v) => `${v}/100 tier`,
  },
  ram: {
    key: "ram",
    label: "Memory",
    noun: "memory headroom",
    weakPhrase: "limited RAM",
    direction: "higher",
    read: (d) => d.specs.ramGb,
    absolute: (v) => logScale(v, 4, 16),
    format: (v) => `${v} GB`,
  },
  storage: {
    key: "storage",
    label: "Storage",
    noun: "storage space",
    weakPhrase: "limited storage",
    direction: "higher",
    read: (d) => d.specs.storageGb,
    absolute: (v) => logScale(v, 64, 1024),
    format: formatStorage,
  },
  battery: {
    key: "battery",
    label: "Battery",
    noun: "battery capacity",
    weakPhrase: "a smaller battery",
    direction: "higher",
    read: (d) => d.specs.batteryCapacity ?? null,
    absolute: (v) => linearScale(v, 3000, 8000),
    format: (v) => `${formatNumber(v)} mAh`,
  },
  charging: {
    key: "charging",
    label: "Charging",
    noun: "charging speed",
    weakPhrase: "slow charging",
    direction: "higher",
    read: (d) => d.specs.chargingWatts ?? null,
    absolute: (v) => logScale(v, 15, 120),
    format: (v) => `${v} W`,
  },
  portability: {
    key: "portability",
    label: "Portability",
    noun: "in-hand comfort",
    weakPhrase: "a heavier body",
    direction: "lower",
    read: (d) => d.specs.weightGrams ?? null,
    absolute: (v) => inverseLinearScale(v, 165, 235),
    format: (v) => formatWeight(v, "g"),
  },
  price,
};

export const FACTORS: Record<Category, Partial<Record<FactorKey, FactorDefinition>>> = {
  laptop: laptopFactors,
  phone: phoneFactors,
};

export function getFactor(category: Category, key: FactorKey): FactorDefinition {
  const factor = FACTORS[category][key];
  if (!factor) throw new Error(`Factor "${key}" is not defined for ${category}`);
  return factor;
}
