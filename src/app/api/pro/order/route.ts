import { z } from "zod";
import { zodMessage } from "@/lib/query";
import { getCurrentUser } from "@/lib/server/auth";
import { createProOrder, PaymentsNotConfiguredError } from "@/lib/server/pro";

const bodySchema = z.object({ email: z.email({ error: "Enter the email you'll use for price alerts." }) });

/** POST /api/pro/order { email } — creates a Razorpay order for Techify Pro. */
export async function POST(request: Request) {
  // Logged in: Pro goes on the account and its email, whatever the form sent.
  const user = await getCurrentUser();
  const parsed = bodySchema.safeParse(user ? { email: user.email } : await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    return Response.json(await createProOrder(parsed.data.email, user?.id), { status: 201 });
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      return Response.json({ error: error.message, code: "payments_not_configured" }, { status: 503 });
    }
    console.error("Razorpay order creation failed", error);
    return Response.json({ error: "Razorpay couldn't start the payment. Try again in a minute." }, { status: 502 });
  }
}
