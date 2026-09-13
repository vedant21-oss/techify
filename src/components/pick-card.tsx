"use client";

import { ArrowRight, Laptop, Smartphone } from "lucide-react";
import Link from "next/link";
import { displayName, keySpecs } from "@/components/device-meta";
import { useMessages } from "@/components/lang-provider";
import { ScoreBox } from "@/components/score-bar";
import { formatPrice } from "@/lib/engine";
import type { PickItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PickCard({ pick, size = "md" }: { pick: PickItem; size?: "md" | "lg" }) {
  const t = useMessages();
  const { device } = pick.item;
  const Icon = pick.category === "phone" ? Smartphone : Laptop;
  const isYear = pick.kind === "year";
  return (
    <article className={cn("flex flex-col border-[3px] border-ink", isYear ? "bg-ink text-paper" : "bg-paper")}>
      <div className={cn("flex items-center justify-between gap-3 border-b-[3px] px-5 py-3", isYear ? "border-paper bg-pink text-ink-deep" : "border-ink")}>
        <span className="flex items-center gap-2 font-heading text-2xl font-black uppercase">
          <Icon className="size-5" aria-hidden />
          {t.picks.title(pick.category, pick.kind)}
        </span>
        <span className="label-mono">{t.picks.period(pick.period)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className={size === "lg" ? "text-5xl sm:text-6xl" : "text-4xl"}>
              <Link href={`/device/${device.slug}`} className={isYear ? "hover:text-pink" : "hover:bg-pink-tint"}>
                {displayName(device)}
              </Link>
            </h3>
            <p className="mt-2 label-mono opacity-80">{device.variant}</p>
            <p className="mt-2 font-heading text-3xl font-bold tabular">{formatPrice(device.price)}</p>
          </div>
          <div className="flex gap-2">
            <ScoreBox score={pick.item.matchScore} label={t.results.allRound} tone="match" muted={isYear} />
            <ScoreBox score={pick.item.valueScore} label={t.results.value} tone="value" />
          </div>
        </div>
        <p className="max-w-[60ch] leading-relaxed">{pick.item.explanation.strengths.join(" · ") || pick.item.explanation.summary}</p>
        <p className={cn("label-mono leading-relaxed", isYear ? "text-paper/70" : "text-ink-soft")}>{keySpecs(device).join("  /  ")}</p>
        <p className={cn("mt-auto border-t pt-4 text-sm", isYear ? "border-paper/40 text-paper/80" : "border-ink text-ink-soft")}>
          {t.picks.method(pick.method)}
        </p>
      </div>
      <Link
        href={`/device/${device.slug}`}
        className={cn(
          "flex items-center gap-2 border-t-[3px] px-5 py-3.5 label-mono transition-colors",
          isYear ? "border-paper hover:bg-pink hover:text-ink-deep" : "border-ink hover:bg-ink hover:text-paper",
        )}
      >
        {t.picks.seeWhy(Math.round(pick.item.matchScore))} <ArrowRight className="size-4" aria-hidden />
      </Link>
    </article>
  );
}
