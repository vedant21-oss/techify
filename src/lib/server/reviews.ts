import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/features/alerts";

export const reviewSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().trim().min(2, { error: "Add your name (at least 2 letters)." }).max(40),
  email: z.email({ error: "Enter a valid email. It isn't shown publicly." }),
  rating: z.coerce.number().int().min(1, { error: "Pick a rating from 1 to 5." }).max(5),
  title: z.string().trim().min(4, { error: "Give your review a short title." }).max(80),
  body: z.string().trim().min(40, { error: "Write at least 40 characters so it's useful to others." }).max(2000),
  usedFor: z.string().trim().min(2).max(40),
  ownedMonths: z.coerce.number().int().min(0).max(120),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export async function submitReview(input: ReviewInput) {
  const device = await prisma.device.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (!device) return { ok: false as const, status: 404, error: "That device isn't in the catalogue any more." };
  const email = normalizeEmail(input.email);
  const existing = await prisma.review.findUnique({ where: { email_deviceId: { email, deviceId: device.id } } });
  if (existing?.status === "APPROVED") {
    return { ok: false as const, status: 409, error: "You've already reviewed this device. Thanks!" };
  }
  const data = {
    name: input.name,
    email,
    rating: input.rating,
    title: input.title,
    body: input.body,
    usedFor: input.usedFor,
    ownedMonths: input.ownedMonths,
    status: "PENDING" as const,
  };
  await prisma.review.upsert({
    where: { email_deviceId: { email, deviceId: device.id } },
    create: { ...data, deviceId: device.id },
    update: data,
  });
  return { ok: true as const };
}
