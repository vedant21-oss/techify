import { ArrowLeft, ArrowRight, Swords } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButtons } from "@/components/buy-buttons";
import { DeviceRow } from "@/components/device-row";
import { GlossaryText } from "@/components/glossary-text";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { ReviewsSection } from "@/components/reviews";
import { PriceAlertForm } from "@/components/price-alert-form";
import { RecentTracker, SaveButton } from "@/components/saved-controls";
import { displayName, priceProvenance, specRows } from "@/components/device-meta";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { ScoreBox } from "@/components/score-bar";
import { UseCaseSwitcher } from "@/components/use-case-switcher";
import { formatPrice, PROFILES } from "@/lib/engine";
import { profileText } from "@/lib/i18n/engine-hi";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { contextSchema } from "@/lib/query";
import { getDeviceDetail } from "@/lib/recommendations";
import { finderHref, toSearchParams, versusHref } from "@/lib/url";

async function load(props: PageProps<"/device/[slug]">) {
  const [{ slug }, search] = await Promise.all([props.params, props.searchParams]);
  const context = contextSchema.safeParse(search).data ?? {};
  const lang = await getLang();
  return { detail: await getDeviceDetail(slug, context, lang), lang };
}

export async function generateMetadata(props: PageProps<"/device/[slug]">): Promise<Metadata> {
  const { detail, lang } = await load(props);
  const t = MESSAGES[lang];
  if (!detail) return { title: t.device.notFound };
  const title = t.device.metaTitle(displayName(detail.item.device), detail.query.useCaseLabel);
  const og = `/api/og?${new URLSearchParams({ kind: "device", slug: detail.item.device.slug, useCase: detail.query.useCase })}`;
  return {
    title,
    description: detail.item.explanation.summary,
    openGraph: { title, description: detail.item.explanation.summary, images: [og] },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

export default async function DevicePage(props: PageProps<"/device/[slug]">) {
  const { detail, lang } = await load(props);
  if (!detail) notFound();
  const t = MESSAGES[lang];

  const { item, query, poolSize, alternatives, gap, leader, priceHistory, reviews } = detail;
  const scope = { useCase: query.useCase, budget: query.budget, weights: query.weights, mustHaves: query.mustHaves };
  const scopedHref = (slug: string) => `/device/${slug}?${toSearchParams(scope)}`;
  const altCount = Number(Boolean(alternatives.cheaper)) + Number(Boolean(alternatives.better)) + alternatives.similar.length;
  const { device, explanation } = item;
  const backHref = finderHref({ category: query.category, ...scope });

  return (
    <div className="pb-20">
      <RecentTracker slug={device.slug} />
      <section className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto max-w-6xl px-(--gutter) pt-8 pb-12 sm:pb-14">
          <Link href={backHref} className="inline-flex items-center gap-2 label-mono hover:bg-pink-tint">
            <ArrowLeft className="size-4" aria-hidden /> {t.device.back}
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <p className="label-mono text-ink-soft">
                {device.brand} · {t.device.categoryWord[device.category]} · {device.releaseYear}
              </p>
              <h1 className="mt-3 text-[clamp(3.5rem,11vw,7.5rem)]">{displayName(device)}</h1>
              <p className="mt-4 label-mono">{device.variant}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="font-heading text-5xl font-black tabular">{formatPrice(device.price)}</span>
                {!item.inBudget && (
                  <span className="border-[3px] border-ink bg-pink px-3 py-1 label-mono text-ink-deep">
                    {t.device.overBudget(query.budget)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft">{priceProvenance(device, lang)}{t.device.streetPrices}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <BuyButtons links={device.buyLinks} />
                <SaveButton slug={device.slug} name={displayName(device)} variant="block" />
              </div>
            </div>
            <div className="flex gap-4">
              <ScoreBox score={item.matchScore} label={t.results.match} note={t.device.rankOf(item.matchRank, poolSize)} tone="match" size="lg" />
              <ScoreBox score={item.valueScore} label={t.results.value} note={t.device.rankOf(item.valueRank, poolSize)} tone="value" size="lg" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-(--gutter)">
        <section className="border-b-[3px] border-ink py-10" aria-labelledby="scored-for">
          <h2 id="scored-for" className="label-mono font-normal normal-case">
            {t.device.scoredFor}
          </h2>
          <div className="mt-4">
            <UseCaseSwitcher
              category={query.category}
              active={query.useCase}
              hrefFor={(useCase) => `/device/${device.slug}?${toSearchParams({ useCase, budget: query.budget })}`}
              lang={lang}
            />
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            {t.device.comparedAgainst(poolSize, query.category, Math.max(query.budget, device.price))}
          </p>
        </section>

        <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_22rem]">
          <section aria-labelledby="breakdown-heading" className="min-w-0">
            <h2 id="breakdown-heading" className="text-5xl sm:text-6xl">
              {t.device.whyScores(Math.round(item.matchScore))}
            </h2>
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed">{explanation.summary}</p>

            {(explanation.strengths.length > 0 || explanation.tradeoffs.length > 0) && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-10">
                {explanation.strengths.length > 0 && (
                  <div>
                    <p className="label-mono text-ink-soft">{t.results.strongOn}</p>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {explanation.strengths.map((s) => (
                        <li key={s} className="flex items-start gap-3 leading-snug">
                          <span aria-hidden className="mt-1.5 size-2.5 shrink-0 border-2 border-ink bg-ink" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {explanation.tradeoffs.length > 0 && (
                  <div>
                    <p className="label-mono text-ink-soft">{t.results.heldBackBy}</p>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {explanation.tradeoffs.map((t) => (
                        <li key={t} className="flex items-start gap-3 leading-snug">
                          <span aria-hidden className="mt-1.5 size-2.5 shrink-0 border-2 border-ink bg-pink" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-10">
              <ScoreBreakdown item={item} useCaseLabel={query.useCaseLabel} />
            </div>
            <p className="mt-5 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
              {t.device.method}{" "}
              <Link href="/how-it-works" className="font-medium text-ink underline decoration-pink decoration-2 underline-offset-4">
                {t.device.howScoringWorks}
              </Link>
            </p>
          </section>

          <aside aria-labelledby="specs-heading" className="min-w-0">
            <h2 id="specs-heading" className="text-5xl">
              {t.device.specs}
            </h2>
            <dl className="mt-6 border-[3px] border-ink bg-paper">
              {specRows(device, lang).map((row) => (
                <div key={row.label} className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-ink px-5 py-3.5 last:border-b-0">
                  <dt className="label-mono pt-0.5 text-ink-soft">{row.label}</dt>
                  <dd className="text-sm font-medium">
                    <GlossaryText text={row.value} />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-10">
              <PriceHistoryChart history={priceHistory} asOf={new Date().toISOString()} />
            </div>
            <div className="mt-6">
              <PriceAlertForm slug={device.slug} price={device.price} name={displayName(device)} />
            </div>
          </aside>
        </div>

        {gap && leader && (
          <section aria-labelledby="why-not-heading" className="mt-20">
            <h2 id="why-not-heading" className="border-b-[3px] border-ink pb-5 text-5xl sm:text-6xl">
              {t.device.whyNot}
            </h2>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
              <div className="min-w-0">
                <p className="max-w-[62ch] text-lg leading-relaxed">
                  <strong>{displayName(leader.device)}</strong>
                  {t.device.leaderLine(query.useCaseLabel, gap.pointsBehind)}
                  {gap.summary}
                </p>
                {gap.losses.length > 0 && (
                  <ul className="mt-6 border-[3px] border-ink bg-paper">
                    {gap.losses.slice(0, 5).map((g) => (
                      <li key={g.key} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-ink px-5 py-3 last:border-b-0 sm:grid-cols-[9rem_1fr_auto]">
                        <span className="font-heading text-xl font-black uppercase">{g.label}</span>
                        <span className="order-3 col-span-2 text-sm text-ink-soft sm:order-none sm:col-span-1">
                          {t.device.hereVs(g.deviceValue, g.leaderValue)}
                        </span>
                        <span className="font-mono text-sm tabular">{t.device.pts(g.pointsBehind)}</span>
                      </li>
                    ))}
                    {gap.penaltyPoints > 0 && (
                      <li className="grid grid-cols-[1fr_auto] items-center gap-4 bg-pink-tint px-5 py-3">
                        <span className="font-heading text-xl font-black uppercase">{t.device.baselineMissed}</span>
                        <span className="font-mono text-sm tabular">{t.device.pts(gap.penaltyPoints)}</span>
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="flex flex-col gap-4 self-start">
                <DeviceRow device={leader.device} item={leader} href={scopedHref(leader.device.slug)} eyebrow={t.device.numberOne} />
                <Link
                  href={versusHref(device.slug, leader.device.slug)}
                  className="flex items-center justify-between gap-2 border-[3px] border-ink bg-pink px-5 py-3 label-mono text-ink-deep shadow-hard hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-2">
                    <Swords className="size-4" aria-hidden /> {t.device.headToHead}
                  </span>
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </section>
        )}

        {altCount > 0 && (
          <section aria-labelledby="alternatives-heading" className="mt-20">
            <h2 id="alternatives-heading" className="border-b-[3px] border-ink pb-5 text-5xl sm:text-6xl">
              {t.device.consider}
            </h2>
            <p className="mt-4 max-w-[62ch] text-ink-soft">
              {t.device.scoredSame(query.useCaseLabel, poolSize, query.category)}
            </p>
            {(alternatives.cheaper || alternatives.better) && (
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {alternatives.cheaper && (
                  <DeviceRow
                    device={alternatives.cheaper.device}
                    item={alternatives.cheaper}
                    href={scopedHref(alternatives.cheaper.device.slug)}
                    eyebrow={alternatives.cheaper.matchScore >= item.matchScore ? t.device.cheaperHigher : t.device.cheaperNearly}
                    note={t.device.cheaperNote(
                      device.price - alternatives.cheaper.device.price,
                      Math.round(alternatives.cheaper.matchScore - item.matchScore),
                    )}
                  />
                )}
                {alternatives.better && (
                  <DeviceRow
                    device={alternatives.better.device}
                    item={alternatives.better}
                    href={scopedHref(alternatives.better.device.slug)}
                    eyebrow={t.device.betterSameMoney}
                    note={t.device.betterNote(
                      Math.round(alternatives.better.matchScore - item.matchScore),
                      alternatives.better.device.price - device.price,
                    )}
                  />
                )}
              </div>
            )}
            {alternatives.similar.length > 0 && (
              <>
                <h3 className="mt-12 text-3xl">{t.device.similar}</h3>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {alternatives.similar.map((alt) => (
                    <DeviceRow key={alt.device.slug} device={alt.device} item={alt} href={scopedHref(alt.device.slug)} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        <section aria-labelledby="reviews-heading" className="mt-20">
          <h2 id="reviews-heading" className="border-b-[3px] border-ink pb-5 text-5xl sm:text-6xl">
            {t.device.ownerReviews}
          </h2>
          <div className="mt-8">
            <ReviewsSection
              slug={device.slug}
              name={displayName(device)}
              reviews={reviews}
              useCases={PROFILES[device.category].map((p) => profileText(lang, p).label)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
