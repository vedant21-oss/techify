"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { logIn, logOut, requireAdmin } from "@/lib/server/admin";
import { updateDevicePrice } from "@/lib/server/catalog-admin";
import { markLaunched } from "@/lib/server/upcoming";
import { adFormSchema } from "@/lib/features/ad-form";
import { offerFormSchema } from "@/lib/features/offer-form";

export type ActionState = { ok?: boolean; message?: string } | null;

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const ok = await logIn(String(form.get("password") ?? ""));
  if (!ok) return { ok: false, message: "That password isn't right, or ADMIN_PASSWORD isn't set on the server." };
  redirect("/admin");
}

export async function logoutAction() {
  await logOut();
  redirect("/admin/login");
}

export async function updatePriceAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const slug = String(form.get("slug") ?? "");
  const price = Number(String(form.get("price") ?? "").replace(/[^\d]/g, ""));
  const result = await updateDevicePrice(slug, price);
  if (!result.ok) return { ok: false, message: result.error };
  revalidatePath("/admin/prices");
  revalidatePath("/deals");
  if (!result.changed) return { ok: true, message: "Price unchanged." };
  const sent = result.alerts?.due ? ` ${result.alerts.due} price alert${result.alerts.due === 1 ? "" : "s"} triggered.` : "";
  return { ok: true, message: `Saved and recorded in price history.${sent}` };
}

export async function moderateReviewAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const decision = form.get("decision") === "approve" ? "APPROVED" : "REJECTED";
  const review = await prisma.review.update({ where: { id }, data: { status: decision }, include: { device: { select: { slug: true } } } });
  revalidatePath("/admin/reviews");
  revalidatePath(`/device/${review.device.slug}`);
}

export async function addUpcomingAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const name = get("name");
  const brand = get("brand");
  const category = get("category") === "laptop" ? "LAPTOP" : "PHONE";
  const expectedLaunch = get("expectedLaunch");
  const summary = get("summary");
  const price = Number(get("expectedPrice").replace(/[^\d]/g, ""));
  if (!name || !brand || !expectedLaunch || summary.length < 10) {
    return { ok: false, message: "Fill in brand, name, expected launch and a one-line summary." };
  }
  const slug = `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await prisma.upcomingDevice.upsert({
    where: { slug },
    create: { slug, brand, name, category, expectedLaunch, summary, expectedPrice: price || null, sourceUrl: get("sourceUrl") || null },
    update: { brand, name, category, expectedLaunch, summary, expectedPrice: price || null, sourceUrl: get("sourceUrl") || null },
  });
  revalidatePath("/admin/upcoming");
  revalidatePath("/upcoming");
  return { ok: true, message: `Saved ${brand} ${name}.` };
}

export async function markLaunchedAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const result = await markLaunched(String(form.get("upcomingSlug") ?? ""), String(form.get("catalogueSlug") ?? "").trim());
  if (!result.ok) return { ok: false, message: result.error };
  revalidatePath("/admin/upcoming");
  revalidatePath("/upcoming");
  return { ok: true, message: `Marked as launched. ${result.notified} subscriber${result.notified === 1 ? "" : "s"} notified.` };
}

export async function addOfferAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = offerFormSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { slug, validUntil, maxDiscount, ...offer } = parsed.data;
  const device = await prisma.device.findUnique({ where: { slug }, select: { id: true, category: true } });
  if (!device) return { ok: false, message: "Device not found." };
  await prisma.bankOffer.create({
    data: {
      ...offer,
      deviceId: device.id,
      maxDiscount: offer.kind === "PERCENT" ? maxDiscount : null,
      // Offers run to the end of their last day, India time.
      validUntil: validUntil ? new Date(`${validUntil}T23:59:59+05:30`) : null,
    },
  });
  revalidateOfferPages(slug, device.category);
  return { ok: true, message: "Offer saved." };
}

export async function deleteOfferAction(form: FormData) {
  await requireAdmin();
  const offer = await prisma.bankOffer.delete({
    where: { id: String(form.get("id") ?? "") },
    include: { device: { select: { slug: true, category: true } } },
  });
  revalidateOfferPages(offer.device.slug, offer.device.category);
}

function revalidateOfferPages(slug: string, category: "LAPTOP" | "PHONE") {
  revalidatePath("/admin/offers");
  revalidatePath(`/device/${slug}`);
  revalidatePath(category === "LAPTOP" ? "/laptops" : "/phones");
}

export async function addAdAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = adFormSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { deviceSlug, startsAt, endsAt, ...ad } = parsed.data;
  let deviceId: string | null = null;
  if (deviceSlug) {
    const device = await prisma.device.findUnique({ where: { slug: deviceSlug }, select: { id: true } });
    if (!device) return { ok: false, message: "That device isn't in the catalogue." };
    deviceId = device.id;
  }
  await prisma.ad.create({
    data: {
      ...ad,
      deviceId,
      // Dates are whole days, India time: from the start of the first to the end of the last.
      startsAt: startsAt ? new Date(`${startsAt}T00:00:00+05:30`) : null,
      endsAt: endsAt ? new Date(`${endsAt}T23:59:59+05:30`) : null,
    },
  });
  revalidateAdPages();
  return { ok: true, message: "Ad saved. It shows as soon as it's live." };
}

export async function toggleAdAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const ad = await prisma.ad.findUnique({ where: { id }, select: { active: true } });
  if (!ad) return;
  await prisma.ad.update({ where: { id }, data: { active: !ad.active } });
  revalidateAdPages();
}

export async function deleteAdAction(form: FormData) {
  await requireAdmin();
  await prisma.ad.deleteMany({ where: { id: String(form.get("id") ?? "") } });
  revalidateAdPages();
}

function revalidateAdPages() {
  revalidatePath("/admin/ads");
  revalidatePath("/", "layout");
}
