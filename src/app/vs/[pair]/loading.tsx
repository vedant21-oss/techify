import { Skeleton, SkeletonHero, SkeletonPage } from "@/components/skeleton";
import { getMessages } from "@/lib/i18n/server";

export default async function Loading() {
  const t = await getMessages();
  return (
    <SkeletonPage label={t.loading.versus}>
      <SkeletonHero lines={2} size="sm" />
      <div className="mx-auto max-w-6xl px-(--gutter) py-10">
        {/* The two contenders, then a verdict per factor between them. */}
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="border-[3px] border-ink bg-paper p-6">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="mt-3 h-6 w-28" />
              <Skeleton className="mt-5 h-16 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-8 border-[3px] border-ink bg-paper">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="grid grid-cols-[1fr_7rem_1fr] items-center gap-4 border-b border-ink p-4 last:border-b-0">
              <Skeleton className="h-3.5 w-24 justify-self-end" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
