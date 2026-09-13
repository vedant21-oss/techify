"use client";

import { useMemo, useRef, useState } from "react";
import { useLang, useMessages } from "@/components/lang-provider";
import { formatPrice } from "@/lib/engine";
import { LOCALE } from "@/lib/i18n/config";
import type { DeviceDetailResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type History = DeviceDetailResponse["priceHistory"];

const W = 640;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 64 };

/**
 * Price over time as a step line: prices hold until they change. One series, so no
 * legend; a crosshair tooltip on hover and a text list for screen readers.
 */
export function PriceHistoryChart({ history, asOf }: { history: History; /** ISO "today" from the server. */ asOf: string }) {
  const t = useMessages();
  const lang = useLang();
  const dateFmt = new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const { summary } = history;
  const current = summary.current;
  const points = useMemo(() => {
    const pts = history.points.map((p) => ({ price: p.price, t: new Date(p.recordedAt).getTime() }));
    // Extend the last price to today so the line reaches the present.
    if (pts.length) pts.push({ price: current, t: Math.max(new Date(asOf).getTime(), pts.at(-1)!.t) });
    return pts;
  }, [history.points, current, asOf]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (history.points.length < 2) {
    return (
      <div className="border-[3px] border-ink bg-paper p-5">
        <p className="label-mono text-ink-soft">{t.chart.title}</p>
        <p className="mt-2 font-heading text-3xl font-black tabular">{formatPrice(summary.current)}</p>
        <p className="mt-2 text-sm text-ink-soft">
          {summary.trackingSince ? t.chart.trackingSince(dateFmt.format(new Date(summary.trackingSince))) : t.chart.willChart}
        </p>
      </div>
    );
  }

  const t0 = points[0].t;
  const t1 = points.at(-1)!.t;
  const prices = points.map((p) => p.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const pad = Math.max(500, (hi - lo) * 0.15);
  const yMin = Math.floor((lo - pad) / 1000) * 1000;
  const yMax = Math.ceil((hi + pad) / 1000) * 1000;
  const x = (t: number) => PAD.left + ((t - t0) / Math.max(1, t1 - t0)) * (W - PAD.left - PAD.right);
  const y = (p: number) => PAD.top + (1 - (p - yMin) / Math.max(1, yMax - yMin)) * (H - PAD.top - PAD.bottom);

  let path = `M${x(points[0].t)},${y(points[0].price)}`;
  for (let i = 1; i < points.length; i++) path += ` H${x(points[i].t)} V${y(points[i].price)}`;
  const ticks = [yMin, Math.round((yMin + yMax) / 2 / 500) * 500, yMax];
  const changes = history.points.map((p) => ({ price: p.price, t: new Date(p.recordedAt).getTime() }));

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    let nearest = 0;
    changes.forEach((c, i) => {
      if (Math.abs(x(c.t) - px) < Math.abs(x(changes[nearest].t) - px)) nearest = i;
    });
    setHover(nearest);
  }

  const active = hover === null ? null : changes[hover];

  return (
    <figure className="border-[3px] border-ink bg-paper p-4 sm:p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label-mono text-ink-soft">{t.chart.title}</span>
        <span className="text-sm">
          {summary.change < 0 ? (
            <span className="bg-pink px-1.5 py-0.5 font-medium text-ink-deep">
              {t.chart.down(-summary.change, Math.abs(summary.changePercent))}
            </span>
          ) : summary.change > 0 ? (
            <span className="font-medium">{t.chart.up(summary.change, summary.changePercent)}</span>
          ) : (
            t.chart.noChange
          )}
          {summary.isLowest && <span className="ml-2 label-mono">{t.chart.lowest}</span>}
        </span>
      </figcaption>

      <div className="relative mt-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none"
          role="img"
          aria-label={t.chart.aria(changes[0].price, summary.current)}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--rule)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fontFamily="var(--font-plex-mono), monospace" fill="var(--ink-soft)">
                ₹{Math.round(tick / 1000)}k
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 6} fontSize="11" fontFamily="var(--font-plex-mono), monospace" fill="var(--ink-soft)">
            {dateFmt.format(new Date(t0))}
          </text>
          <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="11" fontFamily="var(--font-plex-mono), monospace" fill="var(--ink-soft)">
            {t.chart.today}
          </text>
          <path d={path} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
          {changes.map((c, i) => (
            <circle
              key={i}
              cx={x(c.t)}
              cy={y(c.price)}
              r={hover === i ? 6 : 4.5}
              fill={hover === i ? "var(--pink)" : "var(--ink)"}
              stroke="var(--paper)"
              strokeWidth="2"
            />
          ))}
          {active && (
            <line x1={x(active.t)} x2={x(active.t)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--ink-soft)" strokeWidth="1" strokeDasharray="3 3" />
          )}
        </svg>
        {active && (
          <div
            className={cn(
              "pointer-events-none absolute top-0 border-2 border-ink bg-paper px-2.5 py-1.5 text-xs shadow-hard",
              x(active.t) / W > 0.6 ? "-translate-x-full" : "",
            )}
            style={{ left: `${(x(active.t) / W) * 100}%` }}
          >
            <span className="block font-mono tabular text-ink-soft">{dateFmt.format(new Date(active.t))}</span>
            <span className="font-heading text-lg font-black tabular">{formatPrice(active.price)}</span>
          </div>
        )}
      </div>

      <ul className="sr-only">
        {changes.map((c, i) => (
          <li key={i}>
            {dateFmt.format(new Date(c.t))}: {formatPrice(c.price)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-soft">
        {t.chart.summary(summary.lowest, summary.highest, summary.points)}
      </p>
    </figure>
  );
}
