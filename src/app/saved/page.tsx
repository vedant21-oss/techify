import type { Metadata } from "next";
import { PlateHeadline } from "@/components/plate-headline";
import { getMessages } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/server/auth";
import { SavedView } from "./saved-view";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default async function SavedPage() {
  const [t, user] = await Promise.all([getMessages(), getCurrentUser()]);
  return (
    <div className="pb-20">
      <section aria-labelledby="saved-title" className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_24rem]">
          <PlateHeadline id="saved-title" lines={t.savedPage.lines} className="text-[clamp(4rem,17vw,10rem)]" />
          <p className="max-w-[44ch] text-lg leading-relaxed lg:pb-2">
            {user ? t.savedPage.synced : t.savedPage.local}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-(--gutter)">
        <SavedView />
      </div>
    </div>
  );
}
