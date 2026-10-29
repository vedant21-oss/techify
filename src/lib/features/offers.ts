/*
 * Card offers and EMI: what a device actually costs with a given bank card, and
 * what that works out to per month.
 *
 * Offers are entered by hand in the admin dashboard (stores don't publish them in a
 * form we can read), so everything here works from a plain list of offers. One
 * offer applies per purchase, as at the stores themselves: the biggest discount the
 * buyer's card qualifies for wins, and offers never stack.
 */

export const BANKS = [
  { id: "hdfc", name: "HDFC Bank" },
  { id: "icici", name: "ICICI Bank" },
  { id: "sbi", name: "SBI Card" },
  { id: "axis", name: "Axis Bank" },
  { id: "kotak", name: "Kotak Mahindra Bank" },
  { id: "idfc", name: "IDFC FIRST Bank" },
  { id: "bob", name: "Bank of Baroda" },
  { id: "au", name: "AU Small Finance Bank" },
  { id: "hsbc", name: "HSBC" },
  { id: "amex", name: "American Express" },
  { id: "onecard", name: "OneCard" },
  { id: "yes", name: "Yes Bank" },
  { id: "federal", name: "Federal Bank" },
  { id: "rbl", name: "RBL Bank" },
] as const;

export type BankId = (typeof BANKS)[number]["id"];
export type CardKind = "credit" | "debit";

export function isBankId(value: string): value is BankId {
  return BANKS.some((b) => b.id === value);
}

export function bankName(id: string): string {
  return BANKS.find((b) => b.id === id)?.name ?? id;
}

/** An instant discount at one store for one bank's cards. */
export interface CardOffer {
  id: string;
  bank: BankId;
  cardType: CardKind | "any";
  kind: "flat" | "percent";
  /** Rupees for a flat discount, percent for a percentage one. Zero for a no-cost-EMI-only offer. */
  amount: number;
  /** Cap on a percentage discount, in rupees. */
  maxDiscount: number | null;
  /** The discount only applies when the purchase is converted to EMI. */
  emiOnly: boolean;
  /** Longest no-cost EMI tenure the offer allows, in months. */
  noCostEmiMonths: number | null;
  store: string;
  /** ISO timestamp; null when the offer has no published end date. */
  validUntil: string | null;
}

/** How the buyer will pay. Kept in the URL as `pay=hdfc-credit` or `pay=hdfc-credit-emi`. */
export interface Payment {
  bank: BankId;
  card: CardKind;
  emi: boolean;
}

export function encodePayment(payment: Payment | null): string | undefined {
  if (!payment) return undefined;
  return [payment.bank, payment.card, payment.emi ? "emi" : null].filter(Boolean).join("-");
}

/** Lenient: anything unrecognised means "no card chosen" rather than an error. */
export function decodePayment(value: string | undefined | null): Payment | null {
  if (!value) return null;
  const [bank, card, emi, ...rest] = value.toLowerCase().split("-");
  if (rest.length || !bank || !isBankId(bank)) return null;
  if (card !== "credit" && card !== "debit") return null;
  if (emi !== undefined && emi !== "emi") return null;
  return { bank, card, emi: emi === "emi" };
}

export function isOfferActive(offer: Pick<CardOffer, "validUntil">, now: Date): boolean {
  return offer.validUntil === null || new Date(offer.validUntil).getTime() > now.getTime();
}

export function offerApplies(offer: CardOffer, payment: Payment, now: Date): boolean {
  return (
    offer.bank === payment.bank &&
    (offer.cardType === "any" || offer.cardType === payment.card) &&
    (!offer.emiOnly || payment.emi) &&
    isOfferActive(offer, now)
  );
}

/** Rupees off `price`. A discount never takes the price below zero. */
export function offerDiscount(offer: Pick<CardOffer, "kind" | "amount" | "maxDiscount">, price: number): number {
  const raw = offer.kind === "flat" ? offer.amount : Math.floor((price * offer.amount) / 100);
  const capped = offer.kind === "percent" && offer.maxDiscount !== null ? Math.min(raw, offer.maxDiscount) : raw;
  return Math.max(0, Math.min(price, capped));
}

/** What the buyer pays with their card, and which offer got them there. */
export interface PaymentQuote {
  listPrice: number;
  price: number;
  discount: number;
  offer: CardOffer | null;
  /** Longest no-cost EMI any qualifying offer allows; null when paying in full or none does. */
  noCostEmiMonths: number | null;
}

export function quotePrice(listPrice: number, offers: CardOffer[], payment: Payment, now: Date): PaymentQuote {
  const qualifying = offers.filter((o) => offerApplies(o, payment, now));
  let best: CardOffer | null = null;
  let discount = 0;
  for (const offer of qualifying) {
    const d = offerDiscount(offer, listPrice);
    if (d > discount) {
      best = offer;
      discount = d;
    }
  }
  const noCost = payment.emi
    ? Math.max(0, ...qualifying.map((o) => o.noCostEmiMonths ?? 0)) || null
    : null;
  return { listPrice, price: listPrice - discount, discount, offer: best, noCostEmiMonths: noCost };
}

/** One-line description of an offer's discount, e.g. "₹4,000 off" or "10% off up to ₹5,000". */
export function describeDiscount(offer: Pick<CardOffer, "kind" | "amount" | "maxDiscount">, formatPrice: (n: number) => string): string | null {
  if (offer.amount <= 0) return null;
  if (offer.kind === "flat") return `${formatPrice(offer.amount)} off`;
  return offer.maxDiscount !== null ? `${offer.amount}% off up to ${formatPrice(offer.maxDiscount)}` : `${offer.amount}% off`;
}

// ---- EMI ---------------------------------------------------------------------------

/** Tenures Indian card issuers commonly offer, in months. */
export const EMI_TENURES = [3, 6, 9, 12, 18, 24] as const;

/** Typical credit-card EMI interest, % per year. Issuers charge roughly 13–16%. */
export const DEFAULT_EMI_RATE = 15;

/** Default tenure used where only one EMI figure fits, such as a results card. */
export const DEFAULT_EMI_MONTHS = 12;

/** GST charged on the interest part of every card EMI. */
export const GST_ON_INTEREST = 0.18;

export interface EmiPlan {
  months: number;
  monthly: number;
  /** Interest the bank charges over the whole tenure. */
  interest: number;
  gst: number;
  /** Everything paid: instalments plus GST. */
  total: number;
  /** True when the store absorbs the interest as an upfront discount. */
  noCost: boolean;
}

/** Monthly factor of a reducing-balance loan: instalment = principal × factor. */
function annuityFactor(annualRatePct: number, months: number): number {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return 1 / months;
  const growth = (1 + r) ** months;
  return (r * growth) / (growth - 1);
}

/** A standard card EMI at `annualRatePct`, reducing balance, with GST on the interest. */
export function emiPlan(principal: number, annualRatePct: number, months: number): EmiPlan {
  const monthly = principal * annuityFactor(annualRatePct, months);
  const interest = monthly * months - principal;
  const gst = interest * GST_ON_INTEREST;
  return {
    months,
    monthly: Math.round(monthly),
    interest: Math.round(interest),
    gst: Math.round(gst),
    total: Math.round(monthly * months + gst),
    noCost: false,
  };
}

/**
 * No-cost EMI: the store knocks the bank's interest off the price up front, so the
 * instalments add up to the price. The bank still charges that interest, and GST on
 * it, which is what "no cost" leaves out.
 */
export function noCostEmiPlan(price: number, annualRatePct: number, months: number): EmiPlan {
  const discounted = price / (annuityFactor(annualRatePct, months) * months);
  const interest = price - discounted;
  const gst = interest * GST_ON_INTEREST;
  return {
    months,
    monthly: Math.round(price / months),
    interest: Math.round(interest),
    gst: Math.round(gst),
    total: Math.round(price + gst),
    noCost: true,
  };
}

/** The plan a buyer gets: no-cost when the tenure is within what their offer allows. */
export function planFor(price: number, months: number, noCostEmiMonths: number | null, annualRatePct = DEFAULT_EMI_RATE): EmiPlan {
  return noCostEmiMonths !== null && months <= noCostEmiMonths
    ? noCostEmiPlan(price, annualRatePct, months)
    : emiPlan(price, annualRatePct, months);
}
