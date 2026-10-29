"use client";

import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { UseCaseIcon } from "@/components/use-case-icon";
import { BUDGET_RANGES, DEFAULT_USE_CASE } from "@/lib/catalog-config";
import { PROFILES, formatBudgetShort, formatPrice, type UseCase } from "@/lib/engine";
import { searchDevices } from "@/lib/features/search";
import { UPGRADE_BUDGETS } from "@/lib/features/upgrade";
import type { UpgradeStart } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = 8;

/** Pick what you have now, what you mostly do with it, and what you'd spend. */
export function UpgradePicker({ devices }: { devices: UpgradeStart[] }) {
  const [query, setQuery] = useState("");
  const [device, setDevice] = useState<UpgradeStart | null>(null);
  const [useCase, setUseCase] = useState<UseCase | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const matches = useMemo(
    () => (query.trim().length < 2 ? [] : searchDevices(devices, query).slice(0, SUGGESTIONS)),
    [devices, query],
  );

  if (!device) {
    return (
      <div className="border-[3px] border-ink bg-paper">
        <div className="flex items-center border-b-[3px] border-ink">
          <Search className="mx-4 size-4 shrink-0" aria-hidden />
          <label htmlFor="upgrade-from" className="sr-only">
            The phone or laptop you have now
          </label>
          <input
            id="upgrade-from"
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="The phone or laptop you have now, e.g. iPhone 12"
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
                    setDevice(d);
                    setUseCase(DEFAULT_USE_CASE[d.category]);
                    setBudget(BUDGET_RANGES[d.category].default);
                    setQuery("");
                  }}
                  className="flex w-full items-baseline justify-between gap-4 border-b border-ink px-4 py-3 text-left last:border-b-0 hover:bg-pink-tint"
                >
                  <span className="min-w-0">
                    <span className="label-mono text-ink-soft">{d.brand}</span>{" "}
                    <span className="font-heading text-xl font-bold uppercase">{d.name}</span>{" "}
                    <span className="text-sm text-ink-soft">{d.variant}</span>
                  </span>
                  <span className="shrink-0 label-mono text-ink-soft">
                    {d.onSale ? formatPrice(d.price) : `${d.releaseYear} · no longer sold`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-ink-soft">
            {query.trim().length >= 2
              ? `Nothing matches “${query.trim()}”. Try the model name without the storage size.`
              : "Type at least two letters. Older models from 2018 on are included, as well as everything on sale."}
          </p>
        )}
      </div>
    );
  }

  const href = `/upgrade?${new URLSearchParams({ from: device.slug, useCase: useCase!, budget: String(budget) })}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-[3px] border-ink bg-paper p-6">
        <div>
          <p className="label-mono text-ink-soft">You have</p>
          <p className="mt-2 font-heading text-4xl font-black uppercase leading-none">
            {device.brand} {device.name}
          </p>
          <p className="mt-2 label-mono text-ink-soft">
            {device.variant} · {device.releaseYear}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDevice(null);
            requestAnimationFrame(() => input.current?.focus());
          }}
          className="flex items-center gap-2 border-[3px] border-ink px-4 py-2 label-mono hover:bg-ink hover:text-paper"
        >
          <X className="size-4" aria-hidden /> Change
        </button>
      </div>

      <fieldset className="border-[3px] border-ink bg-paper p-6">
        <legend className="px-1 label-mono">Mostly for</legend>
        <div className="flex flex-wrap gap-2">
          {PROFILES[device.category].map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={useCase === p.id}
              onClick={() => setUseCase(p.id)}
              className={cn(
                "inline-flex items-center gap-2 border-[3px] border-ink px-3.5 py-2 text-sm font-medium transition-colors",
                useCase === p.id ? "bg-ink text-paper" : "bg-paper hover:bg-pink-tint",
              )}
            >
              <UseCaseIcon useCase={p.id} className={cn("size-4", useCase === p.id ? "text-pink" : "text-ink")} />
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="border-[3px] border-ink bg-paper p-6">
        <legend className="px-1 label-mono">I&apos;d spend up to</legend>
        <div className="flex flex-wrap gap-2">
          {UPGRADE_BUDGETS[device.category].map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={budget === b}
              onClick={() => setBudget(b)}
              className={cn(
                "border-[3px] border-ink px-3.5 py-2 font-heading text-lg font-bold tabular transition-colors",
                budget === b ? "bg-ink text-paper" : "bg-paper hover:bg-pink-tint",
              )}
            >
              {formatBudgetShort(b)}
            </button>
          ))}
        </div>
      </fieldset>

      <Link
        href={href}
        className="flex items-center gap-3 self-start border-[3px] border-ink bg-ink px-7 py-4 font-heading text-3xl font-black uppercase text-paper shadow-[6px_6px_0_var(--pink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_var(--pink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        Check upgrades <ArrowRight className="size-7" aria-hidden />
      </Link>
    </div>
  );
}
