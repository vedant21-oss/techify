"use client";

import { useMessages } from "@/components/lang-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { BANKS, isBankId, type CardKind, type Payment } from "@/lib/features/offers";
import { cn } from "@/lib/utils";

/** "Paying with": the buyer's bank card, so results rank on the price after its offer. */
export function PaymentPicker({ value, onChange }: { value: Payment | null; onChange: (next: Payment | null) => void }) {
  const t = useMessages().pay;
  const cards: [CardKind, string][] = [
    ["credit", t.credit],
    ["debit", t.debit],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pay-bank" className="text-sm">
          {t.bank}
        </label>
        <select
          id="pay-bank"
          value={value?.bank ?? ""}
          onChange={(e) => {
            const bank = e.target.value;
            onChange(isBankId(bank) ? { bank, card: value?.card ?? "credit", emi: value?.emi ?? false } : null);
          }}
          className="border-[3px] border-ink bg-paper px-3 py-2.5 font-medium outline-none focus:bg-pink-tint"
        >
          <option value="">{t.noCard}</option>
          {BANKS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {value && (
        <>
          <div role="group" aria-label={t.cardType} className="grid grid-cols-2 border-[3px] border-ink">
            {cards.map(([card, label], i) => (
              <button
                key={card}
                type="button"
                aria-pressed={value.card === card}
                onClick={() => onChange({ ...value, card })}
                className={cn(
                  "py-2.5 label-mono transition-colors",
                  i === 0 && "border-r-[3px] border-ink",
                  value.card === card ? "bg-ink text-paper" : "bg-paper hover:bg-pink-tint",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label htmlFor="pay-emi" className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <Checkbox
              id="pay-emi"
              checked={value.emi}
              onCheckedChange={(checked) => onChange({ ...value, emi: checked === true })}
              className="size-5 border-2 border-ink data-checked:border-ink data-checked:bg-ink"
            />
            {t.onEmi}
          </label>
        </>
      )}

      <p className="text-sm leading-relaxed text-ink-soft">{t.note}</p>
    </div>
  );
}
