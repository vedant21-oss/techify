import { z } from "zod";
import { zodMessage } from "@/lib/query";
import { PaymentsNotConfiguredError, verifyProPayment } from "@/lib/server/pro";

const bodySchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

/** POST /api/pro/verify — checks Razorpay's signature and activates Pro. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    const result = await verifyProPayment(parsed.data);
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ email: result.email, pro: true });
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      return Response.json({ error: error.message, code: "payments_not_configured" }, { status: 503 });
    }
    throw error;
  }
}
