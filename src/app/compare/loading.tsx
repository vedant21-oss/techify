import { Skeleton, SkeletonHero, SkeletonPage } from "@/components/skeleton";
import { getMessages } from "@/lib/i18n/server";

export default async function Loading() {
  const t = await getMessages();
  return (
    <SkeletonPage label={t.loading.compare}>
      <SkeletonHero lines={2} size="sm" />
      <div className="mx-auto max-w-6xl px-(--gutter) py-10">
        {/* A column per device, then a row per spec across them. */}
        <div className="border-[3px] border-ink bg-paper">
          <div className="grid grid-cols-[8rem_repeat(3,1fr)] gap-4 border-b-[3px] border-ink p-4">
            <div />
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          {Array.from({ length: 9 }, (_, row) => (
            <div key={row} className="grid grid-cols-[8rem_repeat(3,1fr)] items-center gap-4 border-b border-ink p-4 last:border-b-0">
              <Skeleton className="h-3.5 w-full" />
              {Array.from({ length: 3 }, (_, col) => (
                <Skeleton key={col} className="h-3.5 w-16" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
