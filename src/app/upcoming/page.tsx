import { ExternalLink, Laptop, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import { PlateHeadline } from "@/components/plate-headline";
import { getMessages } from "@/lib/i18n/server";
import { listUpcoming } from "@/lib/server/upcoming";
import { NotifyForm } from "./notify-form";

export const metadata: Metadata = {
  title: "Upcoming launches",
  description: "Phones and laptops announced or expected in India, with a one-time email when each one launches.",
};

export default async function UpcomingPage() {
  const [items, messages] = await Promise.all([listUpcoming(), getMessages()]);
  const t = messages.upcoming;
  return (
    <div className="pb-20">
      <section aria-labelledby="upcoming-title" className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_24rem]">
          <PlateHeadline id="upcoming-title" lines={t.lines} className="text-[clamp(4rem,17vw,10rem)]" />
          <p className="max-w-[44ch] text-lg leading-relaxed lg:pb-2">
            {t.lede}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-(--gutter) pt-12">
        {items.length === 0 ? (
          <p className="text-ink-soft">{t.empty}</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {items.map((u) => {
              const Icon = u.category === "phone" ? Smartphone : Laptop;
              return (
                <li key={u.slug} className="flex flex-col gap-4 border-[3px] border-ink bg-paper p-6">
                  <p className="flex items-center gap-2 label-mono text-ink-soft">
                    <Icon className="size-4 text-pink" aria-hidden /> {u.expectedLaunch}
                    {u.waiting > 0 && <span>{t.waiting(u.waiting)}</span>}
                  </p>
                  <h2 className="text-4xl">
                    {u.brand} {u.name}
                  </h2>
                  {u.expectedPrice && <p className="font-heading text-3xl font-bold tabular">{t.from(u.expectedPrice)}</p>}
                  <p className="leading-relaxed">{u.summary}</p>
                  {u.sourceUrl && (
                    <a href={u.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 label-mono underline underline-offset-4">
                      {t.source} <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  )}
                  <NotifyForm slug={u.slug} name={`${u.brand} ${u.name}`} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
