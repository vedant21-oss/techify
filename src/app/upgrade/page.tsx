import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { displayName, keySpecs } from "@/components/device-meta";
import { PageHero } from "@/components/page-hero";
import { ScoreBox } from "@/components/score-bar";
import { UseCaseSwitcher } from "@/components/use-case-switcher";
import { formatBudgetShort, formatPrice, getFactor, requireProfile, type FactorKey } from "@/lib/engine";
import { UPGRADE_BUDGETS, UPGRADE_STEPS, type FactorChange } from "@/lib/features/upgrade";
import { getMessages } from "@/lib/i18n/server";
import { getUpgrade, getUpgradeStarts } from "@/lib/recommendations";
import type { UpgradeOptionDTO, UpgradeResponse } from "@/lib/types";
import { toSearchParams } from "@/lib/url";
import { cn } from "@/lib/utils";
import { UpgradePicker } from "./upgrade-picker";

const paramsSchema = z.object({
  from: z.string().max(120).optional(),
  useCase: z.string().max(40).optional(),
  budget: z.coerce.number().int().positive().max(1_000_000).optional(),
});

/** How many upgrades the full list shows before it stops being useful. */
const LIST_SIZE = 15;

async function load(searchParams: PageProps<"/upgrade">["searchParams"]) {
  const params = paramsSchema.safeParse(await searchParams).data ?? {};
  return params.from ? getUpgrade(params.from, params) : null;
}

export async function generateMetadata({ searchParams }: PageProps<"/upgrade">): Promise<Metadata> {
  const data = await load(searchParams);
  if (!data) return { title: "Upgrade checker", description: "Pick the phone or laptop you own and see which devices would be a real upgrade, and by how much." };
  return {
    title: `Upgrading from the ${displayName(data.current.device)}`,
    description: `Which ${data.query.category}s up to ${formatBudgetShort(data.query.budget)} are a real upgrade over the ${displayName(data.current.device)} for ${data.query.useCaseLabel.toLowerCase()}.`,
  };
}

export default async function UpgradePage({ searchParams }: PageProps<"/upgrade">) {
  const data = await load(searchParams);
  if (!data) return <UpgradeStartPage />;
  return <UpgradeResults data={data} />;
}

async function UpgradeStartPage() {
  const [t, devices] = await Promise.all([getMessages(), getUpgradeStarts()]);
  return (
    <div className="pb-24">
      <PageHero
        id="upgrade-title"
        lines={["Worth", "upgrading?"]}
        size="sm"
        lede="Pick the phone or laptop you have now. Techify scores it against everything on sale in your budget and shows which would be a real step up, and by how much."
      />
      <div className="mx-auto max-w-3xl px-(--gutter) pt-12">
        <UpgradePicker devices={devices} />
        <p className="mt-8 text-sm leading-relaxed text-ink-soft">
          A clear upgrade is at least {UPGRADE_STEPS.clear} match points better for what you do; a big one is{" "}
          {UPGRADE_STEPS.big} or more. Price doesn&apos;t count towards the score here.{" "}
          <Link href="/how-it-works" className="font-medium text-ink underline decoration-pink decoration-2 underline-offset-4">
            {t.nav.howScoringWorks}
          </Link>
        </p>
      </div>
    </div>
  );
}

function UpgradeResults({ data }: { data: UpgradeResponse }) {
  const { current, query, upgrades, picks, poolSize, smallSteps, sidegrades } = data;
  const essentialKeys = Object.keys(requireProfile(query.category, query.useCase).baselines ?? {}) as FactorKey[];
  const essentials = essentialKeys.map((key) => getFactor(query.category, key).label.toLowerCase());
  // What the use case needs most leads the list, so it's clear why a device qualifies.
  const shown = (o: UpgradeOptionDTO) =>
    [...o.improvements].sort((a, b) => Number(essentialKeys.includes(b.key)) - Number(essentialKeys.includes(a.key))).slice(0, 3);
  const name = displayName(current.device);
  const hrefFor = (next: { useCase?: string; budget?: number }) =>
    `/upgrade?${new URLSearchParams({
      from: current.device.slug,
      useCase: next.useCase ?? query.useCase,
      budget: String(next.budget ?? query.budget),
    })}`;
  const bySlug = new Map(upgrades.map((u) => [u.item.device.slug, u]));
  const cheapest = picks.cheapest ? bySlug.get(picks.cheapest)! : null;

  // One card per device: a phone can be both the cheapest and the biggest upgrade.
  const pickCards = new Map<string, { option: UpgradeOptionDTO; labels: string[] }>();
  for (const [slug, label] of [
    [picks.cheapest, "Cheapest real upgrade"],
    [picks.biggest, "Biggest upgrade"],
    [picks.bestPerRupee, "Most upgrade per rupee"],
  ] as const) {
    if (!slug) continue;
    const entry = pickCards.get(slug) ?? { option: bySlug.get(slug)!, labels: [] };
    entry.labels.push(label);
    pickCards.set(slug, entry);
  }

  return (
    <div className="pb-20">
      <section className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto max-w-6xl px-(--gutter) pt-8 pb-12">
          <Link href="/upgrade" className="inline-flex items-center gap-2 label-mono hover:bg-pink-tint">
            <ArrowLeft className="size-4" aria-hidden /> Pick a different device
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <p className="label-mono text-ink-soft">Upgrade checker</p>
              <h1 className="mt-3 text-[clamp(2.75rem,8vw,5.75rem)] break-words">Upgrading from the {name}</h1>
              <p className="mt-6 max-w-[62ch] text-lg leading-relaxed">
                Scored for {query.useCaseLabel.toLowerCase()} against the {poolSize} {query.category}s up to{" "}
                {formatBudgetShort(query.budget)}.{" "}
                {cheapest ? (
                  <>
                    {upgrades.length} would be a clear upgrade. The cheapest is the{" "}
                    <strong>{displayName(cheapest.item.device)}</strong> at {formatPrice(cheapest.item.device.price)}, {cheapest.gain}{" "}
                    points better.
                  </>
                ) : (
                  <>
                    Nothing here is clearly better: no {query.category} up to {formatBudgetShort(query.budget)} beats it by{" "}
                    {UPGRADE_STEPS.clear} points or more{essentials.length > 0 && ` while also improving its ${essentials.join(" or ")}`}.
                    Keep it for now, or try a bigger budget.
                  </>
                )}
              </p>
            </div>
            <ScoreBox score={current.matchScore} label="Yours today" note={current.device.price === null ? "no longer sold" : "still on sale"} tone="match" size="lg" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-(--gutter)">
        <section aria-label="Change what's being checked" className="flex flex-col gap-5 border-b-[3px] border-ink py-10">
          <div>
            <p className="label-mono text-ink-soft">Mostly for</p>
            <div className="mt-3">
              <UseCaseSwitcher category={query.category} active={query.useCase} hrefFor={(useCase) => hrefFor({ useCase })} />
            </div>
          </div>
          <div>
            <p className="label-mono text-ink-soft">Spending up to</p>
            <nav aria-label="Budget" className="mt-3 flex flex-wrap gap-2">
              {UPGRADE_BUDGETS[query.category].map((b) => (
                <Link
                  key={b}
                  href={hrefFor({ budget: b })}
                  scroll={false}
                  aria-current={b === query.budget ? "true" : undefined}
                  className={cn(
                    "border-[3px] border-ink px-3.5 py-2 font-heading text-lg font-bold tabular transition-colors",
                    b === query.budget ? "bg-ink text-paper" : "bg-paper hover:bg-pink-tint",
                  )}
                >
                  {formatBudgetShort(b)}
                </Link>
              ))}
            </nav>
          </div>
          <p className="label-mono leading-relaxed text-ink-soft">
            Yours: {keySpecs(current.device).join("  /  ")}
          </p>
        </section>

        {pickCards.size > 0 && (
          <section aria-labelledby="picks-heading" className="pt-14">
            <h2 id="picks-heading" className="border-b-[3px] border-ink pb-5 text-5xl">
              The short answer
            </h2>
            <ul className="mt-8 grid gap-6 lg:grid-cols-3">
              {[...pickCards.values()].map(({ option, labels }) => (
                <li key={option.item.device.slug}>
                  <PickCard option={option} labels={labels} changes={shown(option)} scope={{ useCase: query.useCase, budget: query.budget }} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {upgrades.length > 0 && (
          <section aria-labelledby="all-heading" className="pt-16">
            <h2 id="all-heading" className="border-b-[3px] border-ink pb-5 text-5xl">
              Every clear upgrade
            </h2>
            <p className="mt-4 max-w-[62ch] text-ink-soft">
              Biggest gain first. {upgrades.length > LIST_SIZE ? `Showing the top ${LIST_SIZE} of ${upgrades.length}. ` : ""}
              {smallSteps > 0 && `Another ${smallSteps} ${smallSteps === 1 ? "is" : "are"} better by less than ${UPGRADE_STEPS.clear} points, which you'd barely notice. `}
              {sidegrades > 0 &&
                `${sidegrades} more score higher overall but don't improve the ${essentials.join(" or ")}, so they're left out.`}
            </p>
            <ol className="mt-8 border-[3px] border-ink bg-paper">
              {upgrades.slice(0, LIST_SIZE).map((u, i) => (
                <li key={u.item.device.slug} className="grid gap-3 border-b border-ink p-5 last:border-b-0 sm:grid-cols-[2.5rem_1fr_auto] sm:items-start sm:gap-6">
                  <span className="font-heading text-3xl font-black text-ink-soft tabular">{i + 1}</span>
                  <div className="min-w-0">
                    <Link
                      href={`/device/${u.item.device.slug}?${toSearchParams({ useCase: query.useCase, budget: query.budget })}`}
                      className="font-heading text-2xl font-black uppercase hover:bg-pink-tint"
                    >
                      {displayName(u.item.device)}
                    </Link>
                    <p className="mt-1 label-mono text-ink-soft">
                      {u.item.device.variant} · {formatPrice(u.item.device.price)}
                    </p>
                    <ChangeList changes={shown(u)} className="mt-3" />
                    {u.downgrades.length > 0 && (
                      <p className="mt-2 text-sm text-ink-soft">
                        You&apos;d give up: {u.downgrades.slice(0, 2).map(describeChange).join("; ")}.
                      </p>
                    )}
                  </div>
                  <div className="flex items-baseline gap-4 sm:flex-col sm:items-end sm:gap-1">
                    <GainBadge option={u} />
                    <span className="label-mono text-ink-soft">+{u.gainPer10k} per ₹10k</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="method-heading" className="mt-16 border-[3px] border-ink bg-paper p-6">
          <h2 id="method-heading" className="text-3xl">
            How this is decided
          </h2>
          <p className="mt-3 max-w-[70ch] leading-relaxed">
            Your {name} and every {query.category} up to {formatBudgetShort(query.budget)} are scored together for{" "}
            {query.useCaseLabel.toLowerCase()}, with the same weights and baselines as the finder, except that price is left out:
            being cheaper doesn&apos;t make a device better than one you already own. A gain of {UPGRADE_STEPS.clear}+ match points is a
            clear upgrade and {UPGRADE_STEPS.big}+ is a big one.
            {essentials.length > 0 &&
              ` For ${query.useCaseLabel.toLowerCase()}, a device also has to be better on its ${essentials.join(" or ")} and worse on none of them.`} Battery and speed figures for older devices are from their launch
            spec sheets, so a worn battery will make an upgrade feel bigger than this.
          </p>
        </section>
      </div>
    </div>
  );
}

function describeChange(c: FactorChange): string {
  return `${c.label.toLowerCase()} (${c.from} → ${c.to})`;
}

function ChangeList({ changes, className }: { changes: FactorChange[]; className?: string }) {
  if (changes.length === 0) return null;
  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {changes.map((c) => (
        <li key={c.key} className="flex items-start gap-3 text-sm leading-snug">
          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-pink" aria-hidden />
          <span>
            <span className="font-medium">{c.label}</span>: {c.from} → {c.to}{" "}
            <span className="font-mono text-xs text-ink-soft tabular">+{c.points} pts</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function GainBadge({ option }: { option: UpgradeOptionDTO }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 border-[3px] border-ink px-3 py-1",
        option.level === "big" ? "bg-pink text-ink-deep" : "bg-paper",
      )}
    >
      <span className="font-heading text-3xl font-black tabular">+{option.gain}</span>
      <span className="label-mono">{option.level === "big" ? "Big upgrade" : "Clear upgrade"}</span>
    </span>
  );
}

function PickCard({
  option,
  labels,
  changes,
  scope,
}: {
  option: UpgradeOptionDTO;
  labels: string[];
  changes: FactorChange[];
  scope: { useCase: string; budget: number };
}) {
  const { device } = option.item;
  const href = `/device/${device.slug}?${new URLSearchParams({ useCase: scope.useCase, budget: String(scope.budget) })}`;
  return (
    <article className="flex h-full flex-col border-[3px] border-ink bg-paper">
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="self-start bg-ink px-2 py-0.5 label-mono text-paper">{labels.join(" · ")}</p>
        <h3 className="text-3xl">
          <Link href={href} className="hover:bg-pink-tint">
            {displayName(device)}
          </Link>
        </h3>
        <p className="-mt-2 label-mono text-ink-soft">{device.variant}</p>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="font-heading text-2xl font-bold tabular">{formatPrice(device.price)}</span>
          <GainBadge option={option} />
        </div>
        <ChangeList changes={changes} />
      </div>
      <Link href={href} className="flex items-center gap-2 border-t-[3px] border-ink px-5 py-3 label-mono hover:bg-ink hover:text-paper">
        Why it scores higher <ArrowRight className="size-4" aria-hidden />
      </Link>
    </article>
  );
}
