import { z } from "zod";
import { EMI_TENURES, isBankId } from "./offers";

/*
 * Validation for the admin "add an offer" form. Kept apart from ./offers, which the
 * browser loads, so zod stays out of the client bundle.
 */

const optionalInt = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/[^\d]/g, "") : v),
  z.union([z.literal("").transform(() => null), z.coerce.number().int().nonnegative()]),
);

/** The admin "add an offer" form, as submitted. Amounts arrive as typed, commas and all. */
export const offerFormSchema = z
  .object({
    slug: z.string().min(1, "Pick a device."),
    bank: z.string().refine(isBankId, "Pick a bank."),
    cardType: z.enum(["ANY", "CREDIT", "DEBIT"]),
    kind: z.enum(["FLAT", "PERCENT"]),
    amount: optionalInt.transform((v) => v ?? 0),
    maxDiscount: optionalInt,
    emiOnly: z.literal("on").optional().transform(Boolean),
    noCostEmiMonths: optionalInt.refine((v) => v === null || (EMI_TENURES as readonly number[]).includes(v), "Pick a listed tenure."),
    store: z.string().trim().min(2, "Name the store.").max(60),
    validUntil: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  })
  .refine((o) => o.amount > 0 || o.noCostEmiMonths !== null, { message: "Give a discount, a no-cost EMI tenure, or both." })
  .refine((o) => o.kind === "FLAT" ? o.amount <= 100_000 : o.amount <= 50, {
    message: "A flat discount tops out at ₹1,00,000 and a percentage at 50%.",
  });
