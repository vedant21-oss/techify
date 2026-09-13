import { z } from "zod";
import { zodMessage } from "@/lib/query";
import { subscribeUpcoming } from "@/lib/server/upcoming";

const bodySchema = z.object({ slug: z.string().min(1).max(120), email: z.email({ error: "Enter a valid email address." }) });

/** POST /api/upcoming/subscribe { slug, email } — email me when this launches. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });
  const result = await subscribeUpcoming(parsed.data.slug, parsed.data.email);
  if (!result.ok) return Response.json({ error: result.error }, { status: 404 });
  return Response.json(result, { status: 201 });
}
