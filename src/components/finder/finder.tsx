"use client";

import { Laptop, Loader2, Smartphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang, useMessages } from "@/components/lang-provider";
import { Slider } from "@/components/ui/slider";
import { UseCaseIcon } from "@/components/use-case-icon";
import { BUDGET_RANGES, CATEGORIES } from "@/lib/catalog-config";
import { profileText } from "@/lib/i18n/engine-hi";
import { PROFILES, formatBudgetShort, formatPrice, type Category, type SortMode, type UseCase, type WeightMap } from "@/lib/engine";
import type { ParseQueryResponse } from "@/lib/nl-query/types";
import type { RecommendationParams } from "@/lib/query";
import type { RecommendationResponse } from "@/lib/types";
import { categoryPath, MAX_COMPARE, toSearchParams } from "@/lib/url";
import { cn } from "@/lib/utils";
import { CompareTray, type CompareSelection } from "./compare-tray";
import { QuickSearch } from "./quick-search";
import { ResultFilters, applyFilters, EMPTY_FILTERS, type FilterState } from "./result-filters";
import { ResultsList } from "./results-list";
import { MustHavePicker, WeightsPanel } from "./tuning";

const FETCH_DEBOUNCE_MS = 220;

function Step({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b-[3px] border-ink px-5 py-6 last:border-b-0 sm:px-6">
      <legend className="float-left mb-4 w-full label-mono">{label}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export function Finder({
  category,
  initialParams,
  initialData,
}: {
  category: Category;
  initialParams: RecommendationParams;
  initialData: RecommendationResponse;
}) {
  const [useCase, setUseCase] = useState<UseCase>(initialParams.useCase);
  const [budget, setBudget] = useState(initialParams.budget);
  const [sort, setSort] = useState<SortMode>(initialParams.sort);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CompareSelection[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [weights, setWeights] = useState<WeightMap | null>(initialParams.weights);
  const [mustHaves, setMustHaves] = useState<string[]>(initialParams.mustHaves);
  const resultsRef = useRef<HTMLElement>(null);
  const isFirstRun = useRef(true);
  const lang = useLang();
  const t = useMessages();

  const range = BUDGET_RANGES[category];
  const profiles = PROFILES[category];
  const activeProfile = profiles.find((p) => p.id === useCase)!;

  // Keep the URL shareable without a server round trip.
  useEffect(() => {
    window.history.replaceState(null, "", `?${toSearchParams({ useCase, budget, sort, weights, mustHaves })}${window.location.hash}`);
  }, [useCase, budget, sort, weights, mustHaves]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/recommend?${toSearchParams({ category, useCase, budget, weights, mustHaves })}`, {
          signal: controller.signal,
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? t.finder.loadError);
        setData(body as RecommendationResponse);
        setError(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, FETCH_DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the error copy doesn't change what's fetched
  }, [category, useCase, budget, weights, mustHaves]);

  const ranked = useMemo(
    () => [...data.results].sort((a, b) => (sort === "value" ? a.valueRank - b.valueRank : a.matchRank - b.matchRank)),
    [data.results, sort],
  );
  const visible = useMemo(() => applyFilters(ranked, filters), [ranked, filters]);

  function applyParsed(result: ParseQueryResponse) {
    setUseCase(result.useCase);
    setWeights(null);
    setBudget(result.budget);
    setSort("match");
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function toggleSelected(item: CompareSelection) {
    setSelected((current) =>
      current.some((s) => s.slug === item.slug)
        ? current.filter((s) => s.slug !== item.slug)
        : current.length >= MAX_COMPARE
          ? current
          : [...current, item],
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-(--gutter) pt-10 pb-36 sm:pt-14">
      <QuickSearch currentCategory={category} onApply={applyParsed} />

      <div className="mt-12 grid gap-12 lg:grid-cols-[21rem_1fr] lg:gap-14">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto" aria-label={t.finder.controls}>
          <p className="mb-3 label-mono text-ink-soft">{t.finder.orSetIt}</p>
          <div className="border-[3px] border-ink bg-paper">
            <Step label={t.finder.shoppingFor}>
              <div className="grid grid-cols-2 border-[3px] border-ink">
                {CATEGORIES.map((c, i) => {
                  const Icon = c.id === "laptop" ? Laptop : Smartphone;
                  const active = c.id === category;
                  return (
                    <Link
                      key={c.id}
                      href={categoryPath(c.id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3.5 font-heading text-xl font-black uppercase transition-colors",
                        i === 0 && "border-r-[3px] border-ink",
                        active ? "bg-ink text-paper" : "bg-paper hover:bg-pink-tint",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                      {t.category.tab[c.id]}
                    </Link>
                  );
                })}
              </div>
            </Step>

            <Step label={t.finder.spendUpTo}>
              <output htmlFor="budget" className="block font-heading text-6xl font-black leading-none tabular">
                {formatPrice(budget)}
              </output>
              <Slider
                id="budget"
                aria-label={t.finder.maxBudget}
                className="mt-6 [&_[data-slot=slider-range]]:bg-pink! [&_[data-slot=slider-thumb]]:size-6! [&_[data-slot=slider-thumb]]:border-[3px]! [&_[data-slot=slider-thumb]]:border-ink! [&_[data-slot=slider-thumb]]:bg-paper! [&_[data-slot=slider-track]]:h-3.5! [&_[data-slot=slider-track]]:border-2! [&_[data-slot=slider-track]]:border-ink! [&_[data-slot=slider-track]]:bg-paper!"
                min={range.min}
                max={range.max}
                step={range.step}
                value={[budget]}
                onValueChange={([v]) => setBudget(v)}
              />
              <div className="mt-3 flex justify-between label-mono text-ink-soft">
                <span>{formatBudgetShort(range.min)}</span>
                <span>{formatBudgetShort(range.max)}</span>
              </div>
            </Step>

            <Step label={t.finder.mostlyFor}>
              <div className="flex flex-col border-[3px] border-ink">
                {profiles.map((p) => {
                  const active = p.id === useCase;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setUseCase(p.id);
                        setWeights(null);
                      }}
                      className={cn(
                        "flex items-center gap-3 border-b border-ink px-4 py-3 text-left font-medium transition-colors last:border-b-0",
                        active ? "bg-ink text-paper" : "bg-paper hover:bg-pink-tint",
                      )}
                    >
                      <UseCaseIcon useCase={p.id} className={cn("size-4 shrink-0", active ? "text-pink" : "text-ink")} />
                      {profileText(lang, p).label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{profileText(lang, activeProfile).description}</p>
              <div className="mt-5 border-t border-ink pt-4">
                <WeightsPanel category={category} presetWeights={activeProfile.weights} points={weights} onChange={setWeights} />
              </div>
            </Step>

            <Step label={t.finder.mustHave}>
              <MustHavePicker category={category} selected={mustHaves} onChange={setMustHaves} />
            </Step>
          </div>
        </aside>

        <section
          ref={resultsRef}
          id="results"
          aria-labelledby="results-heading"
          aria-busy={loading}
          className="min-w-0 scroll-mt-28"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-6 border-b-[3px] border-ink pb-6">
            <div>
              <p className="flex items-center gap-2 label-mono text-ink-soft">
                {t.finder.rankedFor(data.query.useCaseLabel)}
                {loading && <Loader2 className="size-3.5 animate-spin" aria-label={t.finder.updating} />}
              </p>
              <h2 id="results-heading" className="mt-2 text-5xl sm:text-6xl">
                {t.finder.heading(data.poolSize, category, data.query.budget)}
              </h2>
            </div>
            <div role="group" aria-label={t.finder.sortResults} className="flex border-[3px] border-ink">
              {(
                [
                  ["match", t.finder.bestMatch],
                  ["value", t.finder.bestValue],
                ] as const
              ).map(([mode, label], i) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={sort === mode}
                  onClick={() => setSort(mode)}
                  className={cn(
                    "px-4 py-2.5 label-mono transition-colors",
                    i === 0 && "border-r-[3px] border-ink",
                    sort === mode ? (mode === "match" ? "bg-ink text-paper" : "bg-pink text-ink-deep") : "hover:bg-pink-tint",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {data.results.length > 0 && (
            <ResultFilters
              results={ranked}
              filters={filters}
              onChange={setFilters}
              shown={visible.length}
            />
          )}

          {error && (
            <p role="alert" className="mb-8 border-[3px] border-ink bg-pink-tint px-5 py-4 text-sm font-medium text-ink-deep">
              {error}
            </p>
          )}

          <div className={cn("transition-opacity", loading && "opacity-60")}>
            {data.results.length > 0 && visible.length === 0 ? (
              <div className="border-[3px] border-dashed border-ink px-6 py-12 text-center">
                <p className="font-heading text-3xl font-black uppercase">{t.finder.noFilterMatch}</p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-5 border-[3px] border-ink bg-pink px-5 py-2.5 label-mono text-ink-deep shadow-hard"
                >
                  {t.finder.clearFilters}
                </button>
              </div>
            ) : (
              <ResultsList
                results={visible}
                sort={sort}
                query={data.query}
                cheapestAvailable={data.cheapestAvailable}
                onRaiseBudget={(price) => setBudget(Math.min(range.max, Math.ceil(price / range.step) * range.step))}
                selected={selected}
                onToggleSelected={toggleSelected}
              />
            )}
          </div>
        </section>
      </div>

      <CompareTray
        selected={selected}
        onRemove={(slug) => setSelected((s) => s.filter((x) => x.slug !== slug))}
        onClear={() => setSelected([])}
        useCase={useCase}
        budget={budget}
        weights={weights}
        mustHaves={mustHaves}
      />
    </div>
  );
}
