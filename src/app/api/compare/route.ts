import type { NextRequest } from "next/server";
import { compareSchema, zodMessage } from "@/lib/query";
import { getComparison } from "@/lib/recommendations";

/** GET /api/compare?slugs=a,b,c&useCase=gaming&budget=90000 — up to three devices of one category. */
export async function GET(request: NextRequest) {
  const parsed = compareSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });
  }
  const { slugs, ...context } = parsed.data;
  const result = await getComparison(slugs, context);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
