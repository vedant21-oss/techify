"use client";

import { useMessages } from "@/components/lang-provider";
import { ArrowRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { UseCaseIcon } from "@/components/use-case-icon";
import { formatPrice } from "@/lib/engine";
import type { LandingData } from "@/lib/recommendations";
import { finderHref } from "@/lib/url";
import { cn } from "@/lib/utils";

const CYCLE_MS = 3400;

/**
 * The thesis of the product in one moving picture: the same six real phones re-rank
 * as the use case changes. Rows slide to their new places (FLIP) and bars refill.
 */
export function RankingDemo({ demo }: { demo: LandingData["demo"] }) {
  const t = useMessages();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const lastTops = useRef(new Map<string, number>());

  const current = demo.useCases[active];
  const top = current.entries[0];

  // FLIP: measure where each row was, let React move it, then animate from old to new.
  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rows.current.forEach((el, slug) => {
      const next = el.offsetTop;
      const prev = lastTops.current.get(slug);
      if (prev !== undefined && prev !== next && !reduce) {
        el.animate(
          [
            { transform: `translateY(${prev - next}px)`, zIndex: 2 },
            { transform: "translateY(0)", zIndex: 2 },
          ],
          { duration: 650, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
        );
      }
      lastTops.current.set(slug, next);
    });
  }, [active]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const next = useCallback(() => setActive((i) => (i + 1) % demo.useCases.length), [demo.useCases.length]);

  useEffect(() => {
    // With reduced motion the demo waits for the viewer to pick a tab.
    if (!playing || hovered || !visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(next, CYCLE_MS);
    return () => clearInterval(timer);
  }, [playing, hovered, visible, next]);

  return (
    <div
      ref={rootRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="border-[3px] border-ink bg-paper shadow-[10px_10px_0_var(--pink)]"
    >
      <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink bg-ink px-4 py-2.5 text-paper">
        <span className="flex items-center gap-2 label-mono">
          <span className="inline-block size-2 animate-pulse bg-pink" aria-hidden />
          {t.landing.demoHeader(demo.budget)}
        </span>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? t.landing.pause : t.landing.play}
          className="p-1 hover:bg-pink hover:text-ink-deep"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      </div>

      <div role="tablist" aria-label={t.landing.rankThese} className="flex overflow-x-auto border-b-[3px] border-ink">
        {demo.useCases.map((u, i) => (
          <button
            key={u.id}
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => {
              setActive(i);
              setPlaying(false);
            }}
            className={cn(
              "relative flex shrink-0 items-center gap-2 border-r border-ink px-3.5 py-2.5 text-sm font-medium transition-colors last:border-r-0",
              i === active ? "bg-pink-tint" : "hover:bg-paper-deep",
            )}
          >
            <UseCaseIcon useCase={u.id} className={cn("size-4", i === active ? "text-pink" : "text-ink")} />
            {u.label}
            {i === active && playing && !hovered && visible && (
              <span
                key={`progress-${active}`}
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1 origin-left bg-pink"
                style={{ animation: `bar-sweep ${CYCLE_MS}ms linear reverse` }}
              />
            )}
          </button>
        ))}
      </div>

      <ol role="tabpanel" aria-live="polite" aria-label={t.landing.rankedForTab(current.label)} className="relative">
        {current.entries.map((entry, index) => (
          <li
            key={entry.slug}
            ref={(el) => {
              if (el) rows.current.set(entry.slug, el);
              else rows.current.delete(entry.slug);
            }}
            className={cn(
              "relative grid grid-cols-[2.75rem_1fr_3.25rem] items-center gap-3 border-b border-ink bg-paper px-4 py-3 last:border-b-0",
              index === 0 && "bg-pink-tint",
            )}
          >
            <span
              className={cn(
                "grid size-10 place-items-center border-[3px] border-ink font-heading text-2xl font-black tabular transition-colors",
                index === 0 ? "bg-pink text-ink-deep" : "bg-ink text-paper",
              )}
            >
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate font-heading text-xl font-black uppercase leading-tight">{entry.name}</span>
                <span className="shrink-0 label-mono text-ink-soft">{formatPrice(entry.price)}</span>
              </span>
              <span className="mt-1.5 block h-2.5 border-2 border-ink bg-paper">
                <span
                  className="block h-full bg-ink transition-[width] duration-700 ease-out"
                  style={{ width: `${entry.matchScore}%` }}
                />
              </span>
              {index === 0 && entry.strength && (
                <span className="mt-1.5 block truncate text-xs text-ink-soft">{entry.strength}</span>
              )}
            </span>
            <span className="text-right font-heading text-3xl font-black tabular">{entry.matchScore}</span>
          </li>
        ))}
      </ol>

      <Link
        href={finderHref({ category: "phone", useCase: current.id, budget: demo.budget })}
        className="flex items-center justify-between gap-3 border-t-[3px] border-ink px-4 py-3 label-mono transition-colors hover:bg-ink hover:text-paper"
      >
        <span>
          {t.landing.top(current.label, top.name)}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {t.landing.all(demo.poolSize)} <ArrowRight className="size-4" aria-hidden />
        </span>
      </Link>
    </div>
  );
}
