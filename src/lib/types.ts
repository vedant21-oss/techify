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

export interface DealItem {
  device: DeviceDTO;
  previous: number;
  change: number;
  changePercent: number;
  isLowest: boolean;
  changedAt: string;
}
