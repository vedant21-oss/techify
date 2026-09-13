"use client";

import { useActionState } from "react";
import {
  addUpcomingAction,
  loginAction,
  markLaunchedAction,
  updatePriceAction,
  type ActionState,
} from "./actions";

const input = "border-[3px] border-ink bg-paper px-3 py-2 outline-none focus:bg-pink-tint";
const button = "border-[3px] border-ink bg-ink px-4 py-2 label-mono text-paper hover:bg-pink hover:text-ink-deep disabled:opacity-60";

function Message({ state }: { state: ActionState }) {
  if (!state?.message) return null;
  return (
    <p role="status" className={state.ok ? "text-sm text-ink" : "bg-pink-tint px-2 py-1 text-sm text-ink-deep"}>
      {state.message}
    </p>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label htmlFor="admin-password" className="label-mono">
        Admin password
      </label>
      <input id="admin-password" name="password" type="password" required autoComplete="current-password" className={input} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Checking" : "Log in"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function PriceForm({ slug, price }: { slug: string; price: number }) {
  const [state, action, pending] = useActionState(updatePriceAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <label htmlFor={`price-${slug}`} className="sr-only">
        New price for {slug}
      </label>
      <input id={`price-${slug}`} name="price" defaultValue={price} inputMode="numeric" className={`${input} w-32 font-mono tabular`} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Saving" : "Save"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function UpcomingForm() {
  const [state, action, pending] = useActionState(addUpcomingAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {[
        ["brand", "Brand"],
        ["name", "Model name"],
        ["expectedLaunch", "Expected launch (e.g. November 2026)"],
        ["expectedPrice", "Expected price in ₹ (optional)"],
        ["sourceUrl", "Source link (optional)"],
      ].map(([name, label]) => (
        <div key={name} className="flex flex-col gap-1">
          <label htmlFor={`up-${name}`} className="label-mono">
            {label}
          </label>
          <input id={`up-${name}`} name={name} className={input} />
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <label htmlFor="up-category" className="label-mono">
          Category
        </label>
        <select id="up-category" name="category" className={input}>
          <option value="phone">Phone</option>
          <option value="laptop">Laptop</option>
        </select>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="up-summary" className="label-mono">
          One-line summary
        </label>
        <input id="up-summary" name="summary" className={input} />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={button}>
          {pending ? "Saving" : "Add or update"}
        </button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function LaunchForm({ upcomingSlug }: { upcomingSlug: string }) {
  const [state, action, pending] = useActionState(markLaunchedAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="upcomingSlug" value={upcomingSlug} />
      <label htmlFor={`launch-${upcomingSlug}`} className="sr-only">
        Catalogue slug of the launched device
      </label>
      <input id={`launch-${upcomingSlug}`} name="catalogueSlug" placeholder="catalogue slug" className={`${input} w-56 font-mono text-sm`} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Notifying" : "Mark launched"}
      </button>
      <Message state={state} />
    </form>
  );
}
