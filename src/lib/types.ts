import type { BuyLink } from "@/lib/buy-links";
import type {
  BaselinePenalty,
  Category,
  Explanation,
  FactorScore,
  SortMode,
  UseCase,
} from "@/lib/engine";

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
}

export interface RecommendationResponse {
  query: ScoringQuery;
  poolSize: number;
  results: RecommendationItem[];
  /** When nothing fits the budget, the cheapest device in the category. */
  cheapestAvailable: DeviceDTO | null;
}

export interface DeviceDetailResponse {
  query: ScoringQuery;
  poolSize: number;
  item: RecommendationItem;
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
