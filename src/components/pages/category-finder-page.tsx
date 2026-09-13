import { Finder } from "@/components/finder/finder";
import { PlateHeadline } from "@/components/plate-headline";
import type { Category } from "@/lib/engine";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { parseFinderParams } from "@/lib/query";
import { getRecommendations } from "@/lib/recommendations";

export async function CategoryFinderPage({
  category,
  searchParams,
}: {
  category: Category;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = parseFinderParams(searchParams, category);
  const lang = await getLang();
  const initialData = await getRecommendations(params, lang);
  const copy = MESSAGES[lang].category;

  return (
    <>
      <section aria-labelledby="category-title" className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_22rem]">
          <PlateHeadline id="category-title" lines={copy[category].lines} className="text-[clamp(3.75rem,15vw,9rem)]" />
          <p className="max-w-[40ch] text-lg leading-relaxed lg:pb-2">{copy[category].lede}</p>
        </div>
      </section>
      {/* Keyed by language so switching re-seeds results with the translated explanations. */}
      <Finder key={lang} category={category} initialParams={params} initialData={initialData} />
    </>
  );
}
