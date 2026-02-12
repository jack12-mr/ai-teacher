/**
 * 检查 Supabase 支付数据的原始值
 * 使用方法: npx tsx scripts/check-supabase-payments-raw.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { getSupabaseAdmin } from '../lib/integrations/supabase-admin';

// 加载 .env.local 文件
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkSupabasePaymentsRaw() {
  console.log('\n========== Supabase 支付数据原始值检查 ==========\n');

  try {
    const supabase = getSupabaseAdmin();

    // 直接查询 payments 表
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }

    console.log(`📊 已支付订单总数: ${payments?.length || 0}\n`);

    if (!payments || payments.length === 0) {
      console.log('没有找到已支付的订单');
      return;
    }

    // 按支付方式分组
    const stripePayments = payments.filter(p => p.method === 'stripe' || p.payment_method === 'stripe');
    const paypalPayments = payments.filter(p => p.method === 'paypal' || p.payment_method === 'paypal');

    console.log('========== 所有支付记录详情 ==========\n');

    payments.forEach((payment, index) => {
      console.log(`订单 ${index + 1}:`);
      console.log(`  ID: ${payment.id}`);
      console.log(`  订单号: ${payment.order_id || payment.payment_id || 'N/A'}`);
      console.log(`  用户ID: ${payment.user_id || 'N/A'}`);
      console.log(`  原始金额值: ${payment.amount}`);
      console.log(`  金额（除以100）: $${((payment.amount || 0) / 100).toFixed(2)}`);
      console.log(`  金额（不除以100）: $${(payment.amount || 0).toFixed(2)}`);
      console.log(`  货币: ${payment.currency || 'N/A'}`);
      console.log(`  支付方式: ${payment.method || payment.payment_method || 'N/A'}`);
      console.log(`  状态: ${payment.status}`);
      console.log(`  创建时间: ${payment.created_at}`);
      console.log('');
    });

    // 计算总金额（两种方式）
    const totalAmountDivided = payments.reduce((sum, p) => sum + ((p.amount || 0) / 100), 0);
    const totalAmountRaw = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const stripeTotalDivided = stripePayments.reduce((sum, p) => sum + ((p.amount || 0) / 100), 0);
    const stripeTotalRaw = stripePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const paypalTotalDivided = paypalPayments.reduce((sum, p) => sum + ((p.amount || 0) / 100), 0);
    const paypalTotalRaw = paypalPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    console.log('\n========== 统计对比 ==========\n');

    console.log('方式1：金额除以100（假设存储单位是分）');
    console.log(`  Stripe: ${stripePayments.length} 笔, $${stripeTotalDivided.toFixed(2)}`);
    console.log(`  PayPal: ${paypalPayments.length} 笔, $${paypalTotalDivided.toFixed(2)}`);
    console.log(`  总计: $${totalAmountDivided.toFixed(2)}\n`);

    console.log('方式2：金额不除以100（假设存储单位是元）');
    console.log(`  Stripe: ${stripePayments.length} 笔, $${stripeTotalRaw.toFixed(2)}`);
    console.log(`  PayPal: ${paypalPayments.length} 笔, $${paypalTotalRaw.toFixed(2)}`);
    console.log(`  总计: $${totalAmountRaw.toFixed(2)}\n`);

    console.log('后台显示的数据（从截图）:');
    console.log('  Stripe: $99.98');
    console.log('  PayPal: $44.91');
    console.log('  总计: $144.89\n');

    console.log('💡 分析:');
    if (Math.abs(totalAmountRaw - 144.89) < 1) {
      console.log('   ✅ 后台显示的金额与"不除以100"的结果接近');
      console.log('   ⚠️  这说明后台统计逻辑可能没有正确处理金额单位');
      console.log('   ⚠️  数据库中存储的可能已经是"分"，但后台当作"元"来显示了');
    } else if (Math.abs(totalAmountDivided - 144.89) < 1) {
      console.log('   ✅ 后台显示的金额与"除以100"的结果接近');
      console.log('   ✅ 后台统计逻辑正确');
    } else {
      console.log('   ⚠️  后台显示的金额与两种计算方式都不匹配');
      console.log('   ⚠️  可能存在其他问题');
    }

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }
}

async function main() {
  console.log('🔍 开始检查 Supabase 支付数据原始值...\n');

  await checkSupabasePaymentsRaw();

  console.log('\n\n✅ 检查完成！\n');
}

main().catch(console.error);
