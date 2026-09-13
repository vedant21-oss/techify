import { Finder } from "@/components/finder/finder";
import { PlateHeadline } from "@/components/plate-headline";
import type { Category } from "@/lib/engine";
import { parseFinderParams } from "@/lib/query";
import { getRecommendations } from "@/lib/recommendations";

const copy: Record<Category, { lines: string[]; lede: string }> = {
  laptop: {
    lines: ["Laptops,", "ranked for", "your work."],
    lede: "Gaming, coding, editing or college: set a budget and every laptop in range is scored on the specs that job needs.",
  },
  phone: {
    lines: ["Phones,", "ranked for", "your day."],
    lede: "Camera, games, battery or just good value: set a budget and every phone in range is scored on what matters to you.",
  },
};

export async function CategoryFinderPage({
  category,
  searchParams,
}: {
  category: Category;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = parseFinderParams(searchParams, category);
  const initialData = await getRecommendations(params);

  return (
    <>
      <section aria-labelledby="category-title" className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_22rem]">
          <PlateHeadline id="category-title" lines={copy[category].lines} className="text-[clamp(3.75rem,15vw,9rem)]" />
          <p className="max-w-[40ch] text-lg leading-relaxed lg:pb-2">{copy[category].lede}</p>
        </div>
      </section>
      <Finder category={category} initialParams={params} initialData={initialData} />
    </>
  );
}
