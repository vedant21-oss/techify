import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

export const DEFAULT_PRO_PRICE_INR = 99;

export function proPriceInr(env: Record<string, string | undefined> = process.env): number {
  const parsed = Number(env.TECHIFY_PRO_PRICE_INR);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PRO_PRICE_INR;
}

/**
 * Razorpay signs `order_id|payment_id` with the key secret. Only a payment whose
 * signature checks out may mark an order as paid.
 */
export function isValidPaymentSignature(
  { orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string },
  keySecret: string,
): boolean {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  try {
    return validatePaymentVerification({ order_id: orderId, payment_id: paymentId }, signature, keySecret);
  } catch {
    return false;
  }
}
