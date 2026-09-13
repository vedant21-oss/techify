import "server-only";
import Razorpay from "razorpay";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/features/alerts";
import { isValidPaymentSignature, proPriceInr } from "@/lib/features/pro";

export class PaymentsNotConfiguredError extends Error {
  constructor() {
    super("Payments aren't set up on this server yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable Pro.");
  }
}

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new PaymentsNotConfiguredError();
  return { keyId, keySecret };
}

export function paymentsConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function isProMember(email: string): Promise<boolean> {
  const paid = await prisma.proPayment.findFirst({
    where: { email: normalizeEmail(email), status: "PAID" },
    select: { id: true },
  });
  return paid !== null;
}

/** Creates a Razorpay order and records it, returning what Checkout needs to open. */
export async function createProOrder(rawEmail: string) {
  const { keyId, keySecret } = credentials();
  const email = normalizeEmail(rawEmail);
  const amountPaise = proPriceInr() * 100;

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `pro_${Date.now()}`,
    notes: { email, product: "Techify Pro" },
  });

  await prisma.proPayment.create({
    data: { email, razorpayOrderId: order.id, amountPaise },
  });

  return { orderId: order.id, amountPaise, currency: "INR", keyId, email };
}

/** Marks an order paid only when Razorpay's signature verifies. */
export async function verifyProPayment(input: { orderId: string; paymentId: string; signature: string }) {
  const { keySecret } = credentials();
  const payment = await prisma.proPayment.findUnique({ where: { razorpayOrderId: input.orderId } });
  if (!payment) return { ok: false as const, error: "We couldn't find that order. Start the payment again." };
  if (payment.status === "PAID") return { ok: true as const, email: payment.email };

  if (!isValidPaymentSignature(input, keySecret)) {
    await prisma.proPayment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { ok: false as const, error: "The payment couldn't be verified, so Pro wasn't activated. You haven't been upgraded." };
  }

  await prisma.proPayment.update({
    where: { id: payment.id },
    data: { status: "PAID", razorpayPaymentId: input.paymentId, paidAt: new Date() },
  });
  return { ok: true as const, email: payment.email };
}
