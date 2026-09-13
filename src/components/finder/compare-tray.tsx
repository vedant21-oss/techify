"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import type { UseCase } from "@/lib/engine";
import { MAX_COMPARE, toSearchParams } from "@/lib/url";
import { cn } from "@/lib/utils";

export interface CompareSelection {
  slug: string;
  name: string;
}

export function CompareTray({
  selected,
  onRemove,
  onClear,
  useCase,
  budget,
}: {
  selected: CompareSelection[];
  onRemove: (slug: string) => void;
  onClear: () => void;
  useCase: UseCase;
  budget: number;
}) {
  if (selected.length === 0) return null;
  const ready = selected.length >= 2;
  const href = `/compare?${toSearchParams({ slugs: selected.map((s) => s.slug), useCase, budget })}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-pink bg-ink text-paper animate-in slide-in-from-bottom-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-(--gutter) py-4">
        <span className="font-heading text-2xl font-black uppercase tabular">
          Compare {selected.length}/{MAX_COMPARE}
        </span>
        <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
          {selected.map((s) => (
            <li key={s.slug} className="inline-flex items-center gap-2 border-2 border-paper py-1 pr-1 pl-3 text-sm">
              <span className="max-w-44 truncate">{s.name}</span>
              <button
                type="button"
                onClick={() => onRemove(s.slug)}
                className="p-1 hover:bg-pink hover:text-ink-deep"
                aria-label={`Remove ${s.name} from comparison`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onClear} className="label-mono underline underline-offset-4 hover:text-pink">
            Clear
          </button>
          <Link
            href={href}
            aria-disabled={!ready}
            tabIndex={ready ? undefined : -1}
            className={cn(
              "flex items-center gap-2 border-[3px] border-paper bg-pink px-5 py-2.5 label-mono text-ink-deep transition-transform hover:-translate-y-0.5",
              !ready && "pointer-events-none bg-paper/20 text-paper",
            )}
          >
            {ready ? "Compare side by side" : "Pick one more"}
            {ready && <ArrowRight className="size-4" aria-hidden />}
          </Link>
        </div>
      </div>
    </div>
  );
}
