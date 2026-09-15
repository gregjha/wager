/** Platform fee taken from each paid entry, in basis points (500 = 5%). */
export const PLATFORM_FEE_BPS = 500;

/** Stripe's minimum charge for USD. Paid matches must be at least this. */
export const MIN_ENTRY_FEE_CENTS = 100;
export const MAX_ENTRY_FEE_CENTS = 20_000;

export function platformFeeCents(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10_000);
}

export function formatCents(cents: number, currency = "usd"): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** "12.50" -> 1250. Returns NaN for malformed input so Zod can reject it. */
export function dollarsToCents(input: string): number {
  const trimmed = input.trim();
  if (trimmed === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return Number.NaN;
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
