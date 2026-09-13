import "server-only";
import { cache } from "react";
import { buyLinks } from "@/lib/buy-links";
import { DEFAULT_USE_CASE, isUseCaseFor } from "@/lib/catalog-config";
import { prisma } from "@/lib/db";
import {
  decodeWeights,
  explainGap,
  headToHead,
  PROFILES,
  requireProfile,
  scorePool,
  selectPool,
  withCustomWeights,
  type Category,
  type EngineDevice,
  type ScoredDevice,
  type SortMode,
  type UseCase,
  type UseCaseProfile,
  type WeightMap,
} from "@/lib/engine";
import type {
  ComparisonResponse,
  DealItem,
  DeviceDetailResponse,
  DeviceDTO,
  PickItem,
  VersusResponse,
  RecommendationItem,
  RecommendationResponse,
  ScoringQuery,
} from "@/lib/types";
import type { Category as DbCategory, Device } from "@/generated/prisma/client";
import { findAlternatives } from "@/lib/features/alternatives";
import { pickOfTheWeek, pickOfTheYear, type EditorialPick } from "@/lib/features/picks";
import { searchDevices } from "@/lib/features/search";
import { meetsMustHaves, parseMustHaves, type MustHaveSubject } from "@/lib/features/must-haves";
import { isDeal, summarizePrices } from "@/lib/features/price-history";
import type { Lang } from "@/lib/i18n/config";
import { localizeGap, localizeScored, profileText } from "@/lib/i18n/engine-hi";
import { MESSAGES } from "@/lib/i18n/messages";

const toDbCategory = (c: Category): DbCategory => (c === "laptop" ? "LAPTOP" : "PHONE");
const fromDbCategory = (c: DbCategory): Category => (c === "LAPTOP" ? "laptop" : "phone");

/** One catalog read per category per request; the catalog is small enough to score in memory. */
const loadCategory = cache(async (category: Category): Promise<Device[]> =>
  prisma.device.findMany({ where: { category: toDbCategory(category) }, orderBy: { price: "asc" } }),
);

function toEngineDevice(d: Device): EngineDevice {
  return {
    id: d.id,
    slug: d.slug,
    category: fromDbCategory(d.category),
    brand: d.brand,
    name: d.name,
    price: d.price,
    specs: {
      cpuScore: d.cpuScore,
      gpuScore: d.gpuScore,
      cameraScore: d.cameraScore,
      displayScore: d.displayScore,
      ramGb: d.ramGb,
      storageGb: d.storageGb,
      batteryCapacity: d.batteryCapacity,
      chargingWatts: d.chargingWatts,
      weightGrams: d.weightGrams,
    },
  };
}

function toDTO(d: Device): DeviceDTO {
  return {
    id: d.id,
    slug: d.slug,
    category: fromDbCategory(d.category),
    brand: d.brand,
    name: d.name,
    variant: d.variant,
    price: d.price,
    releaseYear: d.releaseYear,
    cpuName: d.cpuName,
    gpuName: d.gpuName,
    displayName: d.displayName,
    cameraName: d.cameraName,
    ramGb: d.ramGb,
    storageGb: d.storageGb,
    batteryCapacity: d.batteryCapacity,
    chargingWatts: d.chargingWatts,
    weightGrams: d.weightGrams,
    priceCheckedOn: d.priceCheckedOn.toISOString(),
    priceSource: d.priceSource,
    buyLinks: buyLinks(d),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function toItem(scored: ScoredDevice, records: Map<string, Device>, budget: number): RecommendationItem {
  const record = records.get(scored.device.id)!;
  return {
    device: toDTO(record),
    matchScore: round1(scored.matchScore),
    weightedScore: round1(scored.weightedScore),
    valueScore: round1(scored.valueScore),
    matchRank: scored.matchRank,
    valueRank: scored.valueRank,
    inBudget: record.price <= budget,
    penalties: scored.penalties.map((p) => ({ ...p, absolute: round1(p.absolute), multiplier: round1(p.multiplier * 100) / 100 })),
    breakdown: scored.breakdown.map((f) => ({
      ...f,
      absolute: round1(f.absolute),
      relative: f.relative === null ? null : round1(f.relative),
      score: round1(f.score),
      contribution: round1(f.contribution),
    })),
    explanation: scored.explanation,
  };
}

function mustHaveSubject(d: Device): MustHaveSubject {
  return {
    category: fromDbCategory(d.category),
    displayName: d.displayName,
    gpuName: d.gpuName,
    cameraName: d.cameraName,
    ramGb: d.ramGb,
    storageGb: d.storageGb,
    batteryCapacity: d.batteryCapacity,
    chargingWatts: d.chargingWatts,
    weightGrams: d.weightGrams,
  };
}

function profileFor(category: Category, useCase: UseCase, weights: WeightMap | null): UseCaseProfile {
  const base = requireProfile(category, useCase);
  return weights ? withCustomWeights(base, weights) : base;
}

function buildQuery(
  profile: UseCaseProfile,
  useCase: UseCase,
  budget: number,
  sort: SortMode,
  weights: WeightMap | null,
  mustHaves: string[],
  lang: Lang,
): ScoringQuery {
  const label = profileText(lang, profile).label;
  return {
    category: profile.category,
    useCase,
    useCaseLabel: profile.custom ? MESSAGES[lang].finder.yourMix(label) : label,
    budget,
    sort,
    weights: profile.custom ? weights : null,
    effectiveWeights: profile.weights,
    mustHaves,
    custom: Boolean(profile.custom),
  };
}

export async function getRecommendations(params: {
  category: Category;
  useCase: UseCase;
  budget: number;
  sort: SortMode;
  weights?: WeightMap | null;
  mustHaves?: string[];
}, lang: Lang = "en"): Promise<RecommendationResponse> {
  const { category, useCase, budget, sort } = params;
  const weights = params.weights ?? null;
  const mustHaves = params.mustHaves ?? [];
  const records = (await loadCategory(category)).filter((r) => meetsMustHaves(mustHaveSubject(r), mustHaves));
  const byId = new Map(records.map((r) => [r.id, r]));
  const pool = selectPool(records.map(toEngineDevice), { category, useCase, budget });
  const profile = profileFor(category, useCase, weights);
  const scored = scorePool(pool, profile, { budget }, { sort }).map((s) => localizeScored(lang, s, profile, pool.length));

  return {
    query: buildQuery(profile, useCase, budget, sort, weights, mustHaves, lang),
    poolSize: pool.length,
    results: scored.map((s) => toItem(s, byId, budget)),
    cheapestAvailable: pool.length === 0 && records.length ? toDTO(records[0]) : null,
  };
}

type ScoringContextInput = { useCase?: string; budget?: number; w?: string; must?: string };

/**
 * Scores the requested devices against everything in budget, so their sub-scores
 * mean the same thing they mean on the results page. Requested devices above the
 * budget (or outside the must-haves) still join the pool; they are flagged rather than dropped.
 */
async function scoreWithinContext(category: Category, slugs: string[], context: ScoringContextInput, lang: Lang) {
  const records = await loadCategory(category);
  const wanted = records.filter((r) => slugs.includes(r.slug));
  const useCase =
    context.useCase && isUseCaseFor(category, context.useCase) ? context.useCase : DEFAULT_USE_CASE[category];
  const budget = context.budget ?? Math.max(...wanted.map((r) => r.price));
  const weights = decodeWeights(category, context.w);
  const mustHaves = parseMustHaves(category, context.must);

  const poolRecords = records.filter(
    (r) => slugs.includes(r.slug) || (r.price <= budget && meetsMustHaves(mustHaveSubject(r), mustHaves)),
  );
  const byId = new Map(poolRecords.map((r) => [r.id, r]));
  const profile = profileFor(category, useCase, weights);
  const scored = scorePool(poolRecords.map(toEngineDevice), profile, { budget }).map((s) =>
    localizeScored(lang, s, profile, poolRecords.length),
  );
  const bySlug = new Map(scored.map((s) => [s.device.slug, toItem(s, byId, budget)]));

  return {
    query: buildQuery(profile, useCase, budget, "match", weights, mustHaves, lang),
    poolSize: poolRecords.length,
    items: slugs.map((slug) => bySlug.get(slug)).filter((i): i is RecommendationItem => Boolean(i)),
    scored,
    toItem: (s: ScoredDevice) => toItem(s, byId, budget),
  };
}

export async function getDeviceDetail(
  slug: string,
  context: ScoringContextInput,
  lang: Lang = "en",
): Promise<DeviceDetailResponse | null> {
  const record = await prisma.device.findUnique({ where: { slug } });
  if (!record) return null;
  const [{ query, poolSize, items, scored, toItem: itemFor }, points, reviewRows] = await Promise.all([
    scoreWithinContext(fromDbCategory(record.category), [slug], context, lang),
    prisma.pricePoint.findMany({ where: { deviceId: record.id }, orderBy: { recordedAt: "asc" }, select: { price: true, recordedAt: true } }),
    prisma.review.findMany({ where: { deviceId: record.id, status: "APPROVED" }, orderBy: { createdAt: "desc" } }),
  ]);

  const target = scored.find((s) => s.device.slug === slug)!;
  const leader = scored[0];
  const { cheaper, better, similar } = findAlternatives(target, scored);
  const summary = summarizePrices(points, record.price);

  return {
    query,
    poolSize,
    item: items[0],
    leader: leader && leader.device.id !== target.device.id ? itemFor(leader) : null,
    gap:
      leader && leader.device.id !== target.device.id
        ? localizeGap(lang, explainGap(target, leader), fromDbCategory(record.category))
        : null,
    alternatives: {
      cheaper: cheaper && itemFor(cheaper),
      better: better && itemFor(better),
      similar: similar.map(itemFor),
    },
    priceHistory: {
      points: points.map((p) => ({ price: p.price, recordedAt: p.recordedAt.toISOString() })),
      summary: { ...summary, trackingSince: summary.trackingSince?.toISOString() ?? null },
    },
    reviews: {
      count: reviewRows.length,
      average: reviewRows.length ? round1(reviewRows.reduce((sum, r) => sum + r.rating, 0) / reviewRows.length) : null,
      items: reviewRows.slice(0, 20).map((r) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        title: r.title,
        body: r.body,
        usedFor: r.usedFor,
        ownedMonths: r.ownedMonths,
        createdAt: r.createdAt.toISOString(),
      })),
    },
  };
}

export async function getComparison(
  slugs: string[],
  context: ScoringContextInput,
  lang: Lang = "en",
): Promise<ComparisonResponse | { error: string }> {
  const found = await prisma.device.findMany({ where: { slug: { in: slugs } }, select: { slug: true, category: true } });
  const categories = new Set(found.map((d) => d.category));
  if (found.length === 0) return { error: "None of the requested devices exist" };
  if (categories.size > 1) return { error: "Devices to compare must be from the same category" };

  const present = slugs.filter((s) => found.some((d) => d.slug === s));
  const { query, poolSize, items } = await scoreWithinContext(fromDbCategory(found[0].category), present, context, lang);
  return { query, poolSize, items, missing: slugs.filter((s) => !present.includes(s)) };
}

/**
 * Head-to-head verdicts for every use case. Both devices are scored against the
 * category up to the pricier one's price, so budget doesn't hand either an edge.
 */
export async function getVersus(slugA: string, slugB: string): Promise<VersusResponse | { error: string; status: number }> {
  if (slugA === slugB) return { error: "Pick two different devices", status: 400 };
  const pair = await prisma.device.findMany({ where: { slug: { in: [slugA, slugB] } } });
  const a = pair.find((d) => d.slug === slugA);
  const b = pair.find((d) => d.slug === slugB);
  if (!a || !b) return { error: "One of these devices isn't in the catalogue", status: 404 };
  if (a.category !== b.category) return { error: "Head-to-heads work within phones or within laptops", status: 400 };

  const category = fromDbCategory(a.category);
  const budget = Math.max(a.price, b.price);
  const poolRecords = (await loadCategory(category)).filter((r) => r.price <= budget);
  const pool = poolRecords.map(toEngineDevice);
  const verdicts = PROFILES[category].map((profile) => {
    const scored = scorePool(pool, profile, { budget });
    const sa = scored.find((s) => s.device.id === a.id)!;
    const sb = scored.find((s) => s.device.id === b.id)!;
    return {
      useCase: profile.id,
      label: profile.label,
      aScore: Math.round(sa.matchScore),
      bScore: Math.round(sb.matchScore),
      verdict: headToHead(sa, sb),
    };
  });
  const wins = { a: 0, b: 0, tie: 0 };
  for (const v of verdicts) wins[v.verdict.winner] += 1;
  return { category, a: toDTO(a), b: toDTO(b), budget, poolSize: pool.length, verdicts, wins };
}

/** Devices whose latest recorded price dropped by at least 3%. */
export async function getDeals(): Promise<DealItem[]> {
  const devices = await prisma.device.findMany({
    include: { pricePoints: { orderBy: { recordedAt: "asc" }, select: { price: true, recordedAt: true } } },
  });
  return devices
    .map((d) => ({ d, summary: summarizePrices(d.pricePoints, d.price) }))
    .filter(({ summary }) => isDeal(summary))
    .map(({ d, summary }) => ({
      device: toDTO(d),
      previous: summary.previous!,
      change: summary.change,
      changePercent: summary.changePercent,
      isLowest: summary.isLowest,
      changedAt: (d.pricePoints.at(-1)?.recordedAt ?? d.priceCheckedOn).toISOString(),
    }))
    .sort((x, y) => x.changePercent - y.changePercent);
}

/** Phone and laptop of the week and of the year, chosen by the rules in features/picks. */
export const getPicks = cache(async (now: Date = new Date(), lang: Lang = "en"): Promise<PickItem[]> => {
  const categories: Category[] = ["phone", "laptop"];
  const results: PickItem[] = [];
  for (const category of categories) {
    const records = await loadCategory(category);
    const byId = new Map(records.map((r) => [r.id, r]));
    const candidates = records.map((r) => ({ device: toEngineDevice(r), releaseYear: r.releaseYear }));
    const budget = Math.max(...records.map((r) => r.price));
    const picks = [pickOfTheWeek(candidates, category, now), pickOfTheYear(candidates, category, now.getUTCFullYear())];
    for (const pick of picks.filter((p): p is EditorialPick => p !== null)) {
      results.push({
        kind: pick.kind,
        category,
        period: pick.period,
        method: pick.method,
        item: toItem(localizeScored(lang, pick.scored, requireProfile(category, "all-rounder"), records.length), byId, budget),
      });
    }
  }
  return results;
});

export async function searchCatalog(query: string): Promise<DeviceDTO[]> {
  const records = await prisma.device.findMany({ orderBy: { price: "asc" } });
  return searchDevices(records, query).map(toDTO);
}

/** Plain device records for the saved list and history, in the order requested. */
export async function getDevicesBySlugs(slugs: string[]): Promise<DeviceDTO[]> {
  const records = await prisma.device.findMany({ where: { slug: { in: slugs } } });
  const bySlug = new Map(records.map((r) => [r.slug, r]));
  return slugs.map((slug) => bySlug.get(slug)).filter((r): r is Device => Boolean(r)).map(toDTO);
}


export interface DemoEntry {
  slug: string;
  name: string;
  price: number;
  matchScore: number;
  poolRank: number;
  strength: string;
}

export interface LandingData {
  stats: { devices: number; brands: number; minPrice: number; maxPrice: number; useCases: number };
  demo: { budget: number; poolSize: number; useCases: { id: UseCase; label: string; entries: DemoEntry[] }[] };
  story: {
    budget: number;
    useCaseLabel: string;
    chips: { name: string; price: number; inBudget: boolean }[];
    poolSize: number;
    top: { name: string; price: number; matchScore: number; weightedScore: number };
    factors: { label: string; displayValue: string; absolute: number; relative: number | null; score: number; weight: number; contribution: number }[];
    ranking: { name: string; price: number; matchScore: number; penalized: boolean }[];
  };
  ticker: { name: string; price: number }[];
}

const DEMO_BUDGET = 60_000;
const DEMO_USE_CASES: UseCase[] = ["all-rounder", "photography", "gaming", "battery", "budget"];
const DEMO_SIZE = 6;
const STORY_BUDGET = 30_000;

/** Real numbers from the catalogue for the animated landing page. */
export const getLandingData = cache(async (lang: Lang = "en"): Promise<LandingData> => {
  const [phones, laptops] = await Promise.all([loadCategory("phone"), loadCategory("laptop")]);
  const all = [...phones, ...laptops];
  const name = (d: Device) => (d.name.toLowerCase().startsWith(d.brand.toLowerCase()) ? d.name : `${d.brand} ${d.name}`);

  // Demo: six phones under ₹60k re-ranked for each use case.
  const phoneEngine = phones.map(toEngineDevice);
  const demoPool = selectPool(phoneEngine, { category: "phone", useCase: "all-rounder", budget: DEMO_BUDGET });
  const scoredByUseCase = DEMO_USE_CASES.map((useCase) => {
    const profile = requireProfile("phone", useCase);
    return {
      useCase,
      scored: scorePool(demoPool, profile, { budget: DEMO_BUDGET }).map((s) => localizeScored(lang, s, profile, demoPool.length)),
    };
  });
  const chosen: string[] = [];
  for (const { scored } of scoredByUseCase) {
    const top = scored.find((s) => !chosen.includes(s.device.id));
    if (top && chosen.length < DEMO_SIZE) chosen.push(top.device.id);
  }
  for (const s of scoredByUseCase[0].scored) {
    if (chosen.length >= DEMO_SIZE) break;
    if (!chosen.includes(s.device.id)) chosen.push(s.device.id);
  }
  const byId = new Map(phones.map((p) => [p.id, p]));
  const demo = {
    budget: DEMO_BUDGET,
    poolSize: demoPool.length,
    useCases: scoredByUseCase.map(({ useCase, scored }) => ({
      id: useCase,
      label: profileText(lang, requireProfile("phone", useCase)).label,
      entries: scored
        .filter((s) => chosen.includes(s.device.id))
        .map((s) => ({
          slug: s.device.slug,
          name: name(byId.get(s.device.id)!),
          price: s.device.price,
          matchScore: Math.round(s.matchScore),
          poolRank: s.matchRank,
          strength: (s.explanation.strengths[0] ?? "").replace(/ \(.*\)$/, ""),
        })),
    })),
  };

  // Story: how one gaming query under ₹30k is scored.
  const storyPool = selectPool(phoneEngine, { category: "phone", useCase: "gaming", budget: STORY_BUDGET });
  const gaming = requireProfile("phone", "gaming");
  const storyScored = scorePool(storyPool, gaming, { budget: STORY_BUDGET }).map((s) =>
    localizeScored(lang, s, gaming, storyPool.length),
  );
  const best = storyScored[0];
  const nearby = phones
    .filter((p) => p.price >= 15_000 && p.price <= 45_000)
    .sort((a, b) => a.price - b.price);
  const step = Math.max(1, Math.floor(nearby.length / 12));
  const story = {
    budget: STORY_BUDGET,
    useCaseLabel: profileText(lang, gaming).label,
    chips: nearby.filter((_, i) => i % step === 0).slice(0, 12).map((p) => ({ name: name(p), price: p.price, inBudget: p.price <= STORY_BUDGET })),
    poolSize: storyPool.length,
    top: {
      name: name(byId.get(best.device.id)!),
      price: best.device.price,
      matchScore: Math.round(best.matchScore),
      weightedScore: Math.round(best.weightedScore),
    },
    factors: [...best.breakdown]
      .sort((a, b) => b.weight - a.weight)
      .map((f) => ({
        label: f.label,
        displayValue: f.displayValue,
        absolute: Math.round(f.absolute),
        relative: f.relative === null ? null : Math.round(f.relative),
        score: Math.round(f.score),
        weight: f.weight,
        contribution: Math.round(f.contribution * 10) / 10,
      })),
    ranking: storyScored.slice(0, 5).map((s) => ({
      name: name(byId.get(s.device.id)!),
      price: s.device.price,
      matchScore: Math.round(s.matchScore),
      penalized: s.penalties.length > 0,
    })),
  };

  const ticker = all
    .filter((d) => d.releaseYear >= 2026)
    .sort((a, b) => b.price - a.price)
    .slice(0, 18)
    .map((d) => ({ name: name(d), price: d.price }));

  return {
    stats: {
      devices: all.length,
      brands: new Set(all.map((d) => d.brand)).size,
      minPrice: Math.min(...all.map((d) => d.price)),
      maxPrice: Math.max(...all.map((d) => d.price)),
      useCases: DEMO_USE_CASES.length * 2,
    },
    demo,
    story,
    ticker,
  };
});
