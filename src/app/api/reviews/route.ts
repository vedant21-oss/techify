import { zodMessage } from "@/lib/query";
import { reviewSchema, submitReview } from "@/lib/server/reviews";

/** POST /api/reviews — submit an owner review; it appears after moderation. */
export async function POST(request: Request) {
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });
  const result = await submitReview(parsed.data);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true }, { status: 201 });
}
