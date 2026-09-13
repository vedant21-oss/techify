import type { Category, UseCase } from "@/lib/engine";

/** What a parser could extract. Null means the sentence didn't say. */
export interface ParsedQuery {
  category: Category | null;
  useCase: UseCase | null;
  budget: number | null;
}

/** The fully-resolved finder inputs returned to the browser. */
export interface ParseQueryResponse {
  category: Category;
  useCase: UseCase;
  budget: number;
  source: "claude" | "rules";
  /** Fields that weren't in the sentence and fell back to defaults. */
  assumed: ("useCase" | "budget")[];
  /** The budget the sentence asked for, before clamping to the slider range. */
  requestedBudget: number | null;
}
