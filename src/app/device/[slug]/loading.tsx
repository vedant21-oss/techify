import { Skeleton, SkeletonHero, SkeletonPage, SkeletonStack } from "@/components/skeleton";
import { getMessages } from "@/lib/i18n/server";

export default async function Loading() {
  const t = await getMessages();
  return (
    <SkeletonPage label={t.loading.device}>
      <SkeletonHero lines={2} size="sm" />
      <div className="mx-auto grid max-w-6xl gap-8 px-(--gutter) py-10 lg:grid-cols-[1fr_20rem]">
        <SkeletonStack className="grid gap-6">
          {/* Score breakdown: a label and a bar per factor. */}
          <div className="border-[3px] border-ink bg-paper p-6">
            <Skeleton className="h-7 w-44" />
            <div className="mt-6 grid gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="grid grid-cols-[8rem_1fr] items-center gap-4">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
          {/* Spec table. */}
          <div className="border-[3px] border-ink bg-paper">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 border-b border-ink p-4 last:border-b-0">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        </SkeletonStack>
        <div className="grid gap-6 self-start">
          <div className="border-[3px] border-ink bg-paper p-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="mt-4 h-11 w-full" />
            <Skeleton className="mt-2.5 h-11 w-full" />
          </div>
          <Skeleton className="h-40 w-full border-[3px] border-ink" />
        </div>
      </div>
    </SkeletonPage>
  );
}
