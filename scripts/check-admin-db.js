/**
 * 检查 Supabase admin_users 表中的数据
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminDatabase() {
  console.log('========================================');
  console.log('检查管理员数据库');
  console.log('========================================');
  console.log('');

  // 1. 检查 admin_users 表
  console.log('1. 检查 admin_users 表:');
  const { data: adminUsers, error: adminError } = await supabase
    .from('admin_users')
    .select('*');

  if (adminError) {
    console.log('   ❌ 查询失败:', adminError.message);
    console.log('   错误代码:', adminError.code);
    console.log('   错误详情:', adminError.hint);
  } else {
    console.log('   ✓ 查询成功，找到', adminUsers.length, '个管理员账户');
    console.log('');

    adminUsers.forEach((admin, index) => {
      console.log('   管理员 #' + (index + 1) + ':');
      console.log('     - ID:', admin.id);
      console.log('     - 用户名:', admin.username);
      console.log('     - 角色:', admin.role);
      console.log('     - 状态:', admin.status);
      console.log('     - 密码哈希字段:', admin.password_hash ? '✓ 存在' : '✗ 不存在');
      console.log('     - 密码哈希值:', admin.password_hash ? admin.password_hash.substring(0, 20) + '...' : 'N/A');
      console.log('');
    });
  }

  // 2. 检查 RLS 状态
  console.log('2. 检查 RLS (行级安全) 状态:');
  const { data: rlsStatus, error: rlsError } = await supabase
    .rpc('get_rls_status', { table_name: 'admin_users' })
    .maybeSingle();

  // 如果 RPC 不存在，用另一种方式检查
  if (rlsError) {
    console.log('   ℹ️  无法通过 RPC 检查 RLS 状态');
    console.log('   请在 Supabase SQL Editor 中运行:');
    console.log('   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = \'admin_users\';');
  } else {
    console.log('   RLS 状态:', rlsStatus);
  }
  console.log('');

  // 3. 测试密码验证
  if (adminUsers && adminUsers.length > 0) {
    const bcrypt = require('bcryptjs');
    const testPassword = 'admin123';

    console.log('3. 测试密码验证:');
    adminUsers.forEach(async (admin) => {
      if (admin.password_hash) {
        const isValid = await bcrypt.compare(testPassword, admin.password_hash);
        console.log('   用户:', admin.username);
        console.log('   密码 "admin123" 验证:', isValid ? '✓ 正确' : '✗ 错误');
        console.log('');
      }
    });
  }

  console.log('========================================');
  console.log('诊断完成');
  console.log('========================================');
}

checkAdminDatabase().catch(console.error);
