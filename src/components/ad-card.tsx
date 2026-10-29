"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMessages } from "@/components/lang-provider";
import type { AdDTO } from "@/lib/features/ads";
import { cn } from "@/lib/utils";

/** Half the ad on screen counts as seen; each page view counts it at most once. */
const SEEN_THRESHOLD = 0.5;

/**
 * A sponsored slot, set like a newspaper classified: dashed rule, an "Ad" tag with
 * the advertiser's name, and a note that ads don't touch rankings. `wide` lays it out
 * in a row for full-width slots; otherwise it stacks for a sidebar.
 */
export function AdCard({ ad, wide = false, className }: { ad: AdDTO; wide?: boolean; className?: string }) {
  const t = useMessages().ads;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const url = `/api/ads/${ad.id}/view`;
        if (!navigator.sendBeacon?.(url)) void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
      },
      { threshold: SEEN_THRESHOLD },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ad.id]);

  const Arrow = ad.external ? ArrowUpRight : ArrowRight;

  return (
    <aside ref={ref} aria-label={t.region(ad.advertiser)} className={cn("border-[3px] border-dashed border-ink bg-paper-deep", className)}>
      <div className={cn("flex gap-5 p-5", wide ? "flex-col sm:flex-row sm:items-center sm:justify-between" : "flex-col")}>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="border-2 border-ink bg-ink px-1.5 py-px label-mono text-paper">{t.label}</span>
            <span className="label-mono text-ink-soft">{ad.advertiser}</span>
          </p>
          <p className={cn("mt-3 font-heading font-black uppercase leading-[0.95]", wide ? "text-3xl sm:text-4xl" : "text-3xl")}>
            {ad.headline}
          </p>
          <p className="mt-2 max-w-[60ch] leading-relaxed">{ad.body}</p>
          {ad.device && (
            <p className="mt-3 inline-block bg-pink-tint px-2 py-0.5 text-sm font-medium text-ink-deep">
              {ad.device.name} · {t.today(ad.device.price)}
            </p>
          )}
        </div>
        {/* A plain link, not next/link: prefetching would count as clicks. */}
        <a
          href={ad.href}
          rel={ad.external ? "sponsored noopener" : "sponsored"}
          target={ad.external ? "_blank" : undefined}
          className="flex shrink-0 items-center justify-center gap-2 self-start border-[3px] border-ink bg-pink px-5 py-3 label-mono text-ink-deep shadow-hard transition-transform hover:-translate-y-0.5 sm:self-auto"
        >
          {ad.cta} <Arrow className="size-4" aria-hidden />
        </a>
      </div>
      <p className="border-t border-dashed border-ink px-5 py-2 text-xs text-ink-soft">{t.note}</p>
    </aside>
  );
}
