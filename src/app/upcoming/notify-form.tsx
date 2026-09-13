"use client";

import { BellRing, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMessages } from "@/components/lang-provider";

export function NotifyForm({ slug, name }: { slug: string; name: string }) {
  const t = useMessages();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "saving" | "done" } | { kind: "error"; message: string }>({ kind: "idle" });

  if (state.kind === "done") {
    return (
      <p role="status" className="flex items-center gap-2 bg-pink-tint px-3 py-2 text-sm font-medium text-ink-deep">
        <Check className="size-4" aria-hidden /> {t.upcoming.done(name)}
      </p>
    );
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setState({ kind: "saving" });
        const res = await fetch("/api/upcoming/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, email }),
        }).catch(() => null);
        const body = res ? await res.json().catch(() => ({})) : {};
        setState(res?.ok ? { kind: "done" } : { kind: "error", message: body.error ?? t.upcoming.error });
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex flex-col sm:flex-row">
        <label htmlFor={`notify-${slug}`} className="sr-only">
          {t.upcoming.emailFor(name)}
        </label>
        <input
          id={`notify-${slug}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 border-[3px] border-ink bg-paper px-3 py-2 outline-none focus:bg-pink-tint"
        />
        <button
          type="submit"
          disabled={state.kind === "saving"}
          className="flex items-center justify-center gap-2 border-[3px] border-t-0 border-ink bg-ink px-4 py-2 label-mono text-paper hover:bg-pink hover:text-ink-deep sm:border-t-[3px] sm:border-l-0"
        >
          {state.kind === "saving" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BellRing className="size-4" aria-hidden />}
          {t.upcoming.notify}
        </button>
      </div>
      {state.kind === "error" && (
        <p role="alert" className="text-sm text-ink-deep">
          {state.message}
        </p>
      )}
    </form>
  );
}
