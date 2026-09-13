import type { NextRequest } from "next/server";
import { getLang } from "@/lib/i18n/server";
import { recommendationSchema, zodMessage } from "@/lib/query";
import { getRecommendations } from "@/lib/recommendations";

/** GET /api/recommend?category=laptop&useCase=gaming&budget=90000&sort=match */
export async function GET(request: NextRequest) {
  const parsed = recommendationSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });
  }
  return Response.json(await getRecommendations(parsed.data, await getLang()));
}
