import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/engine";
import { isAdLive } from "@/lib/features/ads";
import { deleteAdAction, toggleAdAction } from "../../actions";
import { AdForm } from "../../forms";

export const dynamic = "force-dynamic";

const PLACE_LABEL = { HOME: "home", RESULTS: "finder results", DEVICE: "device pages" } as const;
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const pct = (clicks: number, views: number) => (views ? `${((clicks / views) * 100).toFixed(1)}%` : "–");

export default async function AdminAdsPage() {
  const [devices, ads] = await Promise.all([
    prisma.device.findMany({ orderBy: [{ brand: "asc" }, { name: "asc" }], select: { slug: true, brand: true, name: true, variant: true, category: true } }),
    prisma.ad.findMany({ orderBy: { createdAt: "desc" }, include: { device: { select: { brand: true, name: true, price: true } } } }),
  ]);
  const now = new Date();

  return (
    <>
      <h1 className="text-6xl">Ads</h1>
      <p className="mt-3 max-w-[62ch] text-sm text-ink-soft">
        Sponsored slots on the home page, among finder results (after the top three) and beside device details. Every ad is
        labelled “Ad” with the advertiser’s name, and none of it is read by the scoring engine, so ads can’t change a ranking.
        Views count once the ad is half on screen; clicks count through Techify’s redirect.
      </p>
      <section className="mt-8 border-[3px] border-ink bg-paper p-5">
        <h2 className="text-3xl">Add an ad</h2>
        <div className="mt-4">
          <AdForm
            devices={devices.map((d) => ({
              slug: d.slug,
              label: `${d.brand} ${d.name} · ${d.variant}`,
              category: d.category === "LAPTOP" ? "laptop" : "phone",
            }))}
          />
        </div>
      </section>
      {ads.length === 0 ? (
        <p className="mt-8 text-ink-soft">No ads yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {ads.map((ad) => {
            const live = isAdLive(ad, now);
            const status = !ad.active ? "Paused" : live ? "Live" : ad.startsAt && ad.startsAt > now ? "Scheduled" : "Ended";
            return (
              <li key={ad.id} className={`border-[3px] border-ink bg-paper p-4 ${live ? "" : "opacity-70"}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="label-mono text-ink-soft">
                      <span className={live ? "bg-pink px-1 text-ink-deep" : ""}>{status}</span> · {ad.advertiser} ·{" "}
                      {ad.placements.map((p) => PLACE_LABEL[p]).join(", ")} · {ad.category ? `${ad.category.toLowerCase()}s` : "phones and laptops"}
                    </p>
                    <p className="mt-1 font-heading text-2xl font-black uppercase">{ad.headline}</p>
                    <p className="text-sm">{ad.body}</p>
                    <p className="mt-1 break-all font-mono text-xs text-ink-soft">
                      {ad.url}
                      {ad.device && ` · promotes ${ad.device.brand} ${ad.device.name} (${formatPrice(ad.device.price)})`}
                    </p>
                    <p className="mt-1 label-mono text-ink-soft">
                      {ad.startsAt ? `From ${dateFormat.format(ad.startsAt)}` : "From now"} ·{" "}
                      {ad.endsAt ? `until ${dateFormat.format(ad.endsAt)}` : "no end date"} · share {ad.weight}
                    </p>
                  </div>
                  <dl className="grid grid-cols-3 gap-4 text-right">
                    {[
                      ["Views", ad.views.toLocaleString("en-IN")],
                      ["Clicks", ad.clicks.toLocaleString("en-IN")],
                      ["CTR", pct(ad.clicks, ad.views)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="label-mono text-ink-soft">{label}</dt>
                        <dd className="font-heading text-3xl font-black tabular">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="mt-3 flex gap-2">
                  <form action={toggleAdAction}>
                    <input type="hidden" name="id" value={ad.id} />
                    <button type="submit" className="border-[3px] border-ink px-3 py-1.5 label-mono hover:bg-ink hover:text-paper">
                      {ad.active ? "Pause" : "Resume"}
                    </button>
                  </form>
                  <form action={deleteAdAction}>
                    <input type="hidden" name="id" value={ad.id} />
                    <button type="submit" className="border-[3px] border-ink px-3 py-1.5 label-mono hover:bg-ink hover:text-paper">
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
