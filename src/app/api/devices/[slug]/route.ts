import type { NextRequest } from "next/server";
import { contextSchema, zodMessage } from "@/lib/query";
import { getDeviceDetail } from "@/lib/recommendations";

/** GET /api/devices/:slug?useCase=gaming&budget=90000 — both query params optional. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/devices/[slug]">) {
  const { slug } = await ctx.params;
  const parsed = contextSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });
  }
  const detail = await getDeviceDetail(slug, parsed.data);
  if (!detail) return Response.json({ error: `No device with slug "${slug}"` }, { status: 404 });
  return Response.json(detail);
}
