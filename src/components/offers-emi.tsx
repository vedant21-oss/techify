"use client";

import { Calculator, CreditCard } from "lucide-react";
import { useState } from "react";
import { useLang, useMessages } from "@/components/lang-provider";
import { formatPrice } from "@/lib/engine";
import { LOCALE } from "@/lib/i18n/config";
import {
  bankName,
  DEFAULT_EMI_MONTHS,
  DEFAULT_EMI_RATE,
  EMI_TENURES,
  offerDiscount,
  planFor,
  type CardOffer,
} from "@/lib/features/offers";
import { cn } from "@/lib/utils";

/**
 * The card offers running on a device, and an EMI calculator that starts from the
 * price after whichever offer is picked. Everything is computed in the browser from
 * the offers the page already has, so changing a tenure is instant.
 */
export function OffersAndEmi({
  price,
  offers,
  initialOfferId,
}: {
  price: number;
  offers: CardOffer[];
  /** The offer the finder applied for the buyer's card, if any. */
  initialOfferId: string | null;
}) {
  const t = useMessages();
  const lang = useLang();
  const initial = offers.find((o) => o.id === initialOfferId) ?? null;
  const [offerId, setOfferId] = useState<string>(initial?.id ?? "");
  const [months, setMonths] = useState<number>(initial?.noCostEmiMonths ?? DEFAULT_EMI_MONTHS);
  const [rateText, setRateText] = useState(String(DEFAULT_EMI_RATE));

  const offer = offers.find((o) => o.id === offerId) ?? null;
  const priceAfter = price - (offer ? offerDiscount(offer, price) : 0);
  const rate = Math.min(60, Math.max(0, Number(rateText.replace(",", ".")) || 0));
  const plan = planFor(priceAfter, months, offer?.noCostEmiMonths ?? null, rate);
  const date = new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", timeZone: "UTC" });

  const discount = (o: CardOffer) =>
    o.amount <= 0 ? null : o.kind === "flat" ? t.emi.flatOff(o.amount) : t.emi.percentOff(o.amount, o.maxDiscount);
  const offerSummary = (o: CardOffer) =>
    [discount(o), o.noCostEmiMonths ? t.emi.noCostUpTo(o.noCostEmiMonths) : null].filter(Boolean).join(" · ");

  return (
    <div className="border-[3px] border-ink bg-paper">
      <section aria-labelledby="offers-title" className="border-b-[3px] border-ink p-5">
        <h2 id="offers-title" className="flex items-center gap-2 font-heading text-2xl font-black uppercase">
          <CreditCard className="size-5 text-pink" aria-hidden /> {t.emi.offersTitle}
        </h2>
        {offers.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.emi.noOffers}</p>
        ) : (
          <ul className="mt-3 flex flex-col">
            {offers.map((o) => (
              <li key={o.id} className="border-t border-ink py-2.5 first:border-t-0 first:pt-0">
                <p className="font-medium">
                  {bankName(o.bank)} {t.emi.cards[o.cardType]}
                </p>
                <p className="text-sm">{offerSummary(o)}</p>
                <p className="mt-0.5 label-mono text-ink-soft">
                  {[t.emi.at(o.store), o.emiOnly ? t.emi.emiOnly : null, o.validUntil ? t.emi.until(date.format(new Date(o.validUntil))) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="emi-title" className="flex flex-col gap-4 p-5">
        <h2 id="emi-title" className="flex items-center gap-2 font-heading text-2xl font-black uppercase">
          <Calculator className="size-5 text-pink" aria-hidden /> {t.emi.calcTitle}
        </h2>

        {offers.length > 0 && (
          <div>
            <label htmlFor="emi-offer" className="label-mono">
              {t.emi.applyOffer}
            </label>
            <select
              id="emi-offer"
              value={offerId}
              onChange={(e) => {
                setOfferId(e.target.value);
                const next = offers.find((o) => o.id === e.target.value);
                if (next?.noCostEmiMonths) setMonths(next.noCostEmiMonths);
              }}
              className="mt-2 w-full border-[3px] border-ink bg-paper px-3 py-2.5 text-sm font-medium outline-none focus:bg-pink-tint"
            >
              <option value="">{t.emi.none}</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {bankName(o.bank)} · {offerSummary(o)}
                </option>
              ))}
            </select>
          </div>
        )}

        <fieldset>
          <legend className="label-mono">{t.emi.tenure}</legend>
          <div className="mt-2 grid grid-cols-6 border-[3px] border-ink">
            {EMI_TENURES.map((m, i) => (
              <button
                key={m}
                type="button"
                aria-pressed={months === m}
                onClick={() => setMonths(m)}
                className={cn(
                  "py-2 font-heading text-lg font-bold tabular transition-colors",
                  i > 0 && "border-l-2 border-ink",
                  months === m ? "bg-ink text-paper" : "bg-paper hover:bg-pink-tint",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="emi-rate" className="label-mono">
            {t.emi.rate}
          </label>
          <input
            id="emi-rate"
            inputMode="decimal"
            value={rateText}
            onChange={(e) => setRateText(e.target.value)}
            disabled={plan.noCost}
            className="mt-2 w-full border-[3px] border-ink bg-paper px-3 py-2 font-heading text-xl font-bold tabular outline-none focus:bg-pink-tint disabled:opacity-60"
          />
        </div>

        <div aria-live="polite" className="border-[3px] border-ink bg-pink-tint p-4 text-ink-deep">
          <p className="label-mono">{plan.noCost ? `${t.pay.noCost} · ${t.emi.monthly}` : t.emi.monthly}</p>
          <p className="mt-1 font-heading text-4xl font-black tabular">{formatPrice(plan.monthly)}</p>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
            {offer && (
              <>
                <dt>{t.emi.priceAfter}</dt>
                <dd className="text-right font-mono tabular">{formatPrice(priceAfter)}</dd>
              </>
            )}
            <dt>{t.emi.interest}</dt>
            <dd className="text-right font-mono tabular">{formatPrice(plan.interest)}</dd>
            <dt>{t.emi.gst}</dt>
            <dd className="text-right font-mono tabular">{formatPrice(plan.gst)}</dd>
            <dt className="font-medium">{t.emi.total}</dt>
            <dd className="text-right font-mono font-medium tabular">{formatPrice(plan.total)}</dd>
          </dl>
        </div>
        <p className="text-xs leading-relaxed text-ink-soft">
          {plan.noCost ? `${t.emi.noCostNote} ` : ""}
          {t.emi.feeNote}
        </p>
      </section>
    </div>
  );
}
