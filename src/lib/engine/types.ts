export type Category = "laptop" | "phone";

export type FactorKey =
  | "cpu"
  | "gpu"
  | "camera"
  | "display"
  | "ram"
  | "storage"
  | "battery"
  | "charging"
  | "portability"
  | "price";

export type LaptopUseCase =
  | "gaming"
  | "coding"
  | "video-editing"
  | "student"
  | "all-rounder";

export type PhoneUseCase =
  | "photography"
  | "gaming"
  | "battery"
  | "budget"
  | "all-rounder";

export type UseCase = LaptopUseCase | PhoneUseCase;

/**
 * The engine's view of a device. Framework- and database-agnostic: callers map
 * their own records into this shape.
 */
export interface EngineDevice {
  id: string;
  slug: string;
  category: Category;
  brand: string;
  name: string;
  /** Whole rupees. */
  price: number;
  specs: DeviceSpecs;
}

export interface DeviceSpecs {
  /** Pre-normalized 0–100 tiers. */
  cpuScore: number;
  gpuScore?: number | null;
  cameraScore?: number | null;
  displayScore: number;
  /** Raw values. Null means the spec sheet doesn't list it. */
  ramGb: number;
  storageGb: number;
  /** Watt-hours for laptops, mAh for phones. */
  batteryCapacity: number | null;
  chargingWatts?: number | null;
  weightGrams: number | null;
}

export interface ScoringContext {
  budget: number;
}

export type Direction = "higher" | "lower";

export interface FactorDefinition {
  key: FactorKey;
  label: string;
  /** Reads "<adjective> <noun>", e.g. "excellent graphics performance". */
  noun: string;
  /** Standalone phrase for a weak showing, e.g. "a comparatively heavy build". */
  weakPhrase: string;
  direction: Direction;
  read: (device: EngineDevice) => number | null;
  /** Maps a raw value onto an absolute 0–100 scale, independent of the pool. */
  absolute: (value: number, ctx: ScoringContext) => number;
  format: (value: number) => string;
}

export interface UseCaseProfile {
  id: UseCase;
  category: Category;
  label: string;
  description: string;
  /** Fractions that sum to 1. Factors not listed carry no weight. */
  weights: Partial<Record<FactorKey, number>>;
  /**
   * Baselines on the absolute 0–100 scale for factors the use case can't do
   * without. A weighted sum lets strengths elsewhere paper over a critical gap
   * (a great screen doesn't make integrated graphics good for gaming), so falling
   * short of a baseline scales the whole match score down.
   */
  baselines?: Partial<Record<FactorKey, number>>;
  /** True when the weights came from the viewer (quiz or sliders), not the preset. */
  custom?: boolean;
}

export interface BaselinePenalty {
  key: FactorKey;
  label: string;
  baseline: number;
  absolute: number;
  /** Multiplier applied to the weighted score, in (0, 1]. */
  multiplier: number;
}

export interface FactorScore {
  key: FactorKey;
  label: string;
  weight: number;
  rawValue: number | null;
  displayValue: string;
  /** Against fixed reference ranges. */
  absolute: number;
  /** Min–max within the current pool; null when the pool can't differentiate. */
  relative: number | null;
  /** Blended 0–100 sub-score. */
  score: number;
  /** weight × score — these sum to the weighted score. */
  contribution: number;
  /**
   * True when the device doesn't list this spec. The sub-score is then the median
   * of the devices that do, so a missing number neither helps nor hurts the ranking.
   */
  estimated: boolean;
}

export interface Explanation {
  summary: string;
  strengths: string[];
  tradeoffs: string[];
}

export interface ScoredDevice {
  device: EngineDevice;
  /** Weighted sum of sub-scores, before baseline penalties. */
  weightedScore: number;
  /** weightedScore × every penalty multiplier. */
  matchScore: number;
  penalties: BaselinePenalty[];
  valueScore: number;
  matchRank: number;
  valueRank: number;
  breakdown: FactorScore[];
  explanation: Explanation;
}

export type SortMode = "match" | "value";
