import "server-only";
import { prisma } from "@/lib/db";
import { runPriceAlertCheck } from "@/lib/server/alerts";

/**
 * Updates a device's price from the admin dashboard: records price history (which
 * feeds the deals page) and immediately checks price-drop alerts.
 * Note: re-running the seed re-applies prices from the seed files.
 */
export async function updateDevicePrice(slug: string, price: number) {
  if (!Number.isInteger(price) || price < 1000 || price > 1_000_000) {
    return { ok: false as const, error: "Enter a whole-rupee price between ₹1,000 and ₹10,00,000." };
  }
  const device = await prisma.device.findUnique({ where: { slug } });
  if (!device) return { ok: false as const, error: "Device not found." };
  if (device.price === price) return { ok: true as const, changed: false, alerts: null };

  const now = new Date();
  await prisma.$transaction([
    prisma.device.update({ where: { id: device.id }, data: { price, priceCheckedOn: now, priceSource: "Techify admin" } }),
    prisma.pricePoint.create({ data: { deviceId: device.id, price, source: "Techify admin", recordedAt: now } }),
  ]);
  const alerts = await runPriceAlertCheck();
  return { ok: true as const, changed: true, alerts };
}

export async function adminOverview() {
  const [devices, pendingReviews, approvedReviews, activeAlerts, sentAlerts, proMembers, revenue, waiting] = await Promise.all([
    prisma.device.count(),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "APPROVED" } }),
    prisma.priceAlert.count({ where: { triggeredAt: null } }),
    prisma.priceAlert.count({ where: { triggeredAt: { not: null } } }),
    prisma.proPayment.findMany({ where: { status: "PAID" }, distinct: ["email"], select: { email: true } }),
    prisma.proPayment.aggregate({ where: { status: "PAID" }, _sum: { amountPaise: true } }),
    prisma.upcomingSubscription.count({ where: { notifiedAt: null } }),
  ]);
  return {
    devices,
    pendingReviews,
    approvedReviews,
    activeAlerts,
    sentAlerts,
    proMembers: proMembers.length,
    revenueInr: Math.round((revenue._sum.amountPaise ?? 0) / 100),
    waiting,
  };
}
