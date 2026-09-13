"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useLang, useMessages } from "@/components/lang-provider";
import { FACTORS, weightsToPoints, type Category, type FactorKey, type WeightMap } from "@/lib/engine";
import { mustHavesFor } from "@/lib/features/must-haves";
import { factorLabel, mustHaveLabel } from "@/lib/i18n/engine-hi";
import { cn } from "@/lib/utils";

/** Sliders for how much each spec matters. Moving one turns the preset into "your mix". */
export function WeightsPanel({
  category,
  presetWeights,
  points,
  onChange,
}: {
  category: Category;
  /** The active preset's weights (fractions). */
  presetWeights: WeightMap;
  /** Custom points, or null while the preset is in use. */
  points: WeightMap | null;
  onChange: (next: WeightMap | null) => void;
}) {
  const lang = useLang();
  const t = useMessages();
  const factors = Object.values(FACTORS[category]).filter((f) => f !== undefined);
  const current = points ?? weightsToPoints(presetWeights);
  const total = Object.values(current).reduce((sum, v) => sum + (v ?? 0), 0) || 1;

  return (
    <details className="group" open={points !== null}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 label-mono [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" aria-hidden />
          {points ? t.tuning.yourMix : t.tuning.fineTune}
        </span>
        <span className="text-ink-soft group-open:hidden">{t.tuning.open}</span>
        <span className="hidden text-ink-soft group-open:inline">{t.tuning.close}</span>
      </summary>
      <div className="mt-4 flex flex-col gap-3">
        {factors.map((factor) => {
          const key = factor.key as FactorKey;
          const value = current[key] ?? 0;
          return (
            <div key={key} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3">
              <label htmlFor={`weight-${key}`} className="text-sm">
                {factorLabel(lang, category, key)}
              </label>
              <input
                id={`weight-${key}`}
                type="range"
                min={0}
                max={60}
                step={1}
                value={value}
                onChange={(e) => onChange({ ...current, [key]: Number(e.target.value) })}
                className="h-2 w-full cursor-pointer accent-[var(--pink)]"
              />
              <span className="text-right font-mono text-xs tabular text-ink-soft">{Math.round((value / total) * 100)}%</span>
            </div>
          );
        })}
        {points && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-1 flex items-center gap-2 self-start label-mono underline underline-offset-4 hover:bg-pink-tint"
          >
            <RotateCcw className="size-3.5" aria-hidden /> {t.tuning.backToPreset}
          </button>
        )}
      </div>
    </details>
  );
}

/** Hard requirements applied before ranking: devices that don't meet them aren't scored at all. */
export function MustHavePicker({
  category,
  selected,
  onChange,
}: {
  category: Category;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const lang = useLang();
  const t = useMessages();
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t.tuning.mustHaves}>
        {mustHavesFor(category).map((m) => {
          const active = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? selected.filter((id) => id !== m.id) : [...selected, m.id])}
              className={cn(
                "border-2 border-ink px-2.5 py-1 text-sm transition-colors",
                active ? "bg-ink text-paper" : "hover:bg-pink-tint",
              )}
            >
              {mustHaveLabel(lang, m.id, m.label)}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="mt-3 text-xs text-ink-soft">
          {t.tuning.mustHaveNote}{" "}
          <button type="button" onClick={() => onChange([])} className="underline underline-offset-2">
            {t.tuning.clear}
          </button>
        </p>
      )}
    </div>
  );
}
