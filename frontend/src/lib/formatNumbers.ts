/**
 * Format a number with commas as thousands separators.
 * Example: 120000 -> "120,000"
 */
export function formatNumber(amount: number): string {
  return amount.toLocaleString("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
