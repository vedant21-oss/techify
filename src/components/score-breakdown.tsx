import { ScoreBar } from "@/components/score-bar";
import type { RecommendationItem } from "@/lib/types";

const pct = (weight: number) => `${Math.round(weight * 100)}%`;

/**
 * How a match score is assembled: one bar per weighted factor, heaviest first,
 * followed by any baseline penalties and the final total.
 */
export function ScoreBreakdown({ item, useCaseLabel }: { item: RecommendationItem; useCaseLabel: string }) {
  const factors = [...item.breakdown].sort((a, b) => b.weight - a.weight);
  const penalized = new Set(item.penalties.map((p) => p.key));

  return (
    <div className="border-[3px] border-ink bg-paper">
      <ul>
        {factors.map((f) => {
          const isPenalized = penalized.has(f.key);
          return (
            <li
              key={f.key}
              className="grid grid-cols-[1fr_auto] items-end gap-x-6 gap-y-3 border-b border-ink px-5 py-5 sm:grid-cols-[10rem_1fr_6rem] sm:items-center sm:px-6"
            >
              <div>
                <p className="font-heading text-2xl font-black uppercase leading-none">{f.label}</p>
                <p className="mt-1.5 label-mono text-ink-soft">weight {pct(f.weight)}</p>
              </div>
              <div className="order-3 col-span-2 sm:order-none sm:col-span-1">
                <ScoreBar
                  score={f.score}
                  tone={isPenalized ? "pink" : f.estimated ? "muted" : "ink"}
                  label={`${f.label} sub-score${f.estimated ? " (estimated)" : ""}`}
                />
                <p className="mt-2 text-sm text-ink-soft">
                  <span className="font-medium text-ink">{f.displayValue}</span>
                  <span className="mx-2" aria-hidden>
                    ·
                  </span>
                  {f.estimated ? (
                    "scored as typical for this budget"
                  ) : (
                    <>
                      market scale {Math.round(f.absolute)}
                      {f.relative !== null && <>, this budget {Math.round(f.relative)}</>}
                    </>
                  )}
                </p>
                {isPenalized && (
                  <p className="mt-2 inline-block bg-pink px-2 py-0.5 label-mono text-ink-deep">
                    Below the {useCaseLabel.toLowerCase()} baseline
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="font-heading text-4xl font-black leading-none tabular">{Math.round(f.score)}</span>
                <span className="mt-1 block label-mono text-ink-soft">+{f.contribution.toFixed(1)} pts</span>
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="flex flex-col gap-2 bg-paper-deep px-5 py-5 font-mono text-sm tabular sm:px-6">
        <div className="flex justify-between gap-4">
          <dt>Weighted score</dt>
          <dd>{item.weightedScore.toFixed(1)}</dd>
        </div>
        {item.penalties.map((p) => (
          <div key={p.key} className="flex justify-between gap-4">
            <dt>
              {p.label} baseline missed ({Math.round(p.absolute)} of {p.baseline})
            </dt>
            <dd>×{p.multiplier.toFixed(2)}</dd>
          </div>
        ))}
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t-[3px] border-ink pt-3">
          <dt className="font-heading text-2xl font-black uppercase">Match score</dt>
          <dd className="font-heading text-4xl font-black">{item.matchScore.toFixed(1)}</dd>
        </div>
      </dl>
    </div>
  );
}
