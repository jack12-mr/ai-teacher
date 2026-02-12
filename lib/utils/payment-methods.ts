import { RegionConfig } from "@/lib/config/region";

/**
 * 获取当前环境支持的支付方式
 */
export function getAvailablePaymentMethods(): string[] {
  return RegionConfig.payment.methods;
}

/**
 * 检查支付方式是否在当前环境可用
 */
export function isPaymentMethodAvailable(method: string): boolean {
  return RegionConfig.payment.methods.includes(method);
}

/**
 * 获取支付方式显示配置
 */
export function getPaymentMethodConfig(method: string) {
  const configs: Record<string, { label: string; color: string; icon: string }> = {
    wechat: { label: "微信支付", color: "bg-green-600", icon: "💚" },
    alipay: { label: "支付宝", color: "bg-blue-600", icon: "💙" },
    stripe: { label: "Stripe", color: "bg-purple-600", icon: "💳" },
    paypal: { label: "PayPal", color: "bg-yellow-600", icon: "🅿️" },
  };
  return configs[method] || { label: method, color: "bg-gray-600", icon: "💰" };
}

/**
 * 获取当前环境的货币
 */
export function getCurrentCurrency(): string {
  return RegionConfig.payment.currency;
}
