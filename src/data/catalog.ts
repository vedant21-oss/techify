import type { Category, EngineDevice } from "@/lib/engine";
import { describeDisplay, laptopDisplayScore, phoneDisplayScore } from "./display-score";
import { LAPTOPS_CHECKED_ON, laptops } from "./laptops";
import { PHONES_CHECKED_ON, phones } from "./phones";
import { LAPTOP_CPUS, LAPTOP_GPUS, lookupTier, PHONE_CHIPS } from "./tiers";

/** A seed device resolved into database columns: tiers looked up, display scored. */
export interface CatalogRecord {
  slug: string;
  category: Category;
  brand: string;
  name: string;
  variant: string;
  price: number;
  releaseYear: number;
  cpuName: string;
  gpuName: string | null;
  displayName: string;
  cameraName: string | null;
  cpuScore: number;
  gpuScore: number | null;
  cameraScore: number | null;
  displayScore: number;
  ramGb: number;
  storageGb: number;
  batteryCapacity: number | null;
  chargingWatts: number | null;
  weightGrams: number | null;
  searchQuery: string | null;
  priceCheckedOn: Date;
  priceSource: string;
}

export function buildCatalog(): CatalogRecord[] {
  const laptopRecords = laptops.map(
    (l): CatalogRecord => ({
      slug: l.slug,
      category: "laptop",
      brand: l.brand,
      name: l.name,
      variant: l.variant,
      price: l.price,
      releaseYear: l.releaseYear,
      cpuName: l.cpuName,
      gpuName: l.gpuName,
      displayName: describeDisplay(l.display, false),
      cameraName: null,
      cpuScore: lookupTier(LAPTOP_CPUS, l.cpuName, "laptop CPU"),
      gpuScore: lookupTier(LAPTOP_GPUS, l.gpuName, "laptop GPU"),
      cameraScore: null,
      displayScore: laptopDisplayScore(l.display),
      ramGb: l.ramGb,
      storageGb: l.storageGb,
      batteryCapacity: l.batteryCapacity,
      chargingWatts: null,
      weightGrams: l.weightGrams,
      searchQuery: l.searchQuery ?? null,
      priceCheckedOn: new Date(LAPTOPS_CHECKED_ON),
      priceSource: l.source,
    }),
  );
  const phoneRecords = phones.map(
    (p): CatalogRecord => ({
      slug: p.slug,
      category: "phone",
      brand: p.brand,
      name: p.name,
      variant: p.variant,
      price: p.price,
      releaseYear: p.releaseYear,
      cpuName: p.cpuName,
      gpuName: null,
      displayName: describeDisplay(p.display, true),
      cameraName: p.cameraName,
      cpuScore: lookupTier(PHONE_CHIPS, p.cpuName, "phone chipset"),
      gpuScore: null,
      cameraScore: p.cameraScore,
      displayScore: phoneDisplayScore(p.display),
      ramGb: p.ramGb,
      storageGb: p.storageGb,
      batteryCapacity: p.batteryCapacity,
      chargingWatts: p.chargingWatts ?? null,
      weightGrams: p.weightGrams,
      searchQuery: p.searchQuery ?? null,
      priceCheckedOn: new Date(PHONES_CHECKED_ON),
      priceSource: p.source,
    }),
  );
  return [...laptopRecords, ...phoneRecords];
}

/** The seed catalog in engine shape, keyed by slug. Used by tests. */
export function seedAsEngineDevices(): EngineDevice[] {
  return buildCatalog().map((r) => ({
    id: r.slug,
    slug: r.slug,
    category: r.category,
    brand: r.brand,
    name: r.name,
    price: r.price,
    specs: {
      cpuScore: r.cpuScore,
      gpuScore: r.gpuScore,
      cameraScore: r.cameraScore,
      displayScore: r.displayScore,
      ramGb: r.ramGb,
      storageGb: r.storageGb,
      batteryCapacity: r.batteryCapacity,
      chargingWatts: r.chargingWatts,
      weightGrams: r.weightGrams,
    },
  }));
}
