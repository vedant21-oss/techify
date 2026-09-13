const inr = new Intl.NumberFormat("en-IN");

export function formatPrice(rupees: number): string {
  return `₹${inr.format(Math.round(rupees))}`;
}

/** Compact budget label: ₹85k, ₹1.2L. */
export function formatBudgetShort(rupees: number): string {
  if (rupees >= 100_000) {
    const lakhs = rupees / 100_000;
    return `₹${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)}L`;
  }
  return `₹${Math.round(rupees / 1000)}k`;
}

export function formatStorage(gb: number): string {
  return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;
}

export function formatNumber(value: number): string {
  return inr.format(value);
}

export function formatWeight(grams: number, unit: "kg" | "g"): string {
  return unit === "kg" ? `${(grams / 1000).toFixed(2)} kg` : `${grams} g`;
}
