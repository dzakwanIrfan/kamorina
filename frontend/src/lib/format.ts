/**
 * Format number to Indonesian Rupiah currency
 */
export function formatCurrency(
  amount: number | string | null | undefined
): string {
  const num = toNumber(amount);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(
  amount: number | string | null | undefined
): string {
  const num = toNumber(amount);
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Convert Decimal string to number safely
 */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
