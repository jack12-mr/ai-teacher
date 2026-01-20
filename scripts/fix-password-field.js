/**
 * 修复密码字段名问题
 * 将 password_hash 重命名为 password 以匹配代码
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixPasswordField() {
  console.log('========================================');
  console.log('修复密码字段名');
  console.log('========================================\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 方案1: 重命名列（推荐）
  console.log('方案1: 重命名列 password_hash -> password');
  console.log('SQL: ALTER TABLE public.admin_users RENAME COLUMN password_hash TO password;');
  console.log('');

  // 执行重命名
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: 'ALTER TABLE public.admin_users RENAME COLUMN password_hash TO password;'
  });

  if (error) {
    console.log('❌ 直接执行失败（可能没有 exec_sql 函数）');
    console.log('错误:', error.message);
    console.log('');
    console.log('请手动执行以下 SQL：');
    console.log('----------------------------------------');
    console.log('ALTER TABLE public.admin_users');
    console.log('RENAME COLUMN password_hash TO password;');
    console.log('----------------------------------------');
    console.log('');
    console.log('执行位置：');
    console.log('https://supabase.com/dashboard/project/hrcwybaukdyibnwayneq/sql');
    console.log('');
  } else {
    console.log('✓ 列重命名成功！');
  }

  // 验证修复
  console.log('验证修复结果...');
  const { data: admin, error: verifyError } = await supabase
    .from('admin_users')
    .select('id, username, password, role, status')
    .eq('username', 'admin')
    .single();

  if (verifyError) {
    console.log('❌ 验证失败:', verifyError.message);
    console.log('请确认上述 SQL 已手动执行');
  } else {
    console.log('✓ 验证成功！');
    console.log('管理员数据:', {
      username: admin.username,
      role: admin.role,
      status: admin.status,
      has_password: !!admin.password
    });
  }

  console.log('');
  console.log('========================================');
  console.log('修复完成');
  console.log('========================================');
  console.log('');
  console.log('后续步骤：');
  console.log('1. 如果自动执行失败，请手动运行上述 SQL');
  console.log('2. 刷新管理后台登录页面');
  console.log('3. 使用 admin/admin123 登录');
}

fixPasswordField().catch(console.error);
