import { z } from "zod";
import { zodMessage } from "@/lib/query";
import { createProOrder, PaymentsNotConfiguredError } from "@/lib/server/pro";

const bodySchema = z.object({ email: z.email({ error: "Enter the email you'll use for price alerts." }) });

/** POST /api/pro/order { email } — creates a Razorpay order for Techify Pro. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    return Response.json(await createProOrder(parsed.data.email), { status: 201 });
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      return Response.json({ error: error.message, code: "payments_not_configured" }, { status: 503 });
    }
    console.error("Razorpay order creation failed", error);
    return Response.json({ error: "Razorpay couldn't start the payment. Try again in a minute." }, { status: 502 });
  }
}
