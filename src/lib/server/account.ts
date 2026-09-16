import "server-only";
import { prisma } from "@/lib/db";
import { alertLimit } from "@/lib/features/alerts";
import type { CurrentUser } from "@/lib/server/auth";

/**
 * Account-owned data. Alerts, launch emails and Pro payments were keyed by email
 * before accounts existed, so they attach to an account only once its email is verified.
 */

export async function isProAccount(user: CurrentUser): Promise<boolean> {
  const paid = await prisma.proPayment.findFirst({
    where: { status: "PAID", OR: [{ userId: user.id }, ...(user.verified ? [{ email: user.email }] : [])] },
    select: { id: true },
  });
  return paid !== null;
}

export async function accountOverview(user: CurrentUser) {
  const pro = await isProAccount(user);
  if (!user.verified) return { pro, alerts: [], launches: [], limit: alertLimit(pro) };

  const [alerts, launches] = await Promise.all([
    prisma.priceAlert.findMany({
      where: { email: user.email },
      orderBy: [{ triggeredAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
      include: { device: { select: { slug: true, brand: true, name: true, variant: true, price: true } } },
    }),
    prisma.upcomingSubscription.findMany({
      where: { email: user.email },
      orderBy: { createdAt: "desc" },
      include: { upcoming: { select: { brand: true, name: true, expectedLaunch: true, launchedSlug: true } } },
    }),
  ]);

  return {
    pro,
    limit: alertLimit(pro),
    alerts: alerts.map((a) => ({
      id: a.id,
      slug: a.device.slug,
      name: a.device.name.toLowerCase().startsWith(a.device.brand.toLowerCase()) ? a.device.name : `${a.device.brand} ${a.device.name}`,
      variant: a.device.variant,
      targetPrice: a.targetPrice,
      currentPrice: a.device.price,
      sentAt: a.triggeredAt?.toISOString() ?? null,
    })),
    launches: launches.map((s) => ({
      id: s.id,
      name: `${s.upcoming.brand} ${s.upcoming.name}`,
      expectedLaunch: s.upcoming.expectedLaunch,
      launchedSlug: s.upcoming.launchedSlug,
      notifiedAt: s.notifiedAt?.toISOString() ?? null,
    })),
  };
}

export async function stopAlert(user: CurrentUser, alertId: string): Promise<boolean> {
  if (!user.verified) return false;
  const { count } = await prisma.priceAlert.deleteMany({ where: { id: alertId, email: user.email } });
  return count > 0;
}

export async function stopLaunchEmail(user: CurrentUser, subscriptionId: string): Promise<boolean> {
  if (!user.verified) return false;
  const { count } = await prisma.upcomingSubscription.deleteMany({ where: { id: subscriptionId, email: user.email } });
  return count > 0;
}

/* Saved list and recently viewed ------------------------------------------------------ */

export const RECENT_LIMIT = 12;
export const SAVED_LIMIT = 100;
export type Lists = { saved: string[]; recent: string[] };

export async function getLists(userId: string): Promise<Lists> {
  const entries = await prisma.listEntry.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
    include: { device: { select: { slug: true } } },
  });
  return {
    saved: entries.filter((e) => e.kind === "SAVED").map((e) => e.device.slug),
    recent: entries.filter((e) => e.kind === "RECENT").map((e) => e.device.slug),
  };
}

/** Replaces one list with `slugs` (newest first). Unknown slugs are ignored. */
export async function replaceList(userId: string, kind: "SAVED" | "RECENT", slugs: string[]) {
  const limit = kind === "RECENT" ? RECENT_LIMIT : SAVED_LIMIT;
  const unique = [...new Set(slugs)].slice(0, limit);
  const devices = await prisma.device.findMany({ where: { slug: { in: unique } }, select: { id: true, slug: true } });
  const idBySlug = new Map(devices.map((d) => [d.slug, d.id]));
  const now = Date.now();
  const rows = unique
    .filter((slug) => idBySlug.has(slug))
    // Newest first: give earlier positions later timestamps.
    .map((slug, i) => ({ userId, kind, deviceId: idBySlug.get(slug)!, addedAt: new Date(now - i * 1000) }));
  await prisma.$transaction([prisma.listEntry.deleteMany({ where: { userId, kind } }), prisma.listEntry.createMany({ data: rows })]);
}

/** On login: this browser's lists join the account's, browser items first. */
export async function mergeLists(userId: string, local: Lists): Promise<Lists> {
  const server = await getLists(userId);
  const merged = {
    saved: [...new Set([...local.saved, ...server.saved])].slice(0, SAVED_LIMIT),
    recent: [...new Set([...local.recent, ...server.recent])].slice(0, RECENT_LIMIT),
  };
  await replaceList(userId, "SAVED", merged.saved);
  await replaceList(userId, "RECENT", merged.recent);
  return getLists(userId);
}
