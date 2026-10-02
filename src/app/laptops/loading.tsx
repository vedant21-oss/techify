import { SkeletonControls, SkeletonDeviceList, SkeletonHero, SkeletonPage } from "@/components/skeleton";
import { getMessages } from "@/lib/i18n/server";

export default async function Loading() {
  const t = await getMessages();
  return (
    <SkeletonPage label={t.loading.results}>
      <SkeletonHero />
      <div className="mx-auto grid max-w-6xl gap-8 px-(--gutter) py-10 lg:grid-cols-[20rem_1fr]">
        <SkeletonControls />
        <SkeletonDeviceList rows={5} />
      </div>
    </SkeletonPage>
  );
}
