"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/catalog-config";
import { formatPrice, requireProfile, type Category } from "@/lib/engine";
import type { ParseQueryResponse } from "@/lib/nl-query/types";
import { finderHref } from "@/lib/url";

const EXAMPLES = [
  "laptop under seventy thousand for coding and light gaming",
  "phone with a great camera around 45k",
  "long battery phone below 20,000",
];

function describe(r: ParseQueryResponse): string {
  return `${CATEGORIES.find((c) => c.id === r.category)!.label} · ${requireProfile(r.category, r.useCase).label} · up to ${formatPrice(r.budget)}`;
}

/** Types example sentences into the empty box's placeholder, one after another. */
function useTypedPlaceholder(enabled: boolean, fallback: string): string {
  const [typed, setTyped] = useState(fallback);
  useEffect(() => {
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let example = 0;
    let chars = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const target = EXAMPLES[example];
      if (!deleting) {
        chars += 1;
        setTyped(`${target.slice(0, chars)}▍`);
        if (chars === target.length) {
          deleting = true;
          timer = setTimeout(step, 1800);
          return;
        }
        timer = setTimeout(step, 38 + Math.random() * 40);
      } else {
        chars -= 2;
        setTyped(`${target.slice(0, Math.max(0, chars))}▍`);
        if (chars <= 0) {
          deleting = false;
          chars = 0;
          example = (example + 1) % EXAMPLES.length;
          timer = setTimeout(step, 350);
          return;
        }
        timer = setTimeout(step, 18);
      }
    };
    timer = setTimeout(step, 1200);
    return () => clearTimeout(timer);
  }, [enabled]);
  return typed;
}

/**
 * Free-text entry point: a sentence becomes the same inputs the manual controls set.
 * On a finder page for the same category it applies in place; otherwise it opens
 * the right finder page.
 */
export function QuickSearch({
  currentCategory,
  onApply,
  typewriter = false,
}: {
  currentCategory?: Category;
  onApply?: (result: ParseQueryResponse) => void;
  /** Animate example sentences in the placeholder (landing page). */
  typewriter?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const placeholder = useTypedPlaceholder(typewriter && !focused && !text, "Just type it: “laptop under 70k for coding”");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<ParseQueryResponse | null>(null);

  async function run(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setError('Describe what you need, for example "phone under 30k for photography".');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't read that. Try the controls instead.");
      const result = body as ParseQueryResponse;
      setApplied(result);
      if (onApply && result.category === currentCategory) {
        onApply(result);
      } else {
        router.push(`${finderHref({ category: result.category, useCase: result.useCase, budget: result.budget })}#results`);
      }
    } catch (err) {
      setApplied(null);
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="quick-search-label" className="border-[3px] border-ink bg-paper shadow-hard-pink">
      <form
        className="flex flex-col sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          run(text);
        }}
      >
        <label htmlFor="quick-search" id="quick-search-label" className="sr-only">
          Describe what you need
        </label>
        <input
          id="quick-search"
          name="query"
          type="text"
          value={text}
          maxLength={300}
          onChange={(event) => setText(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? "Describe what you need" : placeholder}
          className="min-w-0 flex-1 bg-transparent px-5 py-5 text-lg outline-none placeholder:text-ink-soft focus:bg-pink-tint sm:text-xl"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 border-t-[3px] border-ink bg-ink px-7 py-4 label-mono text-paper transition-colors hover:bg-pink hover:text-ink-deep disabled:opacity-70 sm:border-t-0 sm:border-l-[3px]"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? "Reading" : "Find matches"}
          {!pending && <ArrowRight className="size-4" aria-hidden />}
        </button>
      </form>

      <div className="flex flex-col gap-3 border-t border-ink px-5 py-4 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
        {error ? (
          <p className="text-sm font-medium text-ink-deep">
            <span className="mr-2 bg-pink px-1.5 py-0.5 label-mono">Hmm</span>
            {error}
          </p>
        ) : applied ? (
          <p className="text-sm">
            <span className="mr-2 label-mono text-ink-soft">
              Read {applied.source === "claude" ? "by Claude" : "by keyword rules"} as
            </span>
            <span className="font-medium">{describe(applied)}</span>
            {applied.assumed.includes("budget") && (
              <span className="text-ink-soft"> · no budget mentioned, so using {formatPrice(applied.budget)}</span>
            )}
            {applied.requestedBudget && applied.requestedBudget !== applied.budget && (
              <span className="text-ink-soft"> · adjusted to the nearest budget we cover</span>
            )}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="label-mono text-ink-soft">Try</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setText(example);
                  run(example);
                }}
                className="text-left underline decoration-pink decoration-2 underline-offset-4 hover:bg-pink-tint"
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
