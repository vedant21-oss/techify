"use client";

import { Check, Loader2, Star } from "lucide-react";
import { useState } from "react";
import { useLang, useMessages } from "@/components/lang-provider";
import { LOCALE } from "@/lib/i18n/config";
import type { DeviceDetailResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type Reviews = DeviceDetailResponse["reviews"];

export function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const t = useMessages();
  return (
    <span className="inline-flex" aria-label={t.reviews.stars(rating)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(size === "lg" ? "size-6" : "size-4", n <= Math.round(rating) ? "fill-pink text-ink" : "text-ink-soft")}
        />
      ))}
    </span>
  );
}

export function ReviewsSection({ slug, name, reviews, useCases }: { slug: string; name: string; reviews: Reviews; useCases: string[] }) {
  const t = useMessages();
  const dateFmt = new Intl.DateTimeFormat(LOCALE[useLang()], { month: "short", year: "numeric" });
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-4">
          {reviews.average !== null ? (
            <>
              <span className="font-heading text-6xl font-black tabular">{reviews.average.toFixed(1)}</span>
              <span>
                <Stars rating={reviews.average} size="lg" />
                <span className="mt-1 block label-mono text-ink-soft">
                  {t.reviews.count(reviews.count)}
                </span>
              </span>
            </>
          ) : (
            <p className="text-ink-soft">{t.reviews.none(name)}</p>
          )}
        </div>
        <ul className="mt-8 flex flex-col gap-5">
          {reviews.items.map((r) => (
            <li key={r.id} className="border-[3px] border-ink bg-paper p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars rating={r.rating} />
                <span className="label-mono text-ink-soft">
                  {t.reviews.meta(r.name, r.ownedMonths, r.usedFor)}
                  {dateFmt.format(new Date(r.createdAt))}
                </span>
              </div>
              <h3 className="mt-3 text-2xl">{r.title}</h3>
              <p className="mt-2 max-w-[65ch] whitespace-pre-line leading-relaxed">{r.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <ReviewForm slug={slug} name={name} useCases={useCases} />
    </div>
  );
}

function ReviewForm({ slug, name, useCases }: { slug: string; name: string; useCases: string[] }) {
  const t = useMessages();
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "done" } | { kind: "error"; message: string }>({ kind: "idle" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!rating) {
      setStatus({ kind: "error", message: t.reviews.pickRating });
      return;
    }
    setStatus({ kind: "saving" });
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(form), slug, rating }),
    }).catch(() => null);
    const body = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setStatus({ kind: "error", message: body.error ?? t.reviews.sendError });
      return;
    }
    setStatus({ kind: "done" });
  }

  if (status.kind === "done") {
    return (
      <div role="status" className="self-start border-[3px] border-ink bg-pink-tint p-5 text-ink-deep">
        <p className="flex items-center gap-2 font-heading text-2xl font-black uppercase">
          <Check className="size-5" aria-hidden /> {t.reviews.thanks}
        </p>
        <p className="mt-2 text-sm">{t.reviews.thanksNote}</p>
      </div>
    );
  }

  const field = "w-full border-[3px] border-ink bg-paper px-3 py-2 outline-none focus:bg-pink-tint";
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 self-start border-[3px] border-ink bg-paper p-5">
      <p className="font-heading text-2xl font-black uppercase">{t.reviews.own(name)}</p>
      <fieldset>
        <legend className="label-mono">{t.reviews.rating}</legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label={t.reviews.ratingGroup}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t.reviews.star(n)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star className={cn("size-7", n <= rating ? "fill-pink text-ink" : "text-ink-soft")} aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>
      {[
        ["review-title", "title", t.reviews.headline, "text"],
        ["review-name", "name", t.reviews.name, "text"],
        ["review-email", "email", t.reviews.email, "email"],
      ].map(([id, nameAttr, label, type]) => (
        <div key={id}>
          <label htmlFor={`${id}-${slug}`} className="label-mono">
            {label}
          </label>
          <input id={`${id}-${slug}`} name={nameAttr} type={type} required className={`mt-1 ${field}`} />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`review-used-${slug}`} className="label-mono">
            {t.reviews.mostlyFor}
          </label>
          <select id={`review-used-${slug}`} name="usedFor" className={`mt-1 ${field}`}>
            {useCases.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`review-months-${slug}`} className="label-mono">
            {t.reviews.months}
          </label>
          <input id={`review-months-${slug}`} name="ownedMonths" type="number" min={0} max={120} defaultValue={3} required className={`mt-1 ${field}`} />
        </div>
      </div>
      <div>
        <label htmlFor={`review-body-${slug}`} className="label-mono">
          {t.reviews.body}
        </label>
        <textarea id={`review-body-${slug}`} name="body" required minLength={40} rows={5} className={`mt-1 ${field}`} placeholder={t.reviews.placeholder} />
      </div>
      {status.kind === "error" && (
        <p role="alert" className="bg-pink-tint px-3 py-2 text-sm font-medium text-ink-deep">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={status.kind === "saving"}
        className="flex items-center justify-center gap-2 border-[3px] border-ink bg-ink px-5 py-3 label-mono text-paper hover:bg-pink hover:text-ink-deep disabled:opacity-70"
      >
        {status.kind === "saving" && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {status.kind === "saving" ? t.reviews.sending : t.reviews.submit}
      </button>
      <p className="text-xs text-ink-soft">{t.reviews.note}</p>
    </form>
  );
}
