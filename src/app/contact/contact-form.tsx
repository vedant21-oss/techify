"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useMessages } from "@/components/lang-provider";

type Status = { kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string };

export function ContactForm({ name, email }: { name: string; email: string }) {
  const t = useMessages();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (String(form.get("message") ?? "").trim().length < 20) {
      setStatus({ kind: "error", message: t.contact.tooShort });
      return;
    }
    setStatus({ kind: "sending" });
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    }).catch(() => null);
    const body = res ? await res.json().catch(() => ({})) : {};
    setStatus(res?.ok ? { kind: "sent" } : { kind: "error", message: body.error ?? t.contact.error });
  }

  if (status.kind === "sent") {
    return (
      <div role="status" className="self-start border-[3px] border-ink bg-pink-tint p-6 text-ink-deep">
        <p className="flex items-center gap-3 font-heading text-3xl font-black uppercase">
          <Check className="size-7" aria-hidden /> {t.contact.sent}
        </p>
        <p className="mt-3 max-w-[48ch] leading-relaxed">{t.contact.sentNote}</p>
      </div>
    );
  }

  const field = "mt-2 w-full border-[3px] border-ink bg-paper px-3 py-2.5 outline-none placeholder:text-ink-soft focus:bg-pink-tint";
  return (
    <form onSubmit={submit} className="min-w-0 border-[3px] border-ink bg-paper">
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="label-mono">
              {t.contact.name}
            </label>
            <input id="contact-name" name="name" required minLength={2} maxLength={60} defaultValue={name} className={field} />
          </div>
          <div>
            <label htmlFor="contact-email" className="label-mono">
              {t.contact.email}
            </label>
            <input id="contact-email" name="email" type="email" required defaultValue={email} placeholder="you@example.com" className={field} />
          </div>
        </div>
        <div>
          <label htmlFor="contact-subject" className="label-mono">
            {t.contact.subject}
          </label>
          <select id="contact-subject" name="subject" className={field}>
            {t.contact.subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="contact-message" className="label-mono">
            {t.contact.message}
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={20}
            maxLength={2000}
            rows={7}
            placeholder={t.contact.placeholder}
            className={field}
          />
        </div>
        {status.kind === "error" && (
          <p role="alert" className="bg-pink-tint px-3 py-2 text-sm font-medium text-ink-deep">
            {status.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={status.kind === "sending"}
        className="flex w-full items-center justify-center gap-3 border-t-[3px] border-ink bg-ink px-6 py-4 font-heading text-2xl font-black uppercase text-paper transition-colors hover:bg-pink hover:text-ink-deep disabled:opacity-70"
      >
        {status.kind === "sending" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
        {status.kind === "sending" ? t.contact.sending : t.contact.send}
      </button>
    </form>
  );
}
