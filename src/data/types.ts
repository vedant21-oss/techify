export type PhonePanel = "LCD" | "OLED" | "LTPO OLED";
export type LaptopPanel = "TN" | "LCD" | "OLED" | "Liquid Retina" | "Liquid Retina XDR";

export interface DisplaySpec<Panel extends string> {
  sizeIn: number;
  panel: Panel;
  /** Pixels on the short edge × long edge, as spec sheets list them. */
  width: number;
  height: number;
  refreshHz: number;
}

interface SeedBase {
  slug: string;
  brand: string;
  name: string;
  variant: string;
  /** Whole rupees for the listed variant, as checked on `PRICE_CHECKED_ON`. */
  price: number;
  releaseYear: number;
  /** Must match a key in src/data/tiers.ts. */
  cpuName: string;
  ramGb: number;
  storageGb: number;
  /** Null when the spec sheet doesn't list it; the engine then scores it as typical. */
  batteryCapacity: number | null;
  chargingWatts?: number | null;
  weightGrams: number | null;
  /** Where the price and specs were checked. */
  source: string;
  searchQuery?: string;
}

export interface SeedLaptop extends SeedBase {
  /** Must match a key in src/data/tiers.ts. */
  gpuName: string;
  display: DisplaySpec<LaptopPanel>;
}

export interface SeedPhone extends SeedBase {
  display: DisplaySpec<PhonePanel>;
  cameraName: string;
  /**
   * Curated 0–100 camera tier: sensor size and processing for the main camera,
   * plus credit for dedicated telephoto or periscope lenses.
   */
  cameraScore: number;
}
