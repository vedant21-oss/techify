import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/engine";
import { bankName, describeDiscount, isOfferActive } from "@/lib/features/offers";
import { deleteOfferAction } from "../../actions";
import { OfferForm } from "../../forms";

export const dynamic = "force-dynamic";

const CARD_LABEL = { ANY: "credit and debit cards", CREDIT: "credit cards", DEBIT: "debit cards" } as const;
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function AdminOffersPage() {
  const [devices, offers] = await Promise.all([
    prisma.device.findMany({ orderBy: [{ brand: "asc" }, { name: "asc" }], select: { slug: true, brand: true, name: true, variant: true, category: true } }),
    prisma.bankOffer.findMany({ orderBy: { createdAt: "desc" }, include: { device: { select: { brand: true, name: true, price: true } } } }),
  ]);
  const now = new Date();

  return (
    <>
      <h1 className="text-6xl">Card offers</h1>
      <p className="mt-3 max-w-[62ch] text-sm text-ink-soft">
        Instant bank discounts and no-cost EMI, as listed on store pages. Buyers who pick their card in the finder see prices after
        the best offer they qualify for; offers never stack. Expired offers stop applying on their end date.
      </p>
      <section className="mt-8 border-[3px] border-ink bg-paper p-5">
        <h2 className="text-3xl">Add an offer</h2>
        <div className="mt-4">
          <OfferForm
            devices={devices.map((d) => ({
              slug: d.slug,
              label: `${d.brand} ${d.name} · ${d.variant}`,
              category: d.category === "LAPTOP" ? "laptop" : "phone",
            }))}
          />
        </div>
      </section>
      {offers.length === 0 ? (
        <p className="mt-8 text-ink-soft">No offers yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {offers.map((o) => {
            const active = isOfferActive({ validUntil: o.validUntil?.toISOString() ?? null }, now);
            const discount = describeDiscount({ kind: o.kind === "FLAT" ? "flat" : "percent", amount: o.amount, maxDiscount: o.maxDiscount }, formatPrice);
            return (
              <li key={o.id} className={`flex flex-wrap items-center justify-between gap-4 border-[3px] border-ink bg-paper p-4 ${active ? "" : "opacity-60"}`}>
                <div>
                  <p className="font-medium">
                    {o.device.brand} {o.device.name} <span className="font-mono text-sm text-ink-soft">{formatPrice(o.device.price)}</span>
                  </p>
                  <p className="text-sm">
                    {bankName(o.bank)} {CARD_LABEL[o.cardType]} at {o.store}:{" "}
                    {[discount, o.noCostEmiMonths ? `no-cost EMI up to ${o.noCostEmiMonths} months` : null, o.emiOnly ? "EMI only" : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="label-mono text-ink-soft">
                    {o.validUntil ? `${active ? "Until" : "Ended"} ${dateFormat.format(o.validUntil)}` : "No end date"}
                  </p>
                </div>
                <form action={deleteOfferAction}>
                  <input type="hidden" name="id" value={o.id} />
                  <button type="submit" className="border-[3px] border-ink px-3 py-1.5 label-mono hover:bg-ink hover:text-paper">
                    Delete
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
