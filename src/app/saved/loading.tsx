import { SkeletonDeviceList, SkeletonHero, SkeletonPage } from "@/components/skeleton";
import { getMessages } from "@/lib/i18n/server";

export default async function Loading() {
  const t = await getMessages();
  return (
    <SkeletonPage label={t.loading.saved}>
      <SkeletonHero lines={2} size="sm" />
      <div className="mx-auto max-w-6xl px-(--gutter) py-10">
        <SkeletonDeviceList rows={4} />
      </div>
    </SkeletonPage>
  );
}
