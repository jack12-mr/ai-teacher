export function isValidPaymentStats(stats: any): boolean {
  return !!(
    stats &&
    stats.byMethod &&
    typeof stats.byMethod === 'object' &&
    typeof stats.totalRevenue === 'number'
  );
}
