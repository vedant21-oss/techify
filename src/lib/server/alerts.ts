import "server-only";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/engine";
import { alertLimit, canCreateAlert, dueAlerts, normalizeEmail, validateTargetPrice } from "@/lib/features/alerts";
import { appUrl, sendEmail } from "@/lib/server/mailer";
import { isProMember } from "@/lib/server/pro";

export type CreateAlertResult =
  | { ok: true; targetPrice: number; activeAlerts: number; limit: number | null; updated: boolean }
  | { ok: false; status: 400 | 403 | 404; code: "not_found" | "invalid_target" | "limit_reached"; error: string };

export async function createPriceAlert(input: { email: string; slug: string; targetPrice: number }): Promise<CreateAlertResult> {
  const email = normalizeEmail(input.email);
  const device = await prisma.device.findUnique({ where: { slug: input.slug }, select: { id: true, price: true } });
  if (!device) return { ok: false, status: 404, code: "not_found", error: "That device isn't in the catalogue any more." };

  const targetError = validateTargetPrice(input.targetPrice, device.price);
  if (targetError) return { ok: false, status: 400, code: "invalid_target", error: targetError };

  const [existing, activeAlerts, isPro] = await Promise.all([
    prisma.priceAlert.findUnique({ where: { email_deviceId: { email, deviceId: device.id } } }),
    prisma.priceAlert.count({ where: { email, triggeredAt: null } }),
    isProMember(email),
  ]);
  const isUpdate = existing !== null && existing.triggeredAt === null;

  if (!canCreateAlert(activeAlerts, isPro, isUpdate)) {
    return {
      ok: false,
      status: 403,
      code: "limit_reached",
      error: `The free plan watches ${alertLimit(false)} devices at a time. Upgrade to Pro for unlimited alerts, or wait for one to fire.`,
    };
  }

  await prisma.priceAlert.upsert({
    where: { email_deviceId: { email, deviceId: device.id } },
    create: { email, deviceId: device.id, targetPrice: input.targetPrice, priceAtSignup: device.price },
    update: { targetPrice: input.targetPrice, priceAtSignup: device.price, triggeredAt: null },
  });

  return {
    ok: true,
    targetPrice: input.targetPrice,
    activeAlerts: isUpdate ? activeAlerts : activeAlerts + 1,
    limit: alertLimit(isPro),
    updated: existing !== null,
  };
}

export async function unsubscribeAlert(token: string) {
  const alert = await prisma.priceAlert.findUnique({
    where: { token },
    include: { device: { select: { brand: true, name: true } } },
  });
  if (!alert) return null;
  await prisma.priceAlert.delete({ where: { id: alert.id } });
  return { device: `${alert.device.brand} ${alert.device.name}` };
}

/**
 * Sends an email for every alert whose device now costs at or below its target.
 * Run daily (Vercel Cron hits /api/cron/price-alerts) and after refreshing prices.
 */
export async function runPriceAlertCheck() {
  const pending = await prisma.priceAlert.findMany({
    where: { triggeredAt: null },
    include: { device: { select: { slug: true, brand: true, name: true, variant: true, price: true, priceSource: true } } },
  });
  const due = dueAlerts(pending);
  let delivered = 0;

  for (const alert of due) {
    const name = `${alert.device.brand} ${alert.device.name}`;
    const deviceUrl = appUrl(`/device/${alert.device.slug}`);
    const unsubscribeUrl = appUrl(`/alerts/unsubscribe?token=${alert.token}`);
    const saving = alert.priceAtSignup - alert.device.price;

    const result = await sendEmail({
      to: alert.email,
      subject: `${name} is now ${formatPrice(alert.device.price)}`,
      text: [
        `${name} (${alert.device.variant}) dropped to ${formatPrice(alert.device.price)}, at or below your target of ${formatPrice(alert.targetPrice)}.`,
        saving > 0 ? `That's ${formatPrice(saving)} less than when you set the alert.` : "",
        `See scores and store links: ${deviceUrl}`,
        `Prices change quickly, so check the store before you buy.`,
        `Stop this alert: ${unsubscribeUrl}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      html: `<div style="font-family:Arial,sans-serif;color:#0c0d52;max-width:520px">
  <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#1d1fcf">Techify price alert</p>
  <h1 style="font-size:24px;margin:8px 0">${name} is now ${formatPrice(alert.device.price)}</h1>
  <p>${alert.device.variant} dropped to or below your target of <strong>${formatPrice(alert.targetPrice)}</strong>.${
        saving > 0 ? ` That's ${formatPrice(saving)} less than when you set the alert.` : ""
      }</p>
  <p><a href="${deviceUrl}" style="display:inline-block;background:#1d1fcf;color:#f1f1ec;padding:10px 16px;text-decoration:none">See scores and store links</a></p>
  <p style="font-size:12px;color:#3d3f8f">Prices change quickly, so check the store before you buy. <a href="${unsubscribeUrl}">Stop this alert</a>.</p>
</div>`,
    });

    // Mark as sent even in development so the same alert isn't logged every run.
    await prisma.priceAlert.update({ where: { id: alert.id }, data: { triggeredAt: new Date() } });
    if (result.delivered) delivered += 1;
  }

  return { checked: pending.length, due: due.length, delivered };
}
