import type { Category, FactorKey, UseCase, WeightMap } from "@/lib/engine";

export interface QuizOption {
  id: string;
  label: string;
  hint?: string;
  /** Importance points added to each factor when chosen. */
  points: WeightMap;
  /** The preset whose baselines apply (first question only). */
  useCase?: UseCase;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface QuizDefinition {
  category: Category;
  questions: QuizQuestion[];
  budgets: number[];
}

export const QUIZZES: Record<Category, QuizDefinition> = {
  phone: {
    category: "phone",
    budgets: [15_000, 25_000, 40_000, 60_000, 100_000, 150_000],
    questions: [
      {
        id: "main",
        question: "What do you do most on your phone?",
        options: [
          { id: "photos", label: "Photos and videos", useCase: "photography", points: { camera: 40, display: 10, storage: 10 } },
          { id: "games", label: "Games", useCase: "gaming", points: { cpu: 35, display: 15, ram: 10, battery: 10 } },
          { id: "streaming", label: "Social, streaming, calls all day", useCase: "battery", points: { battery: 30, display: 15, charging: 10 } },
          { id: "mix", label: "A bit of everything", useCase: "all-rounder", points: { cpu: 15, camera: 15, battery: 15, display: 10 } },
        ],
      },
      {
        id: "battery",
        question: "How long should one charge last?",
        options: [
          { id: "day", label: "I charge every night", points: { battery: 5 } },
          { id: "heavy", label: "A heavy day, no top-ups", points: { battery: 15, charging: 5 } },
          { id: "two", label: "Two days if possible", points: { battery: 25, charging: 10 } },
        ],
      },
      {
        id: "camera",
        question: "How much does the camera matter?",
        options: [
          { id: "low", label: "Barely", points: { camera: 3 } },
          { id: "mid", label: "Good enough is fine", points: { camera: 10 } },
          { id: "high", label: "A lot", points: { camera: 25 } },
        ],
      },
      {
        id: "size",
        question: "What size do you like?",
        options: [
          { id: "compact", label: "Compact and light", points: { portability: 15 } },
          { id: "any", label: "No preference", points: { portability: 3 } },
          { id: "big", label: "Big screen", points: { display: 10 } },
        ],
      },
      {
        id: "spend",
        question: "How do you like to spend?",
        options: [
          { id: "value", label: "Best value for money", points: { price: 25 } },
          { id: "balanced", label: "Balanced", points: { price: 8 } },
          { id: "best", label: "Best I can afford", points: {} },
        ],
      },
    ],
  },
  laptop: {
    category: "laptop",
    budgets: [40_000, 60_000, 80_000, 110_000, 150_000, 250_000],
    questions: [
      {
        id: "main",
        question: "What will you mostly use it for?",
        options: [
          { id: "games", label: "Gaming", useCase: "gaming", points: { gpu: 40, cpu: 15, display: 10, ram: 10 } },
          { id: "code", label: "Coding", useCase: "coding", points: { cpu: 30, ram: 25, storage: 10 } },
          { id: "edit", label: "Video or photo editing", useCase: "video-editing", points: { cpu: 25, gpu: 20, ram: 15, display: 15, storage: 10 } },
          { id: "study", label: "College or office work", useCase: "student", points: { battery: 20, portability: 20, cpu: 10 } },
          { id: "mix", label: "A bit of everything", useCase: "all-rounder", points: { cpu: 15, battery: 10, portability: 10, display: 10, ram: 10 } },
        ],
      },
      {
        id: "carry",
        question: "How often will you carry it around?",
        options: [
          { id: "daily", label: "Every day", points: { portability: 25, battery: 15 } },
          { id: "sometimes", label: "Now and then", points: { portability: 10, battery: 8 } },
          { id: "desk", label: "It mostly stays on a desk", points: { portability: 2 } },
        ],
      },
      {
        id: "gaming",
        question: "Will you play games on it?",
        options: [
          { id: "serious", label: "Yes, recent big games", points: { gpu: 25 } },
          { id: "casual", label: "Light or older games", points: { gpu: 10 } },
          { id: "no", label: "No", points: {} },
        ],
      },
      {
        id: "screen",
        question: "How important is the screen?",
        options: [
          { id: "colour", label: "Very: colour and sharpness matter", points: { display: 20 } },
          { id: "nice", label: "Nice to have", points: { display: 8 } },
          { id: "any", label: "Any decent screen", points: { display: 2 } },
        ],
      },
      {
        id: "spend",
        question: "How do you like to spend?",
        options: [
          { id: "value", label: "Best value for money", points: { price: 20 } },
          { id: "balanced", label: "Balanced", points: { price: 6 } },
          { id: "best", label: "Best I can afford", points: {} },
        ],
      },
    ],
  },
};

export interface QuizResult {
  category: Category;
  useCase: UseCase;
  points: WeightMap;
  budget: number;
}

/**
 * Adds up the chosen answers into importance points. The first question picks the
 * preset (and its baselines); later answers only shift emphasis.
 */
export function scoreQuiz(category: Category, answers: Record<string, string>, budget: number): QuizResult {
  const quiz = QUIZZES[category];
  const points: WeightMap = {};
  let useCase: UseCase = "all-rounder";
  for (const question of quiz.questions) {
    const option = question.options.find((o) => o.id === answers[question.id]);
    if (!option) continue;
    if (option.useCase) useCase = option.useCase;
    for (const [key, value] of Object.entries(option.points) as [FactorKey, number][]) {
      points[key] = (points[key] ?? 0) + value;
    }
  }
  // Keep every weighted factor within the 1–100 URL range.
  const max = Math.max(1, ...Object.values(points).map((v) => v ?? 0));
  const scale = max > 100 ? 100 / max : 1;
  const scaled = Object.fromEntries(
    (Object.entries(points) as [FactorKey, number][]).map(([k, v]) => [k, Math.max(1, Math.round(v * scale))]),
  ) as WeightMap;
  return { category, useCase, points: scaled, budget };
}
