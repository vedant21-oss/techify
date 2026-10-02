"use client";

import { ArrowRight, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useMessages } from "@/components/lang-provider";
import { formatPrice } from "@/lib/engine";
import { searchDevices } from "@/lib/features/search";
import type { ComparableDevice } from "@/lib/types";
import { MAX_COMPARE, toSearchParams, versusHref } from "@/lib/url";

/** How many matches a slot offers at once; more than this and you should keep typing. */
const SUGGESTIONS = 6;

/**
 * The front door to a comparison: pick two devices (or three) and go.
 *
 * The whole catalogue is already in the browser, so matching is the same
 * `searchDevices` the search page uses, running locally — no round trip per
 * keystroke, and the ranking stays identical to search results.
 *
 * The first pick locks the category. Comparing a laptop against a phone scores them
 * on different factors and the engine refuses it, so the picker never offers it.
 */
export function ComparePicker({ devices }: { devices: ComparableDevice[] }) {
  const t = useMessages().compare;
  const [picked, setPicked] = useState<(ComparableDevice | null)[]>([null, null]);

  const chosen = picked.filter((d): d is ComparableDevice => d !== null);
  const category = chosen[0]?.category ?? null;
  const ready = chosen.length >= 2;

  // Two picks go to the head-to-head, which has its own shareable URL; three can
  // only be shown by the side-by-side table.
  const href = !ready
    ? null
    : chosen.length === 2
      ? versusHref(chosen[0].slug, chosen[1].slug)
      : `/compare?${toSearchParams({ slugs: chosen.map((d) => d.slug) })}`;

  const setAt = (i: number, device: ComparableDevice | null) =>
    setPicked((prev) => prev.map((d, j) => (j === i ? device : d)));

  return (
    <div>
      <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <Slot
          index={0}
          device={picked[0]}
          devices={devices}
          category={category}
          taken={chosen.map((d) => d.slug)}
          onPick={(d) => setAt(0, d)}
        />
        <div className="flex items-center justify-center">
          <span className="font-heading text-5xl font-black uppercase text-pink">{t.vs}</span>
        </div>
        <Slot
          index={1}
          device={picked[1]}
          devices={devices}
          category={category}
          taken={chosen.map((d) => d.slug)}
          onPick={(d) => setAt(1, d)}
        />
      </div>

      {/* A third is optional, and only once the first two are settled. */}
      {picked.length < MAX_COMPARE && ready && (
        <button
          type="button"
          onClick={() => setPicked((prev) => [...prev, null])}
          className="mt-4 flex items-center gap-2 border-[3px] border-ink px-4 py-2.5 label-mono hover:bg-ink hover:text-paper"
        >
          <Plus className="size-4" aria-hidden /> {t.addThird}
        </button>
      )}
      {picked.length > 2 && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <Slot
            index={2}
            device={picked[2]}
            devices={devices}
            category={category}
            taken={chosen.map((d) => d.slug)}
            onPick={(d) => setAt(2, d)}
            onDrop={() => setPicked((prev) => prev.slice(0, 2))}
          />
          <div /> <div />
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        {href ? (
          <Link
            href={href}
            className="flex items-center gap-3 border-[3px] border-ink bg-ink px-7 py-4 font-heading text-3xl font-black uppercase text-paper shadow-[6px_6px_0_var(--pink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_var(--pink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {t.go} <ArrowRight className="size-7" aria-hidden />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-3 border-[3px] border-ink/40 px-7 py-4 font-heading text-3xl font-black uppercase text-ink/40"
          >
            {t.go} <ArrowRight className="size-7" aria-hidden />
          </span>
        )}
        <p aria-live="polite" className="label-mono text-ink-soft">
          {ready ? t.readyNote(chosen.length) : t.pickTwo}
        </p>
      </div>
    </div>
  );
}

/** One side of the comparison: a search box until something is picked, then the pick. */
function Slot({
  index,
  device,
  devices,
  category,
  taken,
  onPick,
  onDrop,
}: {
  index: number;
  device: ComparableDevice | null;
  devices: ComparableDevice[];
  category: string | null;
  taken: string[];
  onPick: (device: ComparableDevice | null) => void;
  onDrop?: () => void;
}) {
  const t = useMessages().compare;
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const listId = `compare-slot-${index}`;

  const matches = useMemo(() => {
    if (query.trim().length < 2) return [];
    // Only devices that can actually be compared with what's already chosen.
    const pool = devices.filter(
      (d) => !taken.includes(d.slug) && (category === null || d.category === category),
    );
    return searchDevices(pool, query).slice(0, SUGGESTIONS);
  }, [devices, query, category, taken]);

  if (device) {
    return (
      <div className="flex flex-col justify-between border-[3px] border-ink bg-paper p-6">
        <div>
          <p className="label-mono text-ink-soft">{device.brand}</p>
          <p className="mt-2 font-heading text-4xl font-black uppercase leading-none">{device.name}</p>
          <p className="mt-3 label-mono text-ink-soft">{device.variant}</p>
          <p className="mt-4 font-heading text-3xl font-bold tabular">{formatPrice(device.price)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onPick(null);
            setQuery("");
            // Put the cursor back where the next pick is made.
            requestAnimationFrame(() => input.current?.focus());
          }}
          className="mt-6 flex items-center gap-2 self-start border-[3px] border-ink px-4 py-2 label-mono hover:bg-ink hover:text-paper"
        >
          <X className="size-4" aria-hidden /> {t.change}
        </button>
      </div>
    );
  }

  return (
    <div className="border-[3px] border-ink bg-paper">
      <div className="flex items-center border-b-[3px] border-ink">
        <Search className="mx-4 size-4 shrink-0" aria-hidden />
        <label htmlFor={listId} className="sr-only">
          {t.slotLabel(index + 1)}
        </label>
        <input
          id={listId}
          ref={input}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-4 pr-4 text-lg outline-none placeholder:text-ink-soft focus:bg-pink-tint"
        />
      </div>

      {matches.length > 0 ? (
        <ul>
          {matches.map((d) => (
            <li key={d.slug}>
              <button
                type="button"
                onClick={() => {
                  onPick(d);
                  setQuery("");
                }}
                className="flex w-full items-baseline justify-between gap-4 border-b border-ink px-4 py-3 text-left hover:bg-pink-tint"
              >
                <span className="min-w-0">
                  <span className="label-mono text-ink-soft">{d.brand}</span>{" "}
                  <span className="font-heading text-xl font-bold uppercase">{d.name}</span>
                </span>
                <span className="shrink-0 font-heading font-bold tabular">{formatPrice(d.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-sm text-ink-soft">
          {query.trim().length >= 2 ? t.noMatch(query.trim()) : t.hint}
        </p>
      )}

      {onDrop && (
        <button type="button" onClick={onDrop} className="w-full border-t-[3px] border-ink px-4 py-2.5 label-mono hover:bg-ink hover:text-paper">
          {t.removeThird}
        </button>
      )}
    </div>
  );
}
