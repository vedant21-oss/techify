import type { BuyLink } from "@/lib/buy-links";
import type {
  BaselinePenalty,
  Category,
  Explanation,
  FactorScore,
  GapExplanation,
  SortMode,
  UseCase,
  Verdict,
  WeightMap,
} from "@/lib/engine";
import type { CardOffer, Payment, PaymentQuote } from "@/lib/features/offers";
import type { FactorChange, UpgradeLevel } from "@/lib/features/upgrade";
import type { PriceSummary } from "@/lib/features/price-history";

/** A device as sent to the browser. */
export interface DeviceDTO {
  id: string;
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
  ramGb: number;
  storageGb: number;
  batteryCapacity: number | null;
  chargingWatts: number | null;
  weightGrams: number | null;
  /** ISO date the price was last checked. */
  priceCheckedOn: string;
  priceSource: string;
  buyLinks: BuyLink[];
}

export interface RecommendationItem {
  device: DeviceDTO;
  matchScore: number;
  weightedScore: number;
  valueScore: number;
  matchRank: number;
  valueRank: number;
  inBudget: boolean;
  /** What the buyer pays with the card they chose; null when no card is chosen. */
  payment: PaymentQuote | null;
  penalties: BaselinePenalty[];
  breakdown: FactorScore[];
  explanation: Explanation;
}

export interface ScoringQuery {
  category: Category;
  useCase: UseCase;
  useCaseLabel: string;
  budget: number;
  sort: SortMode;
  weights: WeightMap | null;
  /** The weights actually used (preset or custom), as fractions. */
  effectiveWeights: WeightMap;
  mustHaves: string[];
  custom: boolean;
  /** The buyer's card. When set, prices (and so budget and value) are after its best offer. */
  payment: Payment | null;
}

export interface RecommendationResponse {
  query: ScoringQuery;
  poolSize: number;
  results: RecommendationItem[];
  /** When nothing fits the budget, the cheapest device in the category. */
  cheapestAvailable: DeviceDTO | null;
}

export interface ReviewDTO {
  id: string;
  name: string;
  rating: number;
  title: string;
  body: string;
  usedFor: string;
  ownedMonths: number;
  createdAt: string;
}

export interface DeviceDetailResponse {
  query: ScoringQuery;
  poolSize: number;
  item: RecommendationItem;
  leader: RecommendationItem | null;
  gap: GapExplanation | null;
  priceHistory: {
    points: { price: number; recordedAt: string }[];
    summary: Omit<PriceSummary, "trackingSince"> & { trackingSince: string | null };
  };
  reviews: { average: number | null; count: number; items: ReviewDTO[] };
  /** Card offers running now, biggest discount first. */
  offers: CardOffer[];
  alternatives: {
    cheaper: RecommendationItem | null;
    better: RecommendationItem | null;
    similar: RecommendationItem[];
  };
}

export interface PickItem {
  kind: "week" | "year";
  category: Category;
  period: string;
  method: string;
  item: RecommendationItem;
}

export interface ComparisonResponse {
  query: ScoringQuery;
  poolSize: number;
  items: RecommendationItem[];
  missing: string[];
}

export interface VersusResponse {
  category: Category;
  a: DeviceDTO;
  b: DeviceDTO;
  budget: number;
  poolSize: number;
  verdicts: {
    useCase: UseCase;
    label: string;
    aScore: number;
    bScore: number;
    verdict: Verdict;
  }[];
  wins: { a: number; b: number; tie: number };
}

/**
 * The little a comparison picker needs: enough to search on and enough to show.
 * Deliberately not a DeviceDTO — the whole catalogue is sent to the browser, so it
 * carries the search fields and nothing else.
 */
export interface ComparableDevice {
  slug: string;
  category: Category;
  brand: string;
  name: string;
  variant: string;
  price: number;
  releaseYear: number;
  cpuName: string;
  gpuName: string | null;
}

export interface BrandSummary {
  brand: string;
  slug: string;
  laptops: number;
  phones: number;
  minPrice: number;
  maxPrice: number;
}

export interface DealItem {
  device: DeviceDTO;
  previous: number;
  change: number;
  changePercent: number;
  isLowest: boolean;
  changedAt: string;
}

/** The device an upgrade starts from: one on sale, or an older one that isn't. */
export type OwnedDeviceDTO = Pick<
  DeviceDTO,
  | "slug"
  | "category"
  | "brand"
  | "name"
  | "variant"
  | "releaseYear"
  | "cpuName"
  | "gpuName"
  | "displayName"
  | "cameraName"
  | "ramGb"
  | "storageGb"
  | "batteryCapacity"
  | "chargingWatts"
  | "weightGrams"
> & {
  /** Today's price when it's still on sale; null for devices no longer sold. */
  price: number | null;
};

/** A device the upgrade picker can start from. `price` is 0 for devices no longer sold. */
export interface UpgradeStart extends ComparableDevice {
  onSale: boolean;
}

export interface UpgradeOptionDTO {
  item: RecommendationItem;
  gain: number;
  level: UpgradeLevel;
  gainPer10k: number;
  improvements: FactorChange[];
  downgrades: FactorChange[];
}

export interface UpgradeResponse {
  query: ScoringQuery;
  poolSize: number;
  current: { device: OwnedDeviceDTO; matchScore: number; breakdown: FactorScore[] };
  /** Clear and big upgrades, biggest gain first. */
  upgrades: UpgradeOptionDTO[];
  smallSteps: number;
  /** Score clearly higher, but not on what the use case needs most. */
  sidegrades: number;
  /** Slugs into `upgrades`. */
  picks: { cheapest: string | null; biggest: string | null; bestPerRupee: string | null };
}
