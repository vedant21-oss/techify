import { runPriceAlertCheck } from "@/lib/server/alerts";

/**
 * GET /api/cron/price-alerts — sends due price-drop emails. Vercel Cron calls this
 * daily with `Authorization: Bearer $CRON_SECRET`. Without a secret it only runs
 * outside production, for local testing.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : process.env.NODE_ENV !== "production";
  if (!authorized) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json(await runPriceAlertCheck());
}
