import { z } from "zod";
import { zodMessage } from "@/lib/query";
import { createPriceAlert } from "@/lib/server/alerts";

const bodySchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  slug: z.string().min(1).max(120),
  targetPrice: z.coerce.number().int({ error: "Enter a target price in whole rupees." }).positive(),
});

/** POST /api/alerts { email, slug, targetPrice } — create or update a price-drop alert. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });

  const result = await createPriceAlert(parsed.data);
  if (!result.ok) return Response.json({ error: result.error, code: result.code }, { status: result.status });
  return Response.json(result, { status: result.updated ? 200 : 201 });
}
