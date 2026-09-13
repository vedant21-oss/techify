import type { NextRequest } from "next/server";
import { z } from "zod";
import { zodMessage } from "@/lib/query";
import { getDevicesBySlugs } from "@/lib/recommendations";

const schema = z.object({
  slugs: z
    .string()
    .transform((s) => [...new Set(s.split(",").map((x) => x.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(120)).min(1).max(50)),
});

/** GET /api/devices?slugs=a,b — device records for the saved list and history. */
export async function GET(request: NextRequest) {
  const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });
  return Response.json({ devices: await getDevicesBySlugs(parsed.data.slugs) });
}
