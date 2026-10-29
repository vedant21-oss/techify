"use client";

import { useActionState } from "react";
import { BANKS, EMI_TENURES } from "@/lib/features/offers";
import {
  addAdAction,
  addOfferAction,
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

const STORES = ["Amazon", "Flipkart", "Croma", "Reliance Digital", "Vijay Sales", "Brand store"];

export function OfferForm({ devices }: { devices: { slug: string; label: string; category: "laptop" | "phone" }[] }) {
  const [state, action, pending] = useActionState(addOfferAction, null);
  const field = "flex flex-col gap-1";
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className={`${field} sm:col-span-2`}>
        <label htmlFor="offer-slug" className="label-mono">
          Device
        </label>
        <select id="offer-slug" name="slug" required defaultValue="" className={input}>
          <option value="" disabled>
            Pick a device
          </option>
          {(["phone", "laptop"] as const).map((category) => (
            <optgroup key={category} label={category === "phone" ? "Phones" : "Laptops"}>
              {devices
                .filter((d) => d.category === category)
                .map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className={field}>
        <label htmlFor="offer-bank" className="label-mono">
          Bank
        </label>
        <select id="offer-bank" name="bank" required className={input}>
          {BANKS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className={field}>
        <label htmlFor="offer-card" className="label-mono">
          Cards
        </label>
        <select id="offer-card" name="cardType" className={input}>
          <option value="CREDIT">Credit cards</option>
          <option value="DEBIT">Debit cards</option>
          <option value="ANY">Credit and debit</option>
        </select>
      </div>
      <div className={field}>
        <label htmlFor="offer-kind" className="label-mono">
          Discount type
        </label>
        <select id="offer-kind" name="kind" className={input}>
          <option value="FLAT">Flat ₹ off</option>
          <option value="PERCENT">% off</option>
        </select>
      </div>
      <div className={field}>
        <label htmlFor="offer-amount" className="label-mono">
          Amount (₹ or %; 0 for no-cost EMI only)
        </label>
        <input id="offer-amount" name="amount" inputMode="numeric" defaultValue="0" className={`${input} font-mono`} />
      </div>
      <div className={field}>
        <label htmlFor="offer-max" className="label-mono">
          Cap for % offers (₹, optional)
        </label>
        <input id="offer-max" name="maxDiscount" inputMode="numeric" className={`${input} font-mono`} />
      </div>
      <div className={field}>
        <label htmlFor="offer-nocost" className="label-mono">
          No-cost EMI up to
        </label>
        <select id="offer-nocost" name="noCostEmiMonths" className={input}>
          <option value="">None</option>
          {EMI_TENURES.map((m) => (
            <option key={m} value={m}>
              {m} months
            </option>
          ))}
        </select>
      </div>
      <div className={field}>
        <label htmlFor="offer-store" className="label-mono">
          Store
        </label>
        <input id="offer-store" name="store" list="offer-stores" required className={input} />
        <datalist id="offer-stores">
          {STORES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <div className={field}>
        <label htmlFor="offer-until" className="label-mono">
          Valid until (optional)
        </label>
        <input id="offer-until" name="validUntil" type="date" className={input} />
      </div>
      <label htmlFor="offer-emi-only" className="flex items-center gap-2 text-sm sm:col-span-2">
        <input id="offer-emi-only" name="emiOnly" type="checkbox" className="size-4 accent-[var(--pink)]" />
        The discount only applies on EMI
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={button}>
          {pending ? "Saving" : "Add offer"}
        </button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function AdForm({ devices }: { devices: { slug: string; label: string; category: "laptop" | "phone" }[] }) {
  const [state, action, pending] = useActionState(addAdAction, null);
  const field = "flex flex-col gap-1";
  const text = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={field}>
      <label htmlFor={`ad-${name}`} className="label-mono">
        {label}
      </label>
      <input id={`ad-${name}`} name={name} className={input} {...props} />
    </div>
  );
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {text("advertiser", "Advertiser (shown next to “Ad”)", { required: true, maxLength: 40, placeholder: "Samsung" })}
      {text("cta", "Button text", { required: true, maxLength: 24, placeholder: "See the offer" })}
      <div className="sm:col-span-2">{text("headline", "Headline (up to 70 characters)", { required: true, maxLength: 70, placeholder: "Galaxy S24 FE: ₹4,000 off this week" })}</div>
      <div className="sm:col-span-2">{text("body", "One line of copy (up to 160 characters)", { required: true, maxLength: 160 })}</div>
      <div className="sm:col-span-2">{text("url", "Link: https://… or a path on this site, like /device/…", { required: true })}</div>
      <fieldset className="flex flex-wrap gap-4 sm:col-span-2">
        <legend className="mb-1 label-mono">Show on</legend>
        {[
          ["home", "Home page"],
          ["results", "Finder results"],
          ["device", "Device pages"],
        ].map(([name, label]) => (
          <label key={name} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={name} defaultChecked={name !== "home"} className="size-4 accent-[var(--pink)]" />
            {label}
          </label>
        ))}
      </fieldset>
      <div className={field}>
        <label htmlFor="ad-category" className="label-mono">
          Audience
        </label>
        <select id="ad-category" name="category" className={input}>
          <option value="PHONE">Phone pages</option>
          <option value="LAPTOP">Laptop pages</option>
          <option value="">Both</option>
        </select>
      </div>
      <div className={field}>
        <label htmlFor="ad-device" className="label-mono">
          Promoted device (optional, shows its live price)
        </label>
        <select id="ad-device" name="deviceSlug" defaultValue="" className={input}>
          <option value="">None</option>
          {(["phone", "laptop"] as const).map((category) => (
            <optgroup key={category} label={category === "phone" ? "Phones" : "Laptops"}>
              {devices
                .filter((d) => d.category === category)
                .map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>
      {text("startsAt", "Starts (optional)", { type: "date" })}
      {text("endsAt", "Ends (optional)", { type: "date" })}
      <div className={field}>
        <label htmlFor="ad-weight" className="label-mono">
          Share when ads compete (1–10)
        </label>
        <input id="ad-weight" name="weight" type="number" min={1} max={10} defaultValue={1} className={`${input} font-mono`} />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={button}>
          {pending ? "Saving" : "Add ad"}
        </button>
        <Message state={state} />
      </div>
    </form>
  );
}
