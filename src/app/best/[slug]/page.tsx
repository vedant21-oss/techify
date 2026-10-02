import { ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeviceRow } from "@/components/device-row";
import { PageHero } from "@/components/page-hero";
import { BUDGET_RANGES } from "@/lib/catalog-config";
import { requireProfile } from "@/lib/engine";
import { COLLECTIONS, findCollection, relatedCollections, type Collection } from "@/lib/features/collections";
import { mustHavesFor } from "@/lib/features/must-haves";
import { mustHaveLabel, profileText } from "@/lib/i18n/engine-hi";
import type { Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { getCollection } from "@/lib/recommendations";
import { finderHref, toSearchParams } from "@/lib/url";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

/** Lists that cover the whole category read as "flagships", not "under ₹1.8L". */
function cappedBudget(c: Collection): number | null {
  return c.budget < BUDGET_RANGES[c.category].max ? c.budget : null;
}

function listTitle(c: Collection, lang: Lang): string {
  const t = MESSAGES[lang];
  const kind = c.useCase === "all-rounder" && cappedBudget(c) === null ? t.best.flagship : t.best.kinds[`${c.category}:${c.useCase}`];
  return t.best.title(kind, cappedBudget(c));
}

export async function generateMetadata(props: PageProps<"/best/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const collection = findCollection(slug);
  if (!collection) return { title: "List not found" };
  const lang = await getLang();
  const title = listTitle(collection, lang);
  const og = `/api/og?${new URLSearchParams({
    kind: "finder",
    category: collection.category,
    useCase: collection.useCase,
    budget: String(collection.budget),
  })}`;
  return {
    title,
    description: MESSAGES[lang].best.howPickedBody(profileText(lang, requireProfile(collection.category, collection.useCase)).label),
    openGraph: { title, images: [og] },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

export default async function BestListPage(props: PageProps<"/best/[slug]">) {
  const { slug } = await props.params;
  const collection = findCollection(slug);
  if (!collection) notFound();

  const lang = await getLang();
  const t = MESSAGES[lang];
  const data = await getCollection(collection, lang);
  const profile = profileText(lang, requireProfile(collection.category, collection.useCase));
  const kind = collection.useCase === "all-rounder" && cappedBudget(collection) === null
    ? t.best.flagship
    : t.best.kinds[`${collection.category}:${collection.useCase}`];
  const scope = { useCase: collection.useCase, budget: collection.budget, mustHaves: collection.mustHaves ?? [] };
  const mustHaveLabels = (collection.mustHaves ?? [])
    .map((id) => mustHavesFor(collection.category).find((m) => m.id === id))
    .filter((m) => m !== undefined)
    .map((m) => mustHaveLabel(lang, m.id, m.label).toLowerCase());

  return (
    <div className="pb-20">
      <PageHero
        id="best-list-title"
        lines={[listTitle(collection, lang)]}
        lede={
          <>
            {t.best.lede(data.items.length, kind, data.poolSize)}
            {mustHaveLabels.length > 0 && (
              <span className="mt-3 block text-base text-ink-soft">{t.best.mustHaveNote(mustHaveLabels.join(", "))}</span>
            )}
          </>
        }
        size="sm"
        wrap
      />

      <div className="mx-auto max-w-6xl px-(--gutter) pt-12">
        {data.items.length === 0 ? (
          <p className="border-[3px] border-dashed border-ink px-6 py-12 text-center text-ink-soft">{t.best.empty}</p>
        ) : (
          <ol className="grid gap-6 md:grid-cols-2">
            {data.items.map((item, i) => (
              <li key={item.device.slug}>
                <DeviceRow
                  device={item.device}
                  item={item}
                  href={`/device/${item.device.slug}?${toSearchParams(scope)}`}
                  eyebrow={`#${i + 1}`}
                  note={item.explanation.summary}
                  className="h-full"
                />
              </li>
            ))}
          </ol>
        )}

        <section aria-labelledby="how-picked" className="mt-14 border-[3px] border-ink bg-paper p-6 sm:p-8">
          <h2 id="how-picked" className="flex items-center gap-3 text-4xl">
            <Sparkles className="size-6 text-pink" aria-hidden />
            {t.best.howPicked}
          </h2>
          <p className="mt-4 max-w-[62ch] leading-relaxed">{t.best.howPickedBody(profile.label)}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href={`${finderHref({ category: collection.category, ...scope })}#results`}
              className="flex items-center gap-2 border-[3px] border-ink bg-pink px-5 py-2.5 label-mono text-ink-deep shadow-hard hover:-translate-y-0.5"
            >
              {t.best.openFinder} <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/how-it-works" className="flex items-center gap-2 label-mono underline underline-offset-4 hover:bg-pink-tint">
              {t.device.howScoringWorks}
            </Link>
          </div>
        </section>

        <section aria-labelledby="other-lists" className="mt-14">
          <h2 id="other-lists" className="border-b-[3px] border-ink pb-4 text-3xl">
            {t.best.otherLists}
          </h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {relatedCollections(collection).map((c) => (
              <li key={c.slug}>
                <Link href={`/best/${c.slug}`} className="inline-block border-2 border-ink px-3 py-1.5 text-sm hover:bg-pink-tint">
                  {listTitle(c, lang)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/best" className="inline-block border-2 border-ink bg-ink px-3 py-1.5 text-sm text-paper hover:bg-pink hover:text-ink-deep">
                {t.best.hubLines.join(" ")}
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
