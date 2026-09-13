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
import { getLandingData, getPicks } from "@/lib/recommendations";
import { finderHref } from "@/lib/url";

const FEATURES = [
  {
    Icon: Sparkles,
    title: "Just type it",
    body: "“Laptop under 70k for coding” becomes a budget, a use case and a ranked list.",
    href: "#search",
    cta: "Try a sentence",
  },
  {
    Icon: Columns3,
    title: "Compare three",
    body: "Tick any three results and see every score and spec side by side, best in each row highlighted.",
    href: "/phones",
    cta: "Open the finder",
  },
  {
    Icon: BellRing,
    title: "Price-drop alerts",
    body: "Name your price on any device. We email you once when it gets there.",
    href: "/pro",
    cta: "How alerts work",
  },
  {
    Icon: Trophy,
    title: "Picks of the week",
    body: "Phone and laptop of the week and of the year, chosen by a published rule instead of a sponsor.",
    href: "/picks",
    cta: "See the picks",
  },
  {
    Icon: Heart,
    title: "Save and come back",
    body: "Heart devices to a shortlist and pick up your recently viewed ones. No account needed.",
    href: "/saved",
    cta: "Your shortlist",
  },
  {
    Icon: Search,
    title: "Search any model",
    body: "Find a phone or laptop by name, brand or chip, like “s26 ultra” or “rtx 5060”.",
    href: "/search",
    cta: "Search the catalogue",
  },
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

  const [landing, picks] = await Promise.all([getLandingData(), getPicks()]);
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
            <span>Laptops &amp; phones · India</span>
            <span>
              {stats.devices} devices · {formatPrice(stats.minPrice)} to {formatPrice(stats.maxPrice)}
            </span>
          </div>

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div className="min-w-0">
              <PlateHeadline id="hero-title" lines={["Skip the", "ten open", "tabs."]} className="text-[clamp(4.25rem,17vw,9.5rem)]" />
              <p className="mt-8 max-w-[44ch] text-xl leading-relaxed">
                Tell Techify your budget and what you&apos;ll use it for. Every laptop or phone in range gets scored on the specs
                that matter for that job, with the reasoning spelled out.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/phones"
                  className="flex items-center gap-3 border-[3px] border-ink bg-ink px-6 py-4 font-heading text-2xl font-black uppercase text-paper shadow-[6px_6px_0_var(--pink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_var(--pink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <Smartphone className="size-6" aria-hidden /> Find a phone
                </Link>
                <Link
                  href="/laptops"
                  className="flex items-center gap-3 border-[3px] border-ink bg-paper px-6 py-4 font-heading text-2xl font-black uppercase shadow-[6px_6px_0_var(--ink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <Laptop className="size-6" aria-hidden /> Find a laptop
                </Link>
              </div>
            </div>
            <div className="min-w-0">
              <RankingDemo demo={demo} />
              <p className="mt-6 text-sm text-ink-soft">
                Same six phones, re-ranked for each use case with the real scoring engine. Tap a tab or pause it.
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
        <section aria-label="Catalogue at a glance" data-reveal className="mt-16 grid grid-cols-2 border-[3px] border-ink lg:grid-cols-4">
          {[
            { value: <CountUp value={stats.devices} />, label: "laptops & phones scored" },
            { value: <CountUp value={stats.brands} />, label: "brands on sale in India" },
            { value: <CountUp value={stats.useCases} />, label: "use cases, each with its own weights" },
            { value: <CountUp value={0} />, label: "sponsored placements in any ranking" },
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
              How a ranking gets made
            </h2>
            <Link href="/how-it-works" className="flex items-center gap-2 label-mono hover:bg-pink-tint">
              Full method <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p data-reveal className="mt-5 max-w-[60ch] text-lg text-ink-soft">
            A real query, scrolled one step at a time: gaming phones under {formatPrice(story.budget)}.
          </p>
          <div className="mt-6">
            <ScoringStory story={story} />
          </div>
        </section>

        {/* Free-text search --------------------------------------------------------- */}
        <section id="search" aria-labelledby="search-title" className="scroll-mt-28 pt-24">
          <div data-reveal className="grid items-end gap-6 border-b-[3px] border-ink pb-5 lg:grid-cols-[1fr_auto]">
            <h2 id="search-title" className="text-6xl sm:text-7xl">
              Or just say it
            </h2>
            <p className="max-w-[40ch] text-ink-soft">Write it how you&apos;d text a friend. Techify fills in the category, use case and budget.</p>
          </div>
          <div data-reveal className="mt-8">
            <QuickSearch typewriter />
          </div>
        </section>

        {/* Features ------------------------------------------------------------------ */}
        <section aria-labelledby="features-title" className="pt-24">
          <h2 id="features-title" data-reveal className="border-b-[3px] border-ink pb-5 text-6xl sm:text-7xl">
            Everything else it does
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body, href, cta }, i) => (
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
                This week&apos;s picks
              </h2>
              <Link href="/picks" className="flex items-center gap-2 label-mono hover:bg-pink-tint">
                Plus devices of the year <ArrowRight className="size-4" aria-hidden />
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
              Wait for the right price
            </h2>
            <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-paper/85">
              Set a target price on any device and get one email when it drops. Free covers {FREE_ALERT_LIMIT} devices at a
              time. Pro watches everything on your list.
            </p>
          </div>
          <div className="flex flex-col justify-between border-t-[3px] border-paper lg:border-t-0 lg:border-l-[3px]">
            <div className="p-7 sm:p-10">
              <p className="font-heading text-8xl font-black leading-none tabular">{formatPrice(proPriceInr())}</p>
              <p className="mt-2 label-mono text-paper/70">one time · UPI, cards, netbanking</p>
            </div>
            <Link
              href="/pro"
              className="flex items-center justify-between gap-3 border-t-[3px] border-paper bg-pink px-7 py-5 font-heading text-3xl font-black uppercase text-ink-deep transition-colors hover:bg-paper sm:px-10"
            >
              Get Pro <ArrowRight className="size-7" aria-hidden />
            </Link>
          </div>
        </section>

        {/* Final call to action ----------------------------------------------------- */}
        <section aria-labelledby="start-title" className="py-24">
          <h2 id="start-title" data-reveal className="text-center text-[clamp(3.5rem,11vw,8rem)]">
            Ready when you are
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {([
              { id: "phone", label: "Phones", Icon: Smartphone },
              { id: "laptop", label: "Laptops", Icon: Laptop },
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
                    <p className="label-mono text-ink-soft">Ranked for {PROFILES[id].map((p) => p.label.toLowerCase()).join(", ")}</p>
                    <p className="mt-4 font-heading text-7xl font-black uppercase leading-none sm:text-8xl">{label}</p>
                  </div>
                  <Icon className="size-12 shrink-0 text-pink transition-transform duration-300 group-hover:scale-110" aria-hidden />
                </div>
                <span className="mt-auto flex items-center gap-2 border-t-[3px] border-ink px-7 py-4 label-mono transition-colors group-hover:bg-ink group-hover:text-paper sm:px-9">
                  Start ranking {label.toLowerCase()} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
