import type { Metadata } from "next";
import Link from "next/link";
import { PlateHeadline } from "@/components/plate-headline";
import { ScoreBar } from "@/components/score-bar";
import { UseCaseIcon } from "@/components/use-case-icon";
import { CATEGORIES } from "@/lib/catalog-config";
import { ABSOLUTE_SHARE, FACTORS, MAX_PENALTY, PENALTY_PER_POINT, PROFILES, type FactorKey } from "@/lib/engine";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Techify turns a budget and a use case into a ranked, explained list of devices.",
};

// These run in order on every query, so the numbering carries real information.
const steps = [
  {
    title: "Build the pool",
    body: "Take every device in the chosen category priced at or under your budget. A ₹40k laptop is judged against other laptops you could actually buy for ₹40k.",
  },
  {
    title: "Put every spec on one scale",
    body: `Processor, graphics, camera and display come as curated 0–100 tiers. RAM, storage, battery, weight and charging are mapped onto fixed market ranges, on a log scale where each doubling matters equally. Each spec is also ranked within the pool, and the sub-score is ${Math.round(ABSOLUTE_SHARE * 100)}% market scale and ${Math.round((1 - ABSOLUTE_SHARE) * 100)}% pool rank.`,
  },
  {
    title: "Weight by use case",
    body: "Every use case is a set of weights that add up to 100%. The weighted sum of sub-scores is the starting match score.",
  },
  {
    title: "Check the baselines",
    body: `A great screen shouldn't carry integrated graphics to the top of a gaming list. Each use case sets minimums for what it can't do without, and every point short costs ${PENALTY_PER_POINT * 100}% of the score, up to ${MAX_PENALTY * 100}% per spec.`,
  },
  {
    title: "Rank, price and explain",
    body: "Devices are ranked by match score. Value score divides match by price and rescales so the best deal in the pool is 100. Explanations come from the same numbers, so the words and the scores always agree.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="pb-20">
      <section className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto max-w-6xl px-(--gutter) pt-10 pb-14">
          <p className="label-mono text-ink-soft">The scoring engine</p>
          <PlateHeadline lines={["Good for", "gaming,", "in numbers."]} className="mt-6 text-[clamp(4rem,17vw,10rem)]" />
          <p className="mt-8 max-w-[58ch] text-lg leading-relaxed">
            Techify turns a fuzzy need into a ranking you can check. Here is exactly what happens between you moving the
            slider and the list updating.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-(--gutter)">
        <ol className="mt-14 grid border-t-[3px] border-l-[3px] border-ink sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="border-r-[3px] border-b-[3px] border-ink bg-paper p-6 sm:p-8">
              <span className="grid size-12 place-items-center bg-ink font-heading text-2xl font-black text-paper">
                {i + 1}
              </span>
              <h2 className="mt-6 text-4xl">{step.title}</h2>
              <p className="mt-4 leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
          <li className="flex flex-col justify-between border-r-[3px] border-b-[3px] border-ink bg-pink p-6 text-ink-deep sm:p-8">
            <h2 className="text-4xl">Or just type it</h2>
            <p className="mt-4 leading-relaxed">
              Write “laptop under 70k for coding” and Claude turns the sentence into the same three inputs. Without an
              API key, keyword rules do the reading instead.
            </p>
          </li>
        </ol>

        {CATEGORIES.map((category) => (
          <section key={category.id} className="mt-20" aria-labelledby={`${category.id}-weights`}>
            <h2 id={`${category.id}-weights`} className="border-b-[3px] border-ink pb-5 text-6xl">
              {category.label} weights
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {PROFILES[category.id].map((profile) => {
                const weights = (Object.entries(profile.weights) as [FactorKey, number][]).sort((a, b) => b[1] - a[1]);
                const baselines = Object.entries(profile.baselines ?? {}) as [FactorKey, number][];
                return (
                  <article key={profile.id} className="flex flex-col border-[3px] border-ink bg-paper">
                    <div className="border-b-[3px] border-ink p-6">
                      <h3 className="flex items-center gap-3 text-3xl">
                        <UseCaseIcon useCase={profile.id} className="size-6 text-pink" />
                        {profile.label}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{profile.description}</p>
                    </div>
                    <ul className="flex flex-1 flex-col gap-3 p-6">
                      {weights.map(([key, weight]) => (
                        <li key={key} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                          <span className="font-medium">{FACTORS[category.id][key]!.label}</span>
                          <ScoreBar score={weight * 200} label={`${FACTORS[category.id][key]!.label} weight`} />
                          <span className="text-right font-mono text-xs tabular">{Math.round(weight * 100)}%</span>
                        </li>
                      ))}
                    </ul>
                    {baselines.length > 0 && (
                      <p className="border-t-[3px] border-ink bg-pink-tint px-6 py-3 label-mono text-ink-deep">
                        Baseline:{" "}
                        {baselines.map(([key, min]) => `${FACTORS[category.id][key]!.label} ≥ ${min}`).join(", ")}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <p className="mt-20 text-lg">
          The engine is a framework-free TypeScript module with unit tests; the web app only feeds it rows from
          Postgres.{" "}
          <Link href="/" className="font-medium underline decoration-pink decoration-[3px] underline-offset-4">
            Try the finder
          </Link>
        </p>
      </div>
    </div>
  );
}
