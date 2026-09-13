import { ArrowRight, BellRing, Columns3, Heart, Laptop, Search, Smartphone, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QuickSearch } from "@/components/finder/quick-search";
import { CountUp } from "@/components/landing/count-up";
import { IntroCurtain } from "@/components/landing/intro-curtain";
import { RankingDemo } from "@/components/landing/ranking-demo";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { ScoringStory } from "@/components/landing/scoring-story";
import { PickCard } from "@/components/pick-card";
import { PlateHeadline } from "@/components/plate-headline";
import { formatBudgetShort, formatPrice, PROFILES } from "@/lib/engine";
import { FREE_ALERT_LIMIT } from "@/lib/features/alerts";
import { proPriceInr } from "@/lib/features/pro";
import { profileText } from "@/lib/i18n/engine-hi";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { getLandingData, getPicks } from "@/lib/recommendations";
import { finderHref } from "@/lib/url";

/** Icons and destinations for the feature grid, in the same order as the copy in messages. */
const FEATURE_LINKS = [
  { Icon: Sparkles, href: "#search" },
  { Icon: Columns3, href: "/phones" },
  { Icon: BellRing, href: "/pro" },
  { Icon: Trophy, href: "/picks" },
  { Icon: Heart, href: "/saved" },
  { Icon: Search, href: "/search" },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  // Links shared before laptops and phones got their own pages still land in the right place.
  const params = await searchParams;
  const legacyCategory = params.category === "phone" || params.category === "laptop" ? params.category : null;
  if (legacyCategory) {
    const pick = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
    redirect(
      finderHref({
        category: legacyCategory,
        useCase: pick("useCase"),
        budget: pick("budget") ? Number(pick("budget")) : undefined,
        sort: pick("sort"),
      }),
    );
  }

  const lang = await getLang();
  const t = MESSAGES[lang];
  const [landing, picks] = await Promise.all([getLandingData(lang), getPicks(undefined, lang)]);
  const features = FEATURE_LINKS.map((link, i) => ({ ...link, ...t.landing.features[i] }));
  const { stats, demo, story, ticker } = landing;
  const weekly = picks.filter((p) => p.kind === "week");

  return (
    <>
      <IntroCurtain />
      <RevealObserver />

      {/* Hero ------------------------------------------------------------------------ */}
      <section aria-labelledby="hero-title" className="bg-columns relative overflow-hidden border-b-[3px] border-ink">
        <div className="mx-auto max-w-6xl px-(--gutter) pt-8 pb-14 sm:pt-10 sm:pb-20">
          <div className="flex flex-wrap justify-between gap-x-8 gap-y-2 border-b border-ink pb-4 label-mono">
            <span>{t.landing.eyebrow}</span>
            <span>{t.landing.stats(stats.devices, stats.minPrice, stats.maxPrice)}</span>
          </div>

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div className="min-w-0">
              <PlateHeadline id="hero-title" lines={t.landing.hero} className="text-[clamp(4.25rem,17vw,9.5rem)]" />
              <p className="mt-8 max-w-[44ch] text-xl leading-relaxed">
                {t.landing.lede}
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/phones"
                  className="flex items-center gap-3 border-[3px] border-ink bg-ink px-6 py-4 font-heading text-2xl font-black uppercase text-paper shadow-[6px_6px_0_var(--pink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_var(--pink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <Smartphone className="size-6" aria-hidden /> {t.landing.findPhone}
                </Link>
                <Link
                  href="/laptops"
                  className="flex items-center gap-3 border-[3px] border-ink bg-paper px-6 py-4 font-heading text-2xl font-black uppercase shadow-[6px_6px_0_var(--ink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <Laptop className="size-6" aria-hidden /> {t.landing.findLaptop}
                </Link>
              </div>
            </div>
            <div className="min-w-0">
              <RankingDemo demo={demo} />
              <p className="mt-6 text-sm text-ink-soft">
                {t.landing.demoNote}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live ticker of real prices ---------------------------------------------------- */}
      <div className="ticker overflow-hidden border-b-[3px] border-ink bg-ink text-paper" aria-hidden="true">
        <div className="ticker-track">
          {[...ticker, ...ticker].map((item, i) => (
            <span
              key={`${item.name}-${i}`}
              className="flex items-center gap-3 whitespace-nowrap py-2.5 font-heading text-2xl font-bold uppercase after:mx-6 after:size-2.5 after:bg-pink after:content-['']"
            >
              {item.name}
              <span className="font-mono text-sm font-normal text-pink">{formatBudgetShort(item.price)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-(--gutter)">
        {/* Numbers ------------------------------------------------------------------- */}
        <section aria-label={t.landing.glance} data-reveal className="mt-16 grid grid-cols-2 border-[3px] border-ink lg:grid-cols-4">
          {[
            { value: <CountUp value={stats.devices} />, label: t.landing.statLabels[0] },
            { value: <CountUp value={stats.brands} />, label: t.landing.statLabels[1] },
            { value: <CountUp value={stats.useCases} />, label: t.landing.statLabels[2] },
            { value: <CountUp value={0} />, label: t.landing.statLabels[3] },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col gap-2 p-5 sm:p-7 ${i % 2 === 0 ? "border-r-[3px]" : "lg:border-r-[3px]"} ${i < 2 ? "border-b-[3px] lg:border-b-0" : ""} border-ink last:border-r-0`}
            >
              <span className="font-heading text-6xl font-black leading-none sm:text-7xl">{stat.value}</span>
              <span className="label-mono text-ink-soft">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* How it works (scroll story) ---------------------------------------------- */}
        <section aria-labelledby="story-title" className="pt-24">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-5">
            <h2 id="story-title" className="text-6xl sm:text-7xl">
              {t.landing.storyTitle}
            </h2>
            <Link href="/how-it-works" className="flex items-center gap-2 label-mono hover:bg-pink-tint">
              {t.landing.fullMethod} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p data-reveal className="mt-5 max-w-[60ch] text-lg text-ink-soft">
            {t.landing.storyLede(story.budget)}
          </p>
          <div className="mt-6">
            <ScoringStory story={story} />
          </div>
        </section>

        {/* Free-text search --------------------------------------------------------- */}
        <section id="search" aria-labelledby="search-title" className="scroll-mt-28 pt-24">
          <div data-reveal className="grid items-end gap-6 border-b-[3px] border-ink pb-5 lg:grid-cols-[1fr_auto]">
            <h2 id="search-title" className="text-6xl sm:text-7xl">
              {t.landing.sayIt}
            </h2>
            <p className="max-w-[40ch] text-ink-soft">{t.landing.sayItNote}</p>
          </div>
          <div data-reveal className="mt-8">
            <QuickSearch typewriter />
          </div>
        </section>

        {/* Features ------------------------------------------------------------------ */}
        <section aria-labelledby="features-title" className="pt-24">
          <h2 id="features-title" data-reveal className="border-b-[3px] border-ink pb-5 text-6xl sm:text-7xl">
            {t.landing.everything}
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ Icon, title, body, href, cta }, i) => (
              <li key={title} data-reveal style={{ "--reveal-delay": i % 3 } as React.CSSProperties}>
                <Link
                  href={href}
                  className="group flex h-full flex-col border-[3px] border-ink bg-paper transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--pink)]"
                >
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <span className="grid size-12 place-items-center border-[3px] border-ink bg-pink-tint transition-colors group-hover:bg-pink">
                      <Icon className="size-6 transition-transform duration-300 group-hover:-rotate-12" aria-hidden />
                    </span>
                    <h3 className="text-4xl">{title}</h3>
                    <p className="leading-relaxed text-ink-soft">{body}</p>
                  </div>
                  <span className="flex items-center gap-2 border-t-[3px] border-ink px-6 py-3.5 label-mono transition-colors group-hover:bg-ink group-hover:text-paper">
                    {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Picks -------------------------------------------------------------------- */}
        {weekly.length > 0 && (
          <section aria-labelledby="picks-title" className="pt-24">
            <div data-reveal className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-5">
              <h2 id="picks-title" className="text-6xl sm:text-7xl">
                {t.landing.weekPicks}
              </h2>
              <Link href="/picks" className="flex items-center gap-2 label-mono hover:bg-pink-tint">
                {t.landing.plusYear} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {weekly.map((pick, i) => (
                <div key={pick.category} data-reveal style={{ "--reveal-delay": i } as React.CSSProperties}>
                  <PickCard pick={pick} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pro ---------------------------------------------------------------------- */}
        <section aria-labelledby="pro-title" data-reveal className="mt-24 grid border-[3px] border-ink bg-ink text-paper lg:grid-cols-[1.3fr_1fr]">
          <div className="p-7 sm:p-10">
            <p className="label-mono text-pink">Techify Pro</p>
            <h2 id="pro-title" className="mt-4 text-6xl sm:text-7xl">
              {t.landing.proTitle}
            </h2>
            <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-paper/85">
              {t.landing.proBody(FREE_ALERT_LIMIT)}
            </p>
          </div>
          <div className="flex flex-col justify-between border-t-[3px] border-paper lg:border-t-0 lg:border-l-[3px]">
            <div className="p-7 sm:p-10">
              <p className="font-heading text-8xl font-black leading-none tabular">{formatPrice(proPriceInr())}</p>
              <p className="mt-2 label-mono text-paper/70">{t.landing.proPay}</p>
            </div>
            <Link
              href="/pro"
              className="flex items-center justify-between gap-3 border-t-[3px] border-paper bg-pink px-7 py-5 font-heading text-3xl font-black uppercase text-ink-deep transition-colors hover:bg-paper sm:px-10"
            >
              {t.landing.getPro} <ArrowRight className="size-7" aria-hidden />
            </Link>
          </div>
        </section>

        {/* Final call to action ----------------------------------------------------- */}
        <section aria-labelledby="start-title" className="py-24">
          <h2 id="start-title" data-reveal className="text-center text-[clamp(3.5rem,11vw,8rem)]">
            {t.landing.ready}
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {([
              { id: "phone", label: t.nav.phones, Icon: Smartphone },
              { id: "laptop", label: t.nav.laptops, Icon: Laptop },
            ] as const).map(({ id, label, Icon }, i) => (
              <Link
                key={id}
                href={finderHref({ category: id })}
                data-reveal
                style={{ "--reveal-delay": i } as React.CSSProperties}
                className="group flex flex-col border-[3px] border-ink bg-paper transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_var(--pink)]"
              >
                <div className="flex items-start justify-between gap-4 p-7 sm:p-9">
                  <div>
                    <p className="label-mono text-ink-soft">{t.landing.rankedFor(PROFILES[id].map((p) => profileText(lang, p).label))}</p>
                    <p className="mt-4 font-heading text-7xl font-black uppercase leading-none sm:text-8xl">{label}</p>
                  </div>
                  <Icon className="size-12 shrink-0 text-pink transition-transform duration-300 group-hover:scale-110" aria-hidden />
                </div>
                <span className="mt-auto flex items-center gap-2 border-t-[3px] border-ink px-7 py-4 label-mono transition-colors group-hover:bg-ink group-hover:text-paper sm:px-9">
                  {t.landing.startRanking(label)} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
