/**
 * 检查国内版支付数据
 * 使用方法: npx tsx scripts/check-cloudbase-payments.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { CloudBaseAdminAdapter } from '../lib/admin/cloudbase-adapter';

// 加载 .env.local 文件
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkCloudBasePayments() {
  console.log('\n========== 国内版支付数据检查 (CloudBase) ==========\n');

  try {
    const adapter = new CloudBaseAdminAdapter();

    // 获取所有支付记录
    const payments = await adapter.listPayments({ limit: 10000 });
    console.log(`📊 支付记录总数: ${payments.length}\n`);

    // 获取所有用户
    const users = await adapter.listUsers({ limit: 10000 });
    const userIdSet = new Set(users.map(u => u.id));

    // 分析支付记录
    const paidPayments = payments.filter(p => p.status === 'paid');
    const zeroAmountPayments = paidPayments.filter(p => (p.amount || 0) === 0);
    const orphanPayments = paidPayments.filter(p => p.user_id && !userIdSet.has(p.user_id));

    console.log(`✅ 已支付订单: ${paidPayments.length}`);
    console.log(`⚠️  金额为 0 的订单: ${zeroAmountPayments.length}`);
    console.log(`⚠️  未关联用户的订单: ${orphanPayments.length}\n`);

    // 详细列出金额为 0 的订单
    if (zeroAmountPayments.length > 0) {
      console.log('\n========== 金额为 0 的订单详情 ==========\n');
      zeroAmountPayments.forEach((payment, index) => {
        console.log(`订单 ${index + 1}:`);
        console.log(`  ID: ${payment.id}`);
        console.log(`  订单号: ${payment.order_id}`);
        console.log(`  用户ID: ${payment.user_id || '未关联'}`);
        console.log(`  金额: ¥${((payment.amount || 0) / 100).toFixed(4)}`);
        console.log(`  支付方式: ${payment.method}`);
        console.log(`  状态: ${payment.status}`);
        console.log(`  创建时间: ${payment.created_at}`);
        console.log(`  完成时间: ${payment.completed_at || '未完成'}\n`);
      });
    }

    // 详细列出未关联用户的订单
    if (orphanPayments.length > 0) {
      console.log('\n========== 未关联用户的订单详情 ==========\n');
      orphanPayments.forEach((payment, index) => {
        console.log(`订单 ${index + 1}:`);
        console.log(`  ID: ${payment.id}`);
        console.log(`  订单号: ${payment.order_id}`);
        console.log(`  用户ID: ${payment.user_id}`);
        console.log(`  金额: ¥${((payment.amount || 0) / 100).toFixed(4)}`);
        console.log(`  支付方式: ${payment.method}`);
        console.log(`  状态: ${payment.status}`);
        console.log(`  创建时间: ${payment.created_at}`);
        console.log(`  完成时间: ${payment.completed_at || '未完成'}\n`);
      });

      console.log('\n💡 建议: 这些订单关联的用户不存在，可能是:');
      console.log('   1. 测试订单使用了不存在的用户ID');
      console.log('   2. 用户在支付后被删除');
      console.log('   3. 数据迁移或清理过程中的遗留数据\n');
    }

    // 统计支付金额
    const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    console.log(`\n💰 总收入: ¥${(totalRevenue / 100).toFixed(4)} CNY`);

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }
}

async function main() {
  console.log('🔍 开始检查国内版支付数据...\n');

  await checkCloudBasePayments();

  console.log('\n\n✅ 检查完成！\n');
}

main().catch(console.error);
