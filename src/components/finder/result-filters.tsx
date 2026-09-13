"use client";

import { X } from "lucide-react";
import { formatStorage } from "@/lib/engine";
import { matchesQuery } from "@/lib/features/search";
import type { RecommendationItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FilterState {
  text: string;
  brands: string[];
  minRamGb: number;
  minStorageGb: number;
}

export const EMPTY_FILTERS: FilterState = { text: "", brands: [], minRamGb: 0, minStorageGb: 0 };

/**
 * Filters hide results without re-scoring them, so a device keeps the rank and
 * score it earned against everything in budget.
 */
export function applyFilters(results: RecommendationItem[], filters: FilterState): RecommendationItem[] {
  return results.filter(({ device }) => {
    if (filters.brands.length && !filters.brands.includes(device.brand)) return false;
    if (device.ramGb < filters.minRamGb) return false;
    if (device.storageGb < filters.minStorageGb) return false;
    if (filters.text.trim() && !matchesQuery(device, filters.text)) return false;
    return true;
  });
}

const isActive = (f: FilterState) => Boolean(f.text.trim() || f.brands.length || f.minRamGb || f.minStorageGb);

function steps(values: number[], candidates: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  return candidates.filter((c) => c > min && c <= max);
}

export function ResultFilters({
  results,
  filters,
  onChange,
  shown,
}: {
  results: RecommendationItem[];
  filters: FilterState;
  onChange: (next: FilterState) => void;
  shown: number;
}) {
  const brands = [...new Set(results.map((r) => r.device.brand))].sort((a, b) => a.localeCompare(b));
  const ramSteps = steps(results.map((r) => r.device.ramGb), [8, 12, 16, 24, 32]);
  const storageSteps = steps(results.map((r) => r.device.storageGb), [128, 256, 512, 1024]);
  const selectClass = "border-[3px] border-ink bg-paper px-3 py-2 text-sm font-medium outline-none focus:bg-pink-tint";

  return (
    <div className="mb-8 border-[3px] border-ink bg-paper">
      <div className="flex flex-wrap items-stretch gap-3 border-b border-ink p-4">
        <label htmlFor="filter-text" className="sr-only">
          Filter by name or chip
        </label>
        <input
          id="filter-text"
          type="search"
          value={filters.text}
          onChange={(e) => onChange({ ...filters, text: e.target.value })}
          placeholder="Filter by name or chip"
          className="min-w-0 flex-1 basis-48 border-[3px] border-ink bg-paper px-3 py-2 text-sm outline-none placeholder:text-ink-soft focus:bg-pink-tint"
        />
        {ramSteps.length > 0 && (
          <>
            <label htmlFor="filter-ram" className="sr-only">
              Minimum RAM
            </label>
            <select
              id="filter-ram"
              value={filters.minRamGb}
              onChange={(e) => onChange({ ...filters, minRamGb: Number(e.target.value) })}
              className={selectClass}
            >
              <option value={0}>Any RAM</option>
              {ramSteps.map((gb) => (
                <option key={gb} value={gb}>
                  {gb} GB+ RAM
                </option>
              ))}
            </select>
          </>
        )}
        {storageSteps.length > 0 && (
          <>
            <label htmlFor="filter-storage" className="sr-only">
              Minimum storage
            </label>
            <select
              id="filter-storage"
              value={filters.minStorageGb}
              onChange={(e) => onChange({ ...filters, minStorageGb: Number(e.target.value) })}
              className={selectClass}
            >
              <option value={0}>Any storage</option>
              {storageSteps.map((gb) => (
                <option key={gb} value={gb}>
                  {formatStorage(gb)}+
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3" role="group" aria-label="Brands">
        {brands.map((brand) => {
          const active = filters.brands.includes(brand);
          return (
            <button
              key={brand}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange({
                  ...filters,
                  brands: active ? filters.brands.filter((b) => b !== brand) : [...filters.brands, brand],
                })
              }
              className={cn(
                "border-2 border-ink px-2.5 py-1 text-sm transition-colors",
                active ? "bg-ink text-paper" : "hover:bg-pink-tint",
              )}
            >
              {brand}
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-3 label-mono text-ink-soft" aria-live="polite">
          {isActive(filters) ? `Showing ${shown} of ${results.length}` : `${results.length} results`}
          {isActive(filters) && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_FILTERS)}
              className="flex items-center gap-1 text-ink underline underline-offset-4 hover:bg-pink-tint"
            >
              <X className="size-3.5" aria-hidden /> Clear
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
