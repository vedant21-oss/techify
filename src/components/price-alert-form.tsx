"use client";

import { BellRing, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/engine";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "error"; message: string; limitReached?: boolean }
  | { kind: "done"; target: number; active: number; limit: number | null; updated: boolean };

export function PriceAlertForm({ slug, price, name }: { slug: string; price: number; name: string }) {
  const suggested = Math.floor((price * 0.9) / 500) * 500;
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState(String(suggested));
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, slug, targetPrice: Number(target.replace(/[^\d]/g, "")) }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", message: body.error ?? "Couldn't save the alert.", limitReached: body.code === "limit_reached" });
        return;
      }
      setStatus({ kind: "done", target: body.targetPrice, active: body.activeAlerts, limit: body.limit, updated: body.updated });
    } catch {
      setStatus({ kind: "error", message: "Couldn't reach Techify. Check your connection and try again." });
    }
  }

  if (status.kind === "done") {
    return (
      <div role="status" className="border-[3px] border-ink bg-pink-tint p-5 text-ink-deep">
        <p className="flex items-center gap-2 font-heading text-2xl font-black uppercase">
          <Check className="size-5" aria-hidden /> {status.updated ? "Alert updated" : "Alert set"}
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          We&apos;ll email {email} when the {name} drops to {formatPrice(status.target)} or less.{" "}
          {status.limit === null ? "You're on Pro, so there's no alert limit." : `You're watching ${status.active} of ${status.limit} devices on the free plan.`}
        </p>
        <button type="button" onClick={() => setStatus({ kind: "idle" })} className="mt-3 label-mono underline underline-offset-4">
          Change target
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border-[3px] border-ink bg-paper">
      <div className="flex flex-col gap-4 p-5">
        <p className="flex items-center gap-2 font-heading text-2xl font-black uppercase">
          <BellRing className="size-5 text-pink" aria-hidden /> Price-drop alert
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          Today it&apos;s {formatPrice(price)}. Tell us your price and we&apos;ll email you once when it gets there.
        </p>
        <div>
          <label htmlFor={`alert-target-${slug}`} className="label-mono">
            Email me at or below (₹)
          </label>
          <input
            id={`alert-target-${slug}`}
            name="targetPrice"
            inputMode="numeric"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-2 w-full border-[3px] border-ink bg-paper px-3 py-2.5 font-heading text-2xl font-bold tabular outline-none focus:bg-pink-tint"
          />
        </div>
        <div>
          <label htmlFor={`alert-email-${slug}`} className="label-mono">
            Email
          </label>
          <input
            id={`alert-email-${slug}`}
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full border-[3px] border-ink bg-paper px-3 py-2.5 outline-none placeholder:text-ink-soft focus:bg-pink-tint"
          />
        </div>
        {status.kind === "error" && (
          <p role="alert" className="bg-pink-tint px-3 py-2 text-sm font-medium text-ink-deep">
            {status.message}{" "}
            {status.limitReached && (
              <Link href="/pro" className="underline underline-offset-4">
                See Pro
              </Link>
            )}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={status.kind === "saving"}
        className="flex w-full items-center justify-center gap-2 border-t-[3px] border-ink bg-ink px-5 py-3.5 label-mono text-paper hover:bg-pink hover:text-ink-deep disabled:opacity-70"
      >
        {status.kind === "saving" && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {status.kind === "saving" ? "Saving" : "Set alert"}
      </button>
    </form>
  );
}
