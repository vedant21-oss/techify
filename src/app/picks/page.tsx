import type { Metadata } from "next";
import { PickCard } from "@/components/pick-card";
import { PlateHeadline } from "@/components/plate-headline";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { getPicks } from "@/lib/recommendations";

export const metadata: Metadata = {
  title: "Picks",
  description: "Phone and laptop of the week and of the year, chosen by Techify's scores.",
};

export default async function PicksPage() {
  const lang = await getLang();
  const t = MESSAGES[lang].picks;
  const picks = await getPicks(undefined, lang);
  const weekly = picks.filter((p) => p.kind === "week");
  const yearly = picks.filter((p) => p.kind === "year");

  return (
    <div className="pb-20">
      <section aria-labelledby="picks-title" className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_24rem]">
          <PlateHeadline id="picks-title" lines={t.lines} className="text-[clamp(4rem,17vw,10rem)]" />
          <p className="max-w-[44ch] text-lg leading-relaxed lg:pb-2">
            {t.lede}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-(--gutter)">
        <section aria-labelledby="year-title" className="pt-14">
          <h2 id="year-title" className="border-b-[3px] border-ink pb-5 text-6xl">
            {t.ofYear}
          </h2>
          {yearly.length ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {yearly.map((pick) => (
                <PickCard key={pick.category} pick={pick} size="lg" />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-ink-soft">{t.noYear}</p>
          )}
        </section>

        <section aria-labelledby="week-title" className="pt-20">
          <h2 id="week-title" className="border-b-[3px] border-ink pb-5 text-6xl">
            {t.ofWeek}
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {weekly.map((pick) => (
              <PickCard key={pick.category} pick={pick} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
