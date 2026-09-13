import type { Category, UseCase, UseCaseProfile } from "./types";

export const LAPTOP_PROFILES: UseCaseProfile[] = [
  {
    id: "gaming",
    category: "laptop",
    label: "Gaming",
    description: "High frame rates in modern games. Graphics first, then processor and a fast screen.",
    weights: { gpu: 0.42, cpu: 0.2, display: 0.12, ram: 0.11, storage: 0.08, battery: 0.04, portability: 0.03 },
    baselines: { gpu: 36 },
  },
  {
    id: "coding",
    category: "laptop",
    label: "Coding",
    description: "Compiles, containers and many open tabs. Processor and memory matter most.",
    weights: { cpu: 0.3, ram: 0.25, battery: 0.13, storage: 0.12, display: 0.08, portability: 0.08, gpu: 0.04 },
    baselines: { cpu: 30, ram: 50 },
  },
  {
    id: "video-editing",
    category: "laptop",
    label: "Video editing",
    description: "Timeline scrubbing and exports. Balanced CPU and GPU muscle, plenty of RAM and an accurate screen.",
    weights: { cpu: 0.27, gpu: 0.23, ram: 0.18, display: 0.15, storage: 0.14, battery: 0.02, portability: 0.01 },
    baselines: { cpu: 44, gpu: 24, ram: 50 },
  },
  {
    id: "student",
    category: "laptop",
    label: "Student & everyday",
    description: "All-day battery and a bag-friendly weight, without overspending on power you won't use.",
    weights: { battery: 0.28, portability: 0.24, cpu: 0.14, ram: 0.1, storage: 0.08, display: 0.08, price: 0.08 },
  },
  {
    id: "all-rounder",
    category: "laptop",
    label: "All-rounder",
    description: "A little of everything. No single spec dominates.",
    weights: { cpu: 0.2, battery: 0.16, portability: 0.16, ram: 0.14, display: 0.14, gpu: 0.1, storage: 0.1 },
  },
];

export const PHONE_PROFILES: UseCaseProfile[] = [
  {
    id: "photography",
    category: "phone",
    label: "Photography",
    description: "The best camera system you can get, with room to store what you shoot.",
    weights: { camera: 0.55, display: 0.12, cpu: 0.1, storage: 0.09, battery: 0.07, ram: 0.04, charging: 0.03 },
    baselines: { camera: 60 },
  },
  {
    id: "gaming",
    category: "phone",
    label: "Gaming",
    description: "A flagship-class chipset, a smooth display and a battery that survives long sessions.",
    weights: { cpu: 0.35, display: 0.18, ram: 0.14, battery: 0.14, charging: 0.09, storage: 0.07, camera: 0.03 },
    baselines: { cpu: 60 },
  },
  {
    id: "battery",
    category: "phone",
    label: "Battery life",
    description: "Lasts the longest between charges and refills quickly when it doesn't.",
    weights: { battery: 0.45, charging: 0.22, cpu: 0.1, display: 0.08, camera: 0.07, ram: 0.04, storage: 0.04 },
    baselines: { battery: 40 },
  },
  {
    id: "budget",
    category: "phone",
    label: "Budget-conscious",
    description: "The essentials done well, with saving money treated as a feature.",
    weights: { price: 0.3, cpu: 0.16, battery: 0.16, camera: 0.12, display: 0.1, storage: 0.08, ram: 0.08 },
  },
  {
    id: "all-rounder",
    category: "phone",
    label: "All-rounder",
    description: "Good camera, good speed, good battery. No single spec dominates.",
    weights: { camera: 0.2, cpu: 0.2, battery: 0.17, display: 0.15, charging: 0.08, storage: 0.08, ram: 0.07, portability: 0.05 },
  },
];

export const PROFILES: Record<Category, UseCaseProfile[]> = {
  laptop: LAPTOP_PROFILES,
  phone: PHONE_PROFILES,
};

export function getProfile(category: Category, useCase: UseCase): UseCaseProfile | undefined {
  return PROFILES[category].find((p) => p.id === useCase);
}

export function requireProfile(category: Category, useCase: UseCase): UseCaseProfile {
  const profile = getProfile(category, useCase);
  if (!profile) throw new Error(`Unknown use case "${useCase}" for ${category}`);
  return profile;
}
