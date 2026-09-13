import { ArrowLeft, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BuyButtons } from "@/components/buy-buttons";
import { displayName, specRows } from "@/components/device-meta";
import { ScoreBar } from "@/components/score-bar";
import { UseCaseSwitcher } from "@/components/use-case-switcher";
import { formatBudgetShort, formatPrice } from "@/lib/engine";
import { compareSchema } from "@/lib/query";
import { getComparison } from "@/lib/recommendations";
import type { RecommendationItem } from "@/lib/types";
import { finderHref, toSearchParams, versusHref } from "@/lib/url";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Compare" };

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const parsed = compareSchema.safeParse(await searchParams);
  if (!parsed.success) {
    return <Message title="Pick devices to compare">Tick “Compare” on two or three devices in your results.</Message>;
  }

  const { slugs, ...context } = parsed.data;
  const result = await getComparison(slugs, context);
  if ("error" in result) return <Message title="Can’t compare these">{result.error}.</Message>;

  const { items, query, poolSize } = result;
  const backHref = finderHref({ category: query.category, useCase: query.useCase, budget: query.budget });
  const hrefWith = (next: string[], useCase = query.useCase) =>
    `/compare?${toSearchParams({ slugs: next, useCase, budget: query.budget })}`;

  const factors = [...items[0].breakdown].sort((a, b) => b.weight - a.weight);
  const specLabels = specRows(items[0].device).map((r) => r.label);
  const best = (pick: (i: RecommendationItem) => number, lowerIsBetter = false) => {
    const values = items.map(pick);
    const target = lowerIsBetter ? Math.min(...values) : Math.max(...values);
    const allEqual = values.every((v) => v === values[0]);
    return (i: RecommendationItem) => !allEqual && pick(i) === target;
  };
  const cols = { gridTemplateColumns: `minmax(9rem, 12rem) repeat(${items.length}, minmax(14rem, 1fr))` };

  return (
    <div className="pb-20">
      <section className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto max-w-6xl px-(--gutter) pt-8 pb-12">
          <Link href={backHref} className="inline-flex items-center gap-2 label-mono hover:bg-pink-tint">
            <ArrowLeft className="size-4" aria-hidden /> Back to results
          </Link>
          <h1 className="mt-10 text-[clamp(3.5rem,11vw,7.5rem)]">Side by side</h1>
          <p className="mt-5 max-w-[60ch] text-lg">
            Scored for {query.useCaseLabel.toLowerCase()} against {poolSize} {query.category}s up to{" "}
            {formatBudgetShort(query.budget)}. The best value in each row is highlighted in pink.
          </p>
          <div className="mt-6">
            <UseCaseSwitcher category={query.category} active={query.useCase} hrefFor={(u) => hrefWith(slugs, u)} />
          </div>
          {items.length === 2 && (
            <Link
              href={versusHref(items[0].device.slug, items[1].device.slug)}
              className="mt-6 inline-flex border-[3px] border-ink bg-pink px-4 py-2.5 label-mono text-ink-deep shadow-hard hover:-translate-y-0.5"
            >
              See the verdict for every use case
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-(--gutter) pt-12">
        <div className="overflow-x-auto border-[3px] border-ink bg-paper">
          <div role="table" aria-label="Device comparison" className="min-w-fit">
            <div role="row" className="grid border-b-[3px] border-ink bg-ink text-paper" style={cols}>
              <div role="columnheader" className="p-5 label-mono">
                {items.length} devices
              </div>
              {items.map((item) => (
                <div role="columnheader" key={item.device.slug} className="border-l-[3px] border-paper p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/device/${item.device.slug}?${toSearchParams({ useCase: query.useCase, budget: query.budget })}`}
                      className="font-heading text-3xl font-black uppercase leading-[0.9] hover:text-pink"
                    >
                      {displayName(item.device)}
                    </Link>
                    {items.length > 1 && (
                      <Link
                        href={hrefWith(slugs.filter((s) => s !== item.device.slug))}
                        aria-label={`Remove ${displayName(item.device)}`}
                        className="border-2 border-paper p-1 hover:bg-pink hover:text-ink-deep"
                      >
                        <X className="size-4" />
                      </Link>
                    )}
                  </div>
                  <p className="mt-2 label-mono opacity-80">{item.device.variant}</p>
                </div>
              ))}
            </div>

            <Row label="Price" cols={cols}>
              {items.map((i) => (
                <Cell key={i.device.slug} highlight={best((x) => x.device.price, true)(i)}>
                  <span className="font-heading text-3xl font-black tabular">{formatPrice(i.device.price)}</span>
                  {!i.inBudget && <span className="mt-1 block label-mono">over budget</span>}
                </Cell>
              ))}
            </Row>
            <Row label="Match score" cols={cols}>
              {items.map((i) => (
                <Cell key={i.device.slug} highlight={best((x) => x.matchScore)(i)}>
                  <ScoreCell score={i.matchScore} note={`#${i.matchRank} of ${poolSize}`} big />
                </Cell>
              ))}
            </Row>
            <Row label="Value score" cols={cols}>
              {items.map((i) => (
                <Cell key={i.device.slug} highlight={best((x) => x.valueScore)(i)}>
                  <ScoreCell score={i.valueScore} note={`#${i.valueRank} of ${poolSize}`} big tone="pink" />
                </Cell>
              ))}
            </Row>

            <SectionLabel cols={cols}>Score by factor</SectionLabel>
            {factors.map((f) => {
              const pick = (i: RecommendationItem) => i.breakdown.find((b) => b.key === f.key)!.score;
              const isBest = best(pick);
              return (
                <Row key={f.key} label={f.label} sublabel={`weight ${Math.round(f.weight * 100)}%`} cols={cols}>
                  {items.map((i) => {
                    const score = i.breakdown.find((b) => b.key === f.key)!;
                    return (
                      <Cell key={i.device.slug} highlight={isBest(i)}>
                        <ScoreCell score={score.score} note={score.displayValue} />
                      </Cell>
                    );
                  })}
                </Row>
              );
            })}

            <SectionLabel cols={cols}>Specifications</SectionLabel>
            {specLabels.map((label) => (
              <Row key={label} label={label} cols={cols}>
                {items.map((i) => (
                  <Cell key={i.device.slug}>
                    <span className="text-sm font-medium">
                      {specRows(i.device).find((r) => r.label === label)?.value ?? "n/a"}
                    </span>
                  </Cell>
                ))}
              </Row>
            ))}

            <Row label="Buy" cols={cols}>
              {items.map((i) => (
                <Cell key={i.device.slug}>
                  <BuyButtons links={i.device.buyLinks} />
                </Cell>
              ))}
            </Row>
          </div>
        </div>

        {items.length < 3 && (
          <p className="mt-6 text-ink-soft">
            <Link href={backHref} className="font-medium text-ink underline decoration-pink decoration-2 underline-offset-4">
              Add another device
            </Link>{" "}
            from your results to compare up to three.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  sublabel,
  cols,
  children,
}: {
  label: string;
  sublabel?: string;
  cols: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div role="row" className="grid border-b border-ink last:border-b-0" style={cols}>
      <div role="rowheader" className="px-5 py-5">
        <span className="font-heading text-xl font-black uppercase leading-none">{label}</span>
        {sublabel && <span className="mt-1.5 block label-mono text-ink-soft">{sublabel}</span>}
      </div>
      {children}
    </div>
  );
}

function Cell({ highlight, children }: { highlight?: boolean; children: React.ReactNode }) {
  return (
    <div role="cell" className={cn("border-l-[3px] border-ink px-5 py-5", highlight && "bg-pink-tint")}>
      {children}
    </div>
  );
}

function SectionLabel({ cols, children }: { cols: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div role="row" className="grid border-y-[3px] border-ink bg-paper-deep" style={cols}>
      <div role="rowheader" className="col-span-full px-5 py-3 label-mono">
        {children}
      </div>
    </div>
  );
}

function ScoreCell({
  score,
  note,
  big,
  tone = "ink",
}: {
  score: number;
  note: string;
  big?: boolean;
  tone?: "ink" | "pink";
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("font-heading font-black leading-none tabular", big ? "text-5xl" : "text-3xl")}>
          {Math.round(score)}
        </span>
        <span className="truncate text-sm text-ink-soft">{note}</span>
      </div>
      <ScoreBar score={score} tone={tone} className="mt-3" />
    </div>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-(--gutter) py-28 text-center">
      <h1 className="text-6xl">{title}</h1>
      <p className="mt-5 text-lg text-ink-soft">{children}</p>
      <Link
        href="/"
        className="mt-8 inline-block border-[3px] border-ink bg-pink px-5 py-3 label-mono text-ink-deep shadow-hard"
      >
        Go to the finder
      </Link>
    </div>
  );
}
