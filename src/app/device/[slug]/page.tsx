import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButtons } from "@/components/buy-buttons";
import { DeviceRow } from "@/components/device-row";
import { PriceAlertForm } from "@/components/price-alert-form";
import { RecentTracker, SaveButton } from "@/components/saved-controls";
import { displayName, priceProvenance, specRows } from "@/components/device-meta";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { ScoreBox } from "@/components/score-bar";
import { UseCaseSwitcher } from "@/components/use-case-switcher";
import { formatBudgetShort, formatPrice } from "@/lib/engine";
import { contextSchema } from "@/lib/query";
import { getDeviceDetail } from "@/lib/recommendations";
import { finderHref, toSearchParams } from "@/lib/url";

async function load(props: PageProps<"/device/[slug]">) {
  const [{ slug }, search] = await Promise.all([props.params, props.searchParams]);
  const context = contextSchema.safeParse(search).data ?? {};
  return getDeviceDetail(slug, context);
}

export async function generateMetadata(props: PageProps<"/device/[slug]">): Promise<Metadata> {
  const detail = await load(props);
  if (!detail) return { title: "Device not found" };
  return {
    title: `${displayName(detail.item.device)} for ${detail.query.useCaseLabel.toLowerCase()}`,
    description: detail.item.explanation.summary,
  };
}

const points = (n: number) => `${n} match ${n === 1 ? "point" : "points"}`;

function cheaperNote(saving: number, scoreDelta: number): string {
  const delta = Math.round(scoreDelta);
  if (delta > 0) return `Saves ${formatPrice(saving)} and scores ${points(delta)} higher.`;
  if (delta === 0) return `Saves ${formatPrice(saving)} for the same match score.`;
  return `Saves ${formatPrice(saving)} for ${points(-delta)} less.`;
}

function betterNote(scoreGain: number, priceDelta: number): string {
  const gain = points(Math.round(scoreGain));
  if (priceDelta === 0) return `${gain} more for the same price.`;
  return priceDelta > 0 ? `${gain} more for ${formatPrice(priceDelta)} extra.` : `${gain} more and ${formatPrice(-priceDelta)} cheaper.`;
}

export default async function DevicePage(props: PageProps<"/device/[slug]">) {
  const detail = await load(props);
  if (!detail) notFound();

  const { item, query, poolSize, alternatives } = detail;
  const scopedHref = (slug: string) => `/device/${slug}?${toSearchParams({ useCase: query.useCase, budget: query.budget })}`;
  const altCount = Number(Boolean(alternatives.cheaper)) + Number(Boolean(alternatives.better)) + alternatives.similar.length;
  const { device, explanation } = item;
  const backHref = finderHref({ category: query.category, useCase: query.useCase, budget: query.budget });

  return (
    <div className="pb-20">
      <RecentTracker slug={device.slug} />
      <section className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto max-w-6xl px-(--gutter) pt-8 pb-12 sm:pb-14">
          <Link href={backHref} className="inline-flex items-center gap-2 label-mono hover:bg-pink-tint">
            <ArrowLeft className="size-4" aria-hidden /> Back to results
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <p className="label-mono text-ink-soft">
                {device.brand} · {device.category} · {device.releaseYear}
              </p>
              <h1 className="mt-3 text-[clamp(3.5rem,11vw,7.5rem)]">{displayName(device)}</h1>
              <p className="mt-4 label-mono">{device.variant}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="font-heading text-5xl font-black tabular">{formatPrice(device.price)}</span>
                {!item.inBudget && (
                  <span className="border-[3px] border-ink bg-pink px-3 py-1 label-mono text-ink-deep">
                    Over your {formatBudgetShort(query.budget)} budget
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft">{priceProvenance(device)}. Street prices change often.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <BuyButtons links={device.buyLinks} />
                <SaveButton slug={device.slug} name={displayName(device)} variant="block" />
              </div>
            </div>
            <div className="flex gap-4">
              <ScoreBox score={item.matchScore} label="Match" note={`#${item.matchRank} of ${poolSize}`} tone="match" size="lg" />
              <ScoreBox score={item.valueScore} label="Value" note={`#${item.valueRank} of ${poolSize}`} tone="value" size="lg" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-(--gutter)">
        <section className="border-b-[3px] border-ink py-10" aria-labelledby="scored-for">
          <h2 id="scored-for" className="label-mono font-normal normal-case">
            Scored for
          </h2>
          <div className="mt-4">
            <UseCaseSwitcher
              category={query.category}
              active={query.useCase}
              hrefFor={(useCase) => `/device/${device.slug}?${toSearchParams({ useCase, budget: query.budget })}`}
            />
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Compared against {poolSize} {query.category === "laptop" ? "laptops" : "phones"} up to{" "}
            {formatPrice(Math.max(query.budget, device.price))}.
          </p>
        </section>

        <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_22rem]">
          <section aria-labelledby="breakdown-heading" className="min-w-0">
            <h2 id="breakdown-heading" className="text-5xl sm:text-6xl">
              Why it scores {Math.round(item.matchScore)}
            </h2>
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed">{explanation.summary}</p>

            {(explanation.strengths.length > 0 || explanation.tradeoffs.length > 0) && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-10">
                {explanation.strengths.length > 0 && (
                  <div>
                    <p className="label-mono text-ink-soft">Strong on</p>
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
                    <p className="label-mono text-ink-soft">Held back by</p>
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
              Each sub-score blends where the spec sits on a fixed market-wide scale with how it ranks among devices in
              this budget.{" "}
              <Link href="/how-it-works" className="font-medium text-ink underline decoration-pink decoration-2 underline-offset-4">
                How scoring works
              </Link>
            </p>
          </section>

          <aside aria-labelledby="specs-heading" className="min-w-0">
            <h2 id="specs-heading" className="text-5xl">
              Specs
            </h2>
            <dl className="mt-6 border-[3px] border-ink bg-paper">
              {specRows(device).map((row) => (
                <div key={row.label} className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-ink px-5 py-3.5 last:border-b-0">
                  <dt className="label-mono pt-0.5 text-ink-soft">{row.label}</dt>
                  <dd className="text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-10">
              <PriceAlertForm slug={device.slug} price={device.price} name={displayName(device)} />
            </div>
          </aside>
        </div>

        {altCount > 0 && (
          <section aria-labelledby="alternatives-heading" className="mt-20">
            <h2 id="alternatives-heading" className="border-b-[3px] border-ink pb-5 text-5xl sm:text-6xl">
              Before you buy, consider
            </h2>
            <p className="mt-4 max-w-[62ch] text-ink-soft">
              Scored the same way as above: for {query.useCaseLabel.toLowerCase()}, against {poolSize}{" "}
              {query.category === "laptop" ? "laptops" : "phones"}.
            </p>
            {(alternatives.cheaper || alternatives.better) && (
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {alternatives.cheaper && (
                  <DeviceRow
                    device={alternatives.cheaper.device}
                    item={alternatives.cheaper}
                    href={scopedHref(alternatives.cheaper.device.slug)}
                    eyebrow={alternatives.cheaper.matchScore >= item.matchScore ? "Cheaper and scores higher" : "Cheaper, nearly as good"}
                    note={cheaperNote(device.price - alternatives.cheaper.device.price, alternatives.cheaper.matchScore - item.matchScore)}
                  />
                )}
                {alternatives.better && (
                  <DeviceRow
                    device={alternatives.better.device}
                    item={alternatives.better}
                    href={scopedHref(alternatives.better.device.slug)}
                    eyebrow="Better for about the same money"
                    note={betterNote(alternatives.better.matchScore - item.matchScore, alternatives.better.device.price - device.price)}
                  />
                )}
              </div>
            )}
            {alternatives.similar.length > 0 && (
              <>
                <h3 className="mt-12 text-3xl">Similar devices</h3>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {alternatives.similar.map((alt) => (
                    <DeviceRow key={alt.device.slug} device={alt.device} item={alt} href={scopedHref(alt.device.slug)} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
