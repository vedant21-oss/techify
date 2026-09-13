import "server-only";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/features/alerts";
import { appUrl, sendEmail } from "@/lib/server/mailer";

export async function listUpcoming() {
  const rows = await prisma.upcomingDevice.findMany({
    where: { launchedAt: null },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });
  return rows.map((u) => ({
    slug: u.slug,
    category: u.category === "LAPTOP" ? ("laptop" as const) : ("phone" as const),
    brand: u.brand,
    name: u.name,
    expectedPrice: u.expectedPrice,
    expectedLaunch: u.expectedLaunch,
    summary: u.summary,
    sourceUrl: u.sourceUrl,
    waiting: u._count.subscriptions,
  }));
}

export async function subscribeUpcoming(slug: string, rawEmail: string) {
  const item = await prisma.upcomingDevice.findUnique({ where: { slug } });
  if (!item || item.launchedAt) return { ok: false as const, error: "That launch isn't on the upcoming list any more." };
  const email = normalizeEmail(rawEmail);
  await prisma.upcomingSubscription.upsert({
    where: { email_upcomingId: { email, upcomingId: item.id } },
    create: { email, upcomingId: item.id },
    update: {},
  });
  return { ok: true as const, name: `${item.brand} ${item.name}` };
}

/** Marks a launch as on sale, links it to its catalogue entry and emails everyone waiting. */
export async function markLaunched(upcomingSlug: string, catalogueSlug: string) {
  const [item, device] = await Promise.all([
    prisma.upcomingDevice.findUnique({ where: { slug: upcomingSlug }, include: { subscriptions: { where: { notifiedAt: null } } } }),
    prisma.device.findUnique({ where: { slug: catalogueSlug } }),
  ]);
  if (!item) return { ok: false as const, error: "Upcoming launch not found." };
  if (!device) return { ok: false as const, error: `No catalogue device with slug "${catalogueSlug}". Add it to the catalogue first.` };

  await prisma.upcomingDevice.update({ where: { id: item.id }, data: { launchedSlug: device.slug, launchedAt: new Date() } });
  const name = `${item.brand} ${item.name}`;
  let delivered = 0;
  for (const sub of item.subscriptions) {
    const link = appUrl(`/device/${device.slug}`);
    const result = await sendEmail({
      to: sub.email,
      subject: `${name} is now on Techify`,
      text: `${name} has launched and is now scored on Techify.\\n\\nSee how it ranks: ${link}\\n\\nYou asked to hear about this launch; this is the only email you'll get about it.`,
      html: `<div style="font-family:Arial,sans-serif;color:#0c0d52"><h1 style="font-size:22px">${name} is now on Techify</h1><p>It has launched and is scored against everything else in its price range.</p><p><a href="${link}" style="background:#1d1fcf;color:#f1f1ec;padding:10px 16px;text-decoration:none">See how it ranks</a></p><p style="font-size:12px;color:#3d3f8f">You asked to hear about this launch. This is the only email about it.</p></div>`,
    });
    await prisma.upcomingSubscription.update({ where: { id: sub.id }, data: { notifiedAt: new Date() } });
    if (result.delivered) delivered += 1;
  }
  return { ok: true as const, notified: item.subscriptions.length, delivered };
}
