export function isValidPaymentStats(stats: any): boolean {
  return !!(
    stats &&
    stats.byMethod &&
    typeof stats.byMethod.wechat === 'number' &&
    typeof stats.byMethod.alipay === 'number' &&
    typeof stats.byMethod.stripe === 'number' &&
    typeof stats.byMethod.paypal === 'number'
  );
}
