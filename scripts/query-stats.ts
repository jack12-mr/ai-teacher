/**
 * 查询国内版和国际版的数据统计
 * 使用方法: npx tsx scripts/query-stats.ts
 */

import { CloudBaseAdminAdapter } from '../lib/admin/cloudbase-adapter';
import { SupabaseAdminAdapter } from '../lib/admin/supabase-adapter';

async function queryCloudBaseStats() {
  console.log('\n========== 国内版数据 (CloudBase) ==========\n');

  try {
    const adapter = new CloudBaseAdminAdapter();

    // 查询用户数
    const users = await adapter.listUsers({ limit: 10000 });
    console.log(`📊 用户总数: ${users.length}`);

    const paidUsers = users.filter(u =>
      u.subscription_plan === 'yearly' ||
      u.subscription_plan === 'monthly' ||
      u.subscription_plan === 'enterprise'
    );
    console.log(`💎 付费用户: ${paidUsers.length}`);
    console.log(`🆓 免费用户: ${users.length - paidUsers.length}`);

    // 查询支付数据
    const payments = await adapter.listPayments({ limit: 10000 });
    const paidPayments = payments.filter(p => p.status === 'paid');

    console.log(`\n💰 支付统计:`);
    console.log(`总订单数: ${paidPayments.length}`);

    // 按支付方式统计
    const wechatPayments = paidPayments.filter(p => p.method === 'wechat');
    const alipayPayments = paidPayments.filter(p => p.method === 'alipay');

    const wechatTotal = wechatPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const alipayTotal = alipayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalRevenue = wechatTotal + alipayTotal;

    console.log(`\n微信支付:`);
    console.log(`  订单数: ${wechatPayments.length}`);
    console.log(`  金额: ¥${(wechatTotal / 100).toFixed(2)} CNY`);

    console.log(`\n支付宝:`);
    console.log(`  订单数: ${alipayPayments.length}`);
    console.log(`  金额: ¥${(alipayTotal / 100).toFixed(2)} CNY`);

    console.log(`\n总收入: ¥${(totalRevenue / 100).toFixed(2)} CNY`);

  } catch (error: any) {
    console.error('❌ 查询国内版数据失败:', error.message);
  }
}

async function querySupabaseStats() {
  console.log('\n\n========== 国际版数据 (Supabase) ==========\n');

  try {
    const adapter = new SupabaseAdminAdapter();

    // 查询用户数
    const users = await adapter.listUsers({ limit: 10000 });
    console.log(`📊 用户总数: ${users.length}`);

    const paidUsers = users.filter(u =>
      u.subscription_plan === 'yearly' ||
      u.subscription_plan === 'monthly' ||
      u.subscription_plan === 'enterprise'
    );
    console.log(`💎 付费用户: ${paidUsers.length}`);
    console.log(`🆓 免费用户: ${users.length - paidUsers.length}`);

    // 查询支付数据
    const payments = await adapter.listPayments({ limit: 10000 });
    const paidPayments = payments.filter(p => p.status === 'paid');

    console.log(`\n💰 支付统计:`);
    console.log(`总订单数: ${paidPayments.length}`);

    // 按支付方式统计
    const stripePayments = paidPayments.filter(p => p.method === 'stripe');
    const paypalPayments = paidPayments.filter(p => p.method === 'paypal');

    const stripeTotal = stripePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paypalTotal = paypalPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalRevenue = stripeTotal + paypalTotal;

    console.log(`\nStripe:`);
    console.log(`  订单数: ${stripePayments.length}`);
    console.log(`  金额: $${(stripeTotal / 100).toFixed(2)} USD`);

    console.log(`\nPayPal:`);
    console.log(`  订单数: ${paypalPayments.length}`);
    console.log(`  金额: $${(paypalTotal / 100).toFixed(2)} USD`);

    console.log(`\n总收入: $${(totalRevenue / 100).toFixed(2)} USD`);

  } catch (error: any) {
    console.error('❌ 查询国际版数据失败:', error.message);
  }
}

async function main() {
  console.log('🔍 开始查询数据...\n');

  await queryCloudBaseStats();
  await querySupabaseStats();

  console.log('\n\n✅ 查询完成！\n');
}

main().catch(console.error);
