import { Skeleton, SkeletonHero, SkeletonPage } from "@/components/skeleton";
import { getMessages } from "@/lib/i18n/server";

export default async function Loading() {
  const t = await getMessages();
  return (
    <SkeletonPage label={t.loading.upgrade}>
      <SkeletonHero lines={2} size="sm" />
      <div className="mx-auto max-w-6xl px-(--gutter) py-10">
        {/* The three short-answer picks, then the full list of upgrades. */}
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="border-[3px] border-ink bg-paper p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-9 w-3/4" />
              <Skeleton className="mt-4 h-8 w-24" />
              <Skeleton className="mt-4 h-3.5 w-full" />
              <Skeleton className="mt-2 h-3.5 w-5/6" />
            </div>
          ))}
        </div>
        <div className="mt-10 border-[3px] border-ink bg-paper">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem] items-center gap-4 border-b border-ink p-5 last:border-b-0">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
