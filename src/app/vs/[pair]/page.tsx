import { ArrowLeft, Swords } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BuyButtons } from "@/components/buy-buttons";
import { displayName, specRows } from "@/components/device-meta";
import { GlossaryText } from "@/components/glossary-text";
import { ScoreBar } from "@/components/score-bar";
import { UseCaseIcon } from "@/components/use-case-icon";
import { formatBudgetShort, formatPrice } from "@/lib/engine";
import { getVersus } from "@/lib/recommendations";
import { finderHref, parseVersusPair, toSearchParams, versusHref } from "@/lib/url";
import { cn } from "@/lib/utils";

async function load(pair: string) {
  const slugs = parseVersusPair(pair);
  if (!slugs) return null;
  const canonical = versusHref(slugs[0], slugs[1]);
  if (canonical !== `/vs/${pair}`) permanentRedirect(canonical);
  const result = await getVersus(slugs[0], slugs[1]);
  return "error" in result ? null : result;
}

export async function generateMetadata({ params }: PageProps<"/vs/[pair]">): Promise<Metadata> {
  const { pair } = await params;
  const v = await load(pair);
  if (!v) return { title: "Head-to-head not found" };
  const title = `${displayName(v.a)} vs ${displayName(v.b)}`;
  const description = `Which is better for gaming, camera, battery and more? Techify scores ${displayName(v.a)} and ${displayName(v.b)} use case by use case.`;
  const og = `/api/og?${new URLSearchParams({ kind: "vs", a: v.a.slug, b: v.b.slug })}`;
  return { title, description, openGraph: { title, description, images: [og] }, twitter: { card: "summary_large_image", images: [og] } };
}

export default async function VersusPage({ params }: PageProps<"/vs/[pair]">) {
  const { pair } = await params;
  const v = await load(pair);
  if (!v) notFound();
  const { a, b } = v;
  const nameA = displayName(a);
  const nameB = displayName(b);
  const overall = v.wins.a === v.wins.b ? "tie" : v.wins.a > v.wins.b ? "a" : "b";
  const specsA = specRows(a);
  const specsB = new Map(specRows(b).map((r) => [r.label, r.value]));

  return (
    <div className="pb-20">
      <section className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto max-w-6xl px-(--gutter) pt-8 pb-12">
          <Link href={finderHref({ category: v.category })} className="inline-flex items-center gap-2 label-mono hover:bg-pink-tint">
            <ArrowLeft className="size-4" aria-hidden /> Back to {v.category === "phone" ? "phones" : "laptops"}
          </Link>
          <p className="mt-10 flex items-center gap-2 label-mono text-ink-soft">
            <Swords className="size-4" aria-hidden /> Head-to-head
          </p>
          <div className="mt-4 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            {[a, b].map((d, i) => (
              <div key={d.slug} className={cn("min-w-0", i === 1 && "md:order-3 md:text-right")}>
                <h1 className="text-[clamp(2.5rem,6vw,4.75rem)] break-words">
                  <Link href={`/device/${d.slug}`} className="hover:bg-pink-tint">
                    {displayName(d)}
                  </Link>
                </h1>
                <p className="mt-2 label-mono text-ink-soft">{d.variant}</p>
                <p className="mt-2 font-heading text-4xl font-black tabular">{formatPrice(d.price)}</p>
              </div>
            ))}
            <span className="grid size-16 place-items-center justify-self-center border-[3px] border-ink bg-pink font-heading text-3xl font-black text-ink-deep md:order-2">
              VS
            </span>
          </div>
          <p className="mt-8 max-w-[62ch] text-lg leading-relaxed">
            {overall === "tie"
              ? `An even match: each wins ${v.wins.a} of ${v.verdicts.length} use cases.`
              : `${overall === "a" ? nameA : nameB} wins ${Math.max(v.wins.a, v.wins.b)} of ${v.verdicts.length} use cases.`}{" "}
            Both are scored against the {v.poolSize} {v.category}s up to {formatBudgetShort(v.budget)}, so neither gets a
            budget advantage.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-(--gutter)">
        <section aria-labelledby="verdicts" className="pt-14">
          <h2 id="verdicts" className="border-b-[3px] border-ink pb-5 text-5xl">
            Verdict by use case
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {v.verdicts.map((row) => {
              const winnerName = row.verdict.winner === "a" ? nameA : row.verdict.winner === "b" ? nameB : null;
              const edges = row.verdict.edges.filter((e) => e.winner !== "tie").slice(0, 3);
              return (
                <li key={row.useCase} className="flex flex-col border-[3px] border-ink bg-paper">
                  <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-3">
                    <span className="flex items-center gap-2 font-heading text-2xl font-black uppercase">
                      <UseCaseIcon useCase={row.useCase} className="size-5 text-pink" />
                      {row.label}
                    </span>
                    <span className={cn("px-2 py-0.5 label-mono", winnerName ? "bg-ink text-paper" : "bg-paper-deep")}>
                      {winnerName ? `${winnerName} by ${row.verdict.margin}` : "Tie"}
                    </span>
                  </div>
                  <div className="grid gap-3 p-5">
                    {[
                      [nameA, row.aScore, row.verdict.winner === "a"],
                      [nameB, row.bScore, row.verdict.winner === "b"],
                    ].map(([name, score, won]) => (
                      <div key={String(name)}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className={cn("truncate", won && "font-medium")}>{name}</span>
                          <span className="font-heading text-2xl font-black tabular">{score}</span>
                        </div>
                        <ScoreBar score={Number(score)} tone={won ? "pink" : "ink"} className="mt-1" />
                      </div>
                    ))}
                    {edges.length > 0 && (
                      <p className="text-sm text-ink-soft">
                        Deciding specs:{" "}
                        {edges.map((e) => `${e.label.toLowerCase()} (${e.winner === "a" ? nameA : nameB})`).join(", ")}.
                      </p>
                    )}
                    <Link
                      href={`/compare?${toSearchParams({ slugs: [a.slug, b.slug], useCase: row.useCase, budget: v.budget })}`}
                      className="label-mono underline underline-offset-4 hover:bg-pink-tint"
                    >
                      Full score breakdown
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="specs" className="pt-16">
          <h2 id="specs" className="border-b-[3px] border-ink pb-5 text-5xl">
            Specs side by side
          </h2>
          <div className="mt-8 overflow-x-auto border-[3px] border-ink bg-paper">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-ink text-paper">
                <tr>
                  <th className="px-4 py-3 label-mono font-normal">Spec</th>
                  <th className="border-l-[3px] border-paper px-4 py-3 font-heading text-xl font-black uppercase">{nameA}</th>
                  <th className="border-l-[3px] border-paper px-4 py-3 font-heading text-xl font-black uppercase">{nameB}</th>
                </tr>
              </thead>
              <tbody>
                {specsA.map((row) => (
                  <tr key={row.label} className="border-t border-ink">
                    <th scope="row" className="px-4 py-3 label-mono font-normal text-ink-soft">
                      {row.label}
                    </th>
                    <td className="border-l-[3px] border-ink px-4 py-3">
                      <GlossaryText text={row.value} />
                    </td>
                    <td className="border-l-[3px] border-ink px-4 py-3">
                      <GlossaryText text={specsB.get(row.label) ?? "n/a"} />
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-ink">
                  <th scope="row" className="px-4 py-3 label-mono font-normal text-ink-soft">
                    Buy
                  </th>
                  <td className="border-l-[3px] border-ink px-4 py-3">
                    <BuyButtons links={a.buyLinks} variant="quiet" />
                  </td>
                  <td className="border-l-[3px] border-ink px-4 py-3">
                    <BuyButtons links={b.buyLinks} variant="quiet" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
