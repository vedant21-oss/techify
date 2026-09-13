export interface PricePointLike {
  price: number;
  recordedAt: Date;
}

export interface PriceSummary {
  current: number;
  /** The price before the most recent change, or null if it has never changed. */
  previous: number | null;
  /** Negative when the price dropped. */
  change: number;
  changePercent: number;
  lowest: number;
  highest: number;
  /** True when today's price is the lowest ever seen and it has been higher before. */
  isLowest: boolean;
  trackingSince: Date | null;
  points: number;
}

/**
 * Summarises a device's price history. Points are recorded only when the price
 * changes, so the most recent point normally equals the current price.
 */
export function summarizePrices(points: PricePointLike[], currentPrice: number): PriceSummary {
  const sorted = [...points].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const history = sorted.map((p) => p.price);
  if (history.at(-1) !== currentPrice) history.push(currentPrice);

  const previous = history.length >= 2 ? history[history.length - 2] : null;
  const change = previous === null ? 0 : currentPrice - previous;
  const lowest = Math.min(...history);
  const highest = Math.max(...history);

  return {
    current: currentPrice,
    previous,
    change,
    changePercent: previous ? Math.round((change / previous) * 1000) / 10 : 0,
    lowest,
    highest,
    isLowest: currentPrice === lowest && highest > currentPrice,
    trackingSince: sorted[0]?.recordedAt ?? null,
    points: history.length,
  };
}

/** A price drop worth listing on the deals page. */
export function isDeal(summary: PriceSummary, minDropPercent = 3): boolean {
  return summary.previous !== null && summary.changePercent <= -minDropPercent;
}
