"use client";

import { useEffect, useRef, useState } from "react";
import { useMessages } from "@/components/lang-provider";
import { formatBudgetShort, formatPrice } from "@/lib/engine";
import type { LandingData } from "@/lib/recommendations";
import { cn } from "@/lib/utils";

type Story = LandingData["story"];

function Visual({ story, step }: { story: Story; step: number }) {
  const t = useMessages();
  const maxWeight = Math.max(...story.factors.map((f) => f.weight));
  return (
    <div className="border-[3px] border-ink bg-paper">
      <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink bg-ink px-4 py-2.5 text-paper">
        <span className="label-mono">
          {t.landing.storyHeader(story.useCaseLabel, story.budget)}
        </span>
        <span className="label-mono text-pink">{t.landing.step(step + 1)}</span>
      </div>

      <div className="relative min-h-[23rem] p-4 sm:p-5">
        {/* Step 1: budget filter */}
        <div className={cn("absolute inset-4 transition-all duration-500 sm:inset-5", step === 0 ? "opacity-100" : "pointer-events-none opacity-0")}>
          <div className="grid grid-cols-2 gap-2">
            {story.chips.map((chip, i) => (
              <div
                key={chip.name}
                style={{ transitionDelay: `${i * 40}ms` }}
                className={cn(
                  "flex items-baseline justify-between gap-2 border-2 border-ink px-2.5 py-2 text-sm transition-all duration-500",
                  chip.inBudget ? "bg-paper" : "border-dashed text-ink-soft line-through opacity-40",
                  step === 0 ? "translate-y-0" : "translate-y-2",
                )}
              >
                <span className="truncate font-medium">{chip.name}</span>
                <span className="shrink-0 font-mono text-xs tabular">{formatBudgetShort(chip.price)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t-[3px] border-pink pt-2 label-mono">{t.landing.budgetLine(story.budget)}</p>
        </div>

        {/* Steps 2–3: scores, then weights */}
        <div className={cn("absolute inset-4 transition-opacity duration-500 sm:inset-5", step === 1 || step === 2 ? "opacity-100" : "pointer-events-none opacity-0")}>
          <p className="mb-3 font-heading text-2xl font-black uppercase leading-none">{story.top.name}</p>
          <ul className="flex flex-col gap-2.5">
            {story.factors.map((f, i) => {
              const width = step === 2 ? (f.score * f.weight) / maxWeight : f.score;
              return (
                <li key={f.label} className="grid grid-cols-[6.25rem_1fr_3.5rem] items-center gap-3 text-sm">
                  <span className="truncate">
                    <span className="block font-medium leading-tight">{f.label}</span>
                    <span className="block font-mono text-[0.7rem] text-ink-soft">
                      {step === 2 ? `× ${Math.round(f.weight * 100)}%` : f.displayValue}
                    </span>
                  </span>
                  <span className="h-3 border-2 border-ink bg-paper">
                    <span
                      className={cn("block h-full transition-[width] duration-700 ease-out", step === 2 ? "bg-pink" : "bg-ink")}
                      style={{ width: `${width}%`, transitionDelay: `${i * 60}ms` }}
                    />
                  </span>
                  <span className="text-right font-heading text-xl font-black tabular">
                    {step === 2 ? `+${f.contribution}` : f.score}
                  </span>
                </li>
              );
            })}
          </ul>
          <p
            className={cn(
              "mt-4 flex items-baseline justify-between border-t-[3px] border-ink pt-3 transition-opacity duration-500",
              step === 2 ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="label-mono">{t.breakdown.weightedScore}</span>
            <span className="font-heading text-4xl font-black tabular">{story.top.weightedScore}</span>
          </p>
        </div>

        {/* Step 4: ranking */}
        <div className={cn("absolute inset-4 transition-opacity duration-500 sm:inset-5", step === 3 ? "opacity-100" : "pointer-events-none opacity-0")}>
          <ol className="flex flex-col gap-2">
            {story.ranking.map((r, i) => (
              <li
                key={r.name}
                style={{ transitionDelay: `${i * 90}ms` }}
                className={cn(
                  "grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-2 border-ink px-3 py-2.5 transition-all duration-500",
                  i === 0 ? "bg-pink text-ink-deep" : "bg-paper",
                  step === 3 ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
                )}
              >
                <span className="font-heading text-2xl font-black tabular">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.name}</span>
                  <span className="block font-mono text-[0.7rem]">
                    {formatPrice(r.price)}
                    {r.penalized && t.landing.belowBaseline}
                  </span>
                </span>
                <span className="font-heading text-3xl font-black tabular">{r.matchScore}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function ScoringStory({ story }: { story: Story }) {
  const t = useMessages();
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
      <ol className="flex flex-col">
        {t.landing.steps.map((step, i) => (
          <li
            key={step.title}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            data-step={i}
            className="flex flex-col justify-center border-l-[3px] border-ink py-8 pl-6 sm:pl-8 lg:min-h-[42vh] lg:last:min-h-[30vh]"
          >
            <span
              className={cn(
                "grid size-12 place-items-center border-[3px] border-ink font-heading text-2xl font-black transition-colors duration-300",
                active === i ? "bg-pink text-ink-deep" : "bg-paper text-ink max-lg:bg-pink max-lg:text-ink-deep",
              )}
            >
              {i + 1}
            </span>
            <h3 className={cn("mt-5 text-4xl transition-opacity duration-300 sm:text-5xl", active !== i && "lg:opacity-40")}>
              {step.title}
            </h3>
            <p className={cn("mt-4 max-w-[46ch] text-lg leading-relaxed transition-opacity duration-300", active !== i && "lg:opacity-50")}>
              {step.body(story.budget, story.poolSize, story.useCaseLabel, story.top.name, story.top.matchScore)}
            </p>
            <div className="mt-6 lg:hidden">
              <Visual story={story} step={i} />
            </div>
          </li>
        ))}
      </ol>
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <Visual story={story} step={active} />
        </div>
      </div>
    </div>
  );
}
