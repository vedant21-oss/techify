import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { safeAdUrl } from "@/lib/features/ads";

/** GET /api/ads/:id/click — counts the click, then sends the visitor to the ad's link. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/ads/[id]/click">) {
  const { id } = await ctx.params;
  const ad = await prisma.ad.findUnique({ where: { id }, select: { url: true } });
  // Only ever redirect to the stored, re-validated link, never to anything from the request.
  const target = ad ? safeAdUrl(ad.url) : null;
  if (!target) return Response.redirect(new URL("/", request.url), 302);
  await prisma.ad.update({ where: { id }, data: { clicks: { increment: 1 } } });
  return Response.redirect(new URL(target, request.url), 302);
}
