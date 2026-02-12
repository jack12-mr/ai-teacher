/**
 * 修复支付记录与用户订阅状态不同步的问题
 * 使用方法: npx tsx scripts/fix-payment-subscription-sync.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { SupabaseAdminAdapter } from '../lib/admin/supabase-adapter';
import { getSupabaseAdmin } from '../lib/integrations/supabase-admin';

// 加载 .env.local 文件
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function fixSupabasePaymentSync() {
  console.log('\n========== 修复国际版支付数据同步 (Supabase) ==========\n');

  try {
    const adapter = new SupabaseAdminAdapter();
    const supabase = getSupabaseAdmin();

    // 获取所有已支付的订单
    const payments = await adapter.listPayments({ limit: 10000 });
    const paidPayments = payments.filter(p => p.status === 'paid');

    console.log(`📊 找到 ${paidPayments.length} 笔已支付订单\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const payment of paidPayments) {
      if (!payment.user_id) {
        console.log(`⚠️  订单 ${payment.id} 没有关联用户ID，跳过`);
        skippedCount++;
        continue;
      }

      // 获取用户信息
      const users = await adapter.listUsers({ limit: 10000 });
      const user = users.find(u => u.id === payment.user_id);

      if (!user) {
        console.log(`⚠️  订单 ${payment.id} 关联的用户 ${payment.user_id} 不存在，跳过`);
        skippedCount++;
        continue;
      }

      // 检查用户的订阅状态
      const currentPlan = user.subscription_plan || 'free';

      if (currentPlan !== 'free' && currentPlan !== '') {
        console.log(`✓ 用户 ${user.email} 的订阅状态已正确 (${currentPlan})，跳过`);
        skippedCount++;
        continue;
      }

      // 需要修复：用户有支付记录但订阅状态为 free
      console.log(`\n🔧 修复用户 ${user.email}:`);
      console.log(`   订单ID: ${payment.id}`);
      console.log(`   支付金额: $${((payment.amount || 0) / 100).toFixed(2)}`);
      console.log(`   支付方式: ${payment.method}`);

      // 确定订阅计划类型（默认为 monthly）
      const subscriptionPlan = 'monthly'; // 可以根据支付金额或其他字段判断

      try {
        // 更新 auth.users.user_metadata（这是国际版存储订阅信息的正确位置）
        const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            subscription_plan: subscriptionPlan,
            subscription_status: 'active',
          },
        });

        if (authError) {
          console.error(`   ❌ 更新 auth metadata 失败:`, authError.message);
          errorCount++;
          continue;
        }

        // 创建或更新订阅记录
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 默认30天

        const { error: subError } = await supabase.from('subscriptions').upsert({
          user_id: user.id,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          plan_type: subscriptionPlan,
        });

        if (subError) {
          console.error(`   ⚠️  更新 subscriptions 表失败:`, subError.message);
          // 不算作错误，因为主要目标已完成
        }

        console.log(`   ✅ 成功修复，订阅计划更新为: ${subscriptionPlan}`);
        fixedCount++;

      } catch (error: any) {
        console.error(`   ❌ 修复失败:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n\n========== 修复完成 ==========`);
    console.log(`✅ 成功修复: ${fixedCount} 个用户`);
    console.log(`⏭️  跳过: ${skippedCount} 个订单`);
    console.log(`❌ 失败: ${errorCount} 个订单`);

  } catch (error: any) {
    console.error('❌ 修复过程出错:', error.message);
  }
}

async function main() {
  console.log('🔧 开始修复支付数据同步问题...\n');

  await fixSupabasePaymentSync();

  console.log('\n\n✅ 所有修复任务完成！\n');
}

main().catch(console.error);
