/** Active (not yet triggered) alerts allowed per email on the free plan. */
export const FREE_ALERT_LIMIT = 3;
/** Targets below this share of the current price are almost certainly typos. */
export const MIN_TARGET_SHARE = 0.3;

export function alertLimit(isPro: boolean): number | null {
  return isPro ? null : FREE_ALERT_LIMIT;
}

export function canCreateAlert(activeAlerts: number, isPro: boolean, isUpdate: boolean): boolean {
  if (isPro || isUpdate) return true;
  return activeAlerts < FREE_ALERT_LIMIT;
}

/** Returns an error message for an unusable target, or null when it's fine. */
export function validateTargetPrice(target: number, currentPrice: number): string | null {
  if (!Number.isInteger(target) || target <= 0) return "Enter a target price in whole rupees.";
  if (target >= currentPrice) {
    return "Pick a price below what it costs today, or it would alert you straight away.";
  }
  if (target < currentPrice * MIN_TARGET_SHARE) {
    return `That's under ${Math.round(MIN_TARGET_SHARE * 100)}% of today's price. Double-check the number.`;
  }
  return null;
}

export interface AlertState {
  targetPrice: number;
  triggeredAt: Date | null;
  device: { price: number };
}

/** Alerts whose device now costs at or below the target and haven't been sent yet. */
export function dueAlerts<T extends AlertState>(alerts: T[]): T[] {
  return alerts.filter((a) => a.triggeredAt === null && a.device.price <= a.targetPrice);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
