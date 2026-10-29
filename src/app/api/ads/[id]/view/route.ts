import { prisma } from "@/lib/db";

/** POST /api/ads/:id/view — sent once when an ad has actually been on screen. */
export async function POST(_: Request, ctx: RouteContext<"/api/ads/[id]/view">) {
  const { id } = await ctx.params;
  await prisma.ad.updateMany({ where: { id, active: true }, data: { views: { increment: 1 } } });
  return new Response(null, { status: 204 });
}
