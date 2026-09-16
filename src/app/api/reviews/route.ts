import { zodMessage } from "@/lib/query";
import { getCurrentUser } from "@/lib/server/auth";
import { reviewSchema, submitReview } from "@/lib/server/reviews";

/** POST /api/reviews — submit an owner review; it appears after moderation. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const user = await getCurrentUser();
  // Logged in: the review is written under the account, whatever name or email the form sent.
  const input = user && body && typeof body === "object" ? { ...body, name: user.name, email: user.email } : body;
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });
  const result = await submitReview(parsed.data, user?.id);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true }, { status: 201 });
}
