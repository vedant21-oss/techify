import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/engine";
import { LaunchForm, UpcomingForm } from "../../forms";

export const dynamic = "force-dynamic";

export default async function AdminUpcomingPage() {
  const items = await prisma.upcomingDevice.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { subscriptions: true } } },
  });
  return (
    <>
      <h1 className="text-6xl">Upcoming</h1>
      <section className="mt-8 border-[3px] border-ink bg-paper p-5">
        <h2 className="text-3xl">Add a launch</h2>
        <div className="mt-4">
          <UpcomingForm />
        </div>
      </section>
      <ul className="mt-8 flex flex-col gap-4">
        {items.map((u) => (
          <li key={u.slug} className="border-[3px] border-ink bg-paper p-5">
            <p className="label-mono text-ink-soft">
              {u.category.toLowerCase()} · {u.expectedLaunch}
              {u.expectedPrice ? ` · ${formatPrice(u.expectedPrice)}` : ""} · {u._count.subscriptions} waiting
            </p>
            <h2 className="mt-2 text-3xl">
              {u.brand} {u.name}
            </h2>
            <p className="mt-1 text-sm">{u.summary}</p>
            <div className="mt-4">
              {u.launchedAt ? (
                <p className="label-mono">Launched · linked to {u.launchedSlug}</p>
              ) : (
                <LaunchForm upcomingSlug={u.slug} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
