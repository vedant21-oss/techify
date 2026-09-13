"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { logIn, logOut, requireAdmin } from "@/lib/server/admin";
import { updateDevicePrice } from "@/lib/server/catalog-admin";
import { markLaunched } from "@/lib/server/upcoming";

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
