"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLang, useMessages } from "@/components/lang-provider";
import { BuyButtons } from "@/components/buy-buttons";
import { displayName, keySpecs, priceProvenance } from "@/components/device-meta";
import { ScoreBox } from "@/components/score-bar";
import { SaveButton } from "@/components/saved-controls";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPrice, type SortMode } from "@/lib/engine";
import type { DeviceDTO, RecommendationItem, ScoringQuery } from "@/lib/types";
import { MAX_COMPARE, toSearchParams } from "@/lib/url";
import { cn } from "@/lib/utils";
import type { CompareSelection } from "./compare-tray";

export function ResultsList({
  results,
  sort,
  query,
  cheapestAvailable,
  onRaiseBudget,
  selected,
  onToggleSelected,
}: {
  results: RecommendationItem[];
  sort: SortMode;
  query: ScoringQuery;
  cheapestAvailable: DeviceDTO | null;
  onRaiseBudget: (price: number) => void;
  selected: CompareSelection[];
  onToggleSelected: (item: CompareSelection) => void;
}) {
  const t = useMessages();
  if (results.length === 0) {
    return (
      <div className="border-[3px] border-dashed border-ink px-6 py-14 text-center">
        <p className="font-heading text-4xl font-black uppercase">{t.results.nothingFits}</p>
        {cheapestAvailable && (
          <>
            <p className="mx-auto mt-4 max-w-[46ch] text-ink-soft">
              {t.results.cheapest(displayName(cheapestAvailable), cheapestAvailable.price)}
            </p>
            <button
              type="button"
              onClick={() => onRaiseBudget(cheapestAvailable.price)}
              className="mt-6 border-[3px] border-ink bg-pink px-5 py-3 label-mono text-ink-deep shadow-hard transition-transform hover:-translate-y-0.5"
            >
              {t.results.raiseBudget(cheapestAvailable.price)}
            </button>
          </>
        )}
      </div>
    );
  }

  const selectionFull = selected.length >= MAX_COMPARE;

  return (
    <ol className="flex flex-col gap-8">
      {results.map((item) => {
        const isSelected = selected.some((s) => s.slug === item.device.slug);
        return (
          <li key={item.device.id}>
            <ResultCard
              item={item}
              sort={sort}
              query={query}
              isSelected={isSelected}
              selectDisabled={!isSelected && selectionFull}
              onToggle={() => onToggleSelected({ slug: item.device.slug, name: displayName(item.device) })}
            />
          </li>
        );
      })}
    </ol>
  );
}

function ResultCard({
  item,
  sort,
  query,
  isSelected,
  selectDisabled,
  onToggle,
}: {
  item: RecommendationItem;
  sort: SortMode;
  query: ScoringQuery;
  isSelected: boolean;
  selectDisabled: boolean;
  onToggle: () => void;
}) {
  const t = useMessages();
  const lang = useLang();
  const { device, explanation } = item;
  const rank = sort === "value" ? item.valueRank : item.matchRank;
  const detailHref = `/device/${device.slug}?${toSearchParams({
    useCase: query.useCase,
    budget: query.budget,
    weights: query.weights,
    mustHaves: query.mustHaves,
  })}`;
  const checkboxId = `compare-${device.slug}`;
  const hasPoints = explanation.strengths.length > 0 || explanation.tradeoffs.length > 0;
  const matchHint = item.penalties.length
    ? t.results.matchHintPenalty(Math.round(item.weightedScore), query.useCaseLabel, item.penalties.map((p) => p.label))
    : t.results.matchHint(query.useCaseLabel);

  return (
    <article
      className={cn(
        "border-[3px] border-ink bg-paper transition-shadow duration-200 hover:shadow-hard-pink",
        isSelected && "shadow-hard-pink",
      )}
    >
      <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-6 p-5 sm:grid-cols-[auto_1fr_auto] sm:gap-x-7 sm:p-7">
        <div
          className={cn(
            "grid size-14 place-items-center border-[3px] border-ink font-heading text-3xl font-black tabular sm:size-16 sm:text-4xl",
            rank === 1 ? "bg-pink text-ink-deep" : "bg-ink text-paper",
          )}
        >
          <span className="sr-only">{t.results.rank}</span>
          {rank}
        </div>

        <div className="min-w-0">
          <h3 className="text-4xl sm:text-5xl">
            <Link href={detailHref} className="hover:bg-pink-tint">
              {displayName(device)}
            </Link>
          </h3>
          <p className="mt-2 label-mono text-ink-soft">{device.variant}</p>
          <p className="mt-3 font-heading text-3xl font-bold tabular">{formatPrice(device.price)}</p>
          <p className="mt-1 text-xs text-ink-soft">{priceProvenance(device, lang)}</p>
        </div>

        <div className="col-span-2 flex gap-3 sm:col-span-1 sm:self-start">
          <Tooltip>
            <TooltipTrigger asChild>
              <div tabIndex={0} className="cursor-help">
                <ScoreBox score={item.matchScore} label={t.results.match} tone="match" muted={sort !== "match"} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-60 text-balance">
              {matchHint}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div tabIndex={0} className="cursor-help">
                <ScoreBox score={item.valueScore} label={t.results.value} tone="value" muted={sort !== "value"} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-60 text-balance">
              {t.results.valueHint}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="px-5 pb-7 sm:px-7">
        <p className="max-w-[62ch] text-lg leading-relaxed">{explanation.summary}</p>

        {hasPoints && (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 sm:gap-10">
            {explanation.strengths.length > 0 && (
              <PointList title={t.results.strongOn} items={explanation.strengths} marker="bg-ink" />
            )}
            {explanation.tradeoffs.length > 0 && (
              <PointList title={t.results.heldBackBy} items={explanation.tradeoffs} marker="bg-pink" />
            )}
          </div>
        )}

        <p className="mt-7 label-mono leading-relaxed text-ink-soft">{keySpecs(device).join("  /  ")}</p>
      </div>

      <div className="grid grid-cols-2 border-t-[3px] border-ink sm:flex sm:items-stretch">
        <label
          htmlFor={checkboxId}
          className={cn(
            "flex items-center gap-3 border-r-[3px] border-ink px-5 py-4 label-mono sm:px-7",
            selectDisabled ? "cursor-not-allowed text-ink-soft" : "cursor-pointer hover:bg-pink-tint",
            isSelected && "bg-pink-tint",
          )}
        >
          <Checkbox
            id={checkboxId}
            checked={isSelected}
            disabled={selectDisabled}
            onCheckedChange={onToggle}
            className="size-5 border-2 border-ink data-checked:border-ink data-checked:bg-ink"
          />
          {selectDisabled ? t.results.compareMax(MAX_COMPARE) : isSelected ? t.results.comparing : t.results.compare}
        </label>
        <Link
          href={detailHref}
          className="flex items-center gap-2 px-5 py-4 label-mono transition-colors hover:bg-ink hover:text-paper sm:border-r-[3px] sm:border-ink sm:px-7"
        >
          {t.results.whyScore} <ArrowRight className="size-4" aria-hidden />
        </Link>
        <div className="col-span-2 border-t border-ink sm:col-span-1 sm:border-t-0 sm:border-r-[3px]">
          <SaveButton slug={device.slug} name={displayName(device)} />
        </div>
        <div className="col-span-2 flex flex-1 items-center border-t-[3px] border-ink px-5 py-4 sm:justify-end sm:border-t-0 sm:px-7">
          <BuyButtons links={device.buyLinks} variant="quiet" />
        </div>
      </div>
    </article>
  );
}

function PointList({ title, items, marker }: { title: string; items: string[]; marker: string }) {
  return (
    <div>
      <p className="label-mono text-ink-soft">{title}</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((text) => (
          <li key={text} className="flex items-start gap-3 leading-snug">
            <span aria-hidden className={cn("mt-1.5 size-2.5 shrink-0 border-2 border-ink", marker)} />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
