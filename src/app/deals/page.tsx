import type { Metadata } from "next";
import Link from "next/link";
import { DeviceRow } from "@/components/device-row";
import { PlateHeadline } from "@/components/plate-headline";
import { LOCALE } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { getDeals } from "@/lib/recommendations";

export const metadata: Metadata = {
  title: "Price drops",
  description: "Laptops and phones whose price just dropped, with how much and whether it's the lowest we've seen.",
};

export default async function DealsPage() {
  const [deals, lang] = await Promise.all([getDeals(), getLang()]);
  const t = MESSAGES[lang].deals;
  const dateFmt = new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <div className="pb-20">
      <section aria-labelledby="deals-title" className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_24rem]">
          <PlateHeadline id="deals-title" lines={t.lines} className="text-[clamp(4rem,17vw,10rem)]" />
          <p className="max-w-[44ch] text-lg leading-relaxed lg:pb-2">
            {t.lede}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-(--gutter) pt-12">
        {deals.length === 0 ? (
          <div className="border-[3px] border-dashed border-ink px-6 py-14 text-center">
            <p className="font-heading text-4xl font-black uppercase">{t.none}</p>
            <p className="mx-auto mt-3 max-w-[52ch] text-ink-soft">
              {t.noneNote}
            </p>
            <Link href="/phones" className="mt-6 inline-block border-[3px] border-ink bg-pink px-5 py-3 label-mono text-ink-deep shadow-hard">
              {t.browse}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {deals.map((deal) => (
              <li key={deal.device.slug}>
                <DeviceRow
                  device={deal.device}
                  eyebrow={t.eyebrow(Math.abs(deal.changePercent), deal.previous)}
                  note={t.note(-deal.change, dateFmt.format(new Date(deal.changedAt)), deal.isLowest)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
