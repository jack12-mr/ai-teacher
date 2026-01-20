/**
 * 测试密码哈希和验证逻辑
 * 用于调试 admin/admin123 登录问题
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testPasswordHash() {
  console.log('========================================');
  console.log('密码哈希测试');
  console.log('========================================\n');

  const testPassword = 'admin123';
  const testUsername = 'admin';

  // 1. 使用 bcryptjs 生成哈希（这是 Node.js 端使用的方法）
  console.log('1. 使用 bcryptjs 生成哈希（ rounds=10 ）:');
  const bcryptHash = await bcrypt.hash(testPassword, 10);
  console.log('   哈希值:', bcryptHash);
  console.log('   哈希长度:', bcryptHash.length);
  console.log('');

  // 2. 验证 bcrypt.compare 是否工作
  console.log('2. 验证 bcrypt.compare 功能:');
  const isValid = await bcrypt.compare(testPassword, bcryptHash);
  console.log('   bcrypt.compare("admin123", hash):', isValid);
  console.log('');

  // 3. 连接数据库，获取存储的管理员密码
  console.log('3. 从数据库获取管理员账户:');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', testUsername)
    .single();

  if (error) {
    console.log('   ❌ 错误:', error.message);
    console.log('   错误代码:', error.code);
    console.log('   错误详情:', error.details);
    console.log('   错误提示:', error.hint);
    console.log('');
    console.log('可能原因：');
    console.log('1. admin_users 表不存在，请先运行 SQL 迁移');
    console.log('2. 管理员账户未创建');
    return;
  }

  console.log('   ✓ 找到管理员账户');
  console.log('   完整数据:', JSON.stringify(admin, null, 2));
  console.log('');

  if (!admin) {
    console.log('   ❌ 管理员账户不存在');
    return;
  }

  console.log('   用户名:', admin.username);
  console.log('   角色:', admin.role);
  console.log('   状态:', admin.status);

  if (!admin.password) {
    console.log('   ⚠️  密码字段为空或未返回！');
    console.log('');
    console.log('   这可能是因为：');
    console.log('   1. RLS（行级安全）策略阻止了 password 字段的访问');
    console.log('   2. 表结构中没有 password 字段');
    console.log('   3. 查询时没有明确选择 password 字段');
    console.log('');
    console.log('   尝试重新查询，明确指定字段...');

    const { data: admin2, error: error2 } = await supabase
      .from('admin_users')
      .select('id, username, password, role, status')
      .eq('username', testUsername)
      .single();

    if (error2) {
      console.log('   ❌ 重新查询失败:', error2.message);
    } else {
      console.log('   ✓ 重新查询成功');
      console.log('   数据:', JSON.stringify(admin2, null, 2));
      if (admin2.password) {
        console.log('   密码哈希:', admin2.password);
        console.log('   哈希长度:', admin2.password.length);
        admin.password = admin2.password;
      }
    }
  } else {
    console.log('   密码哈希:', admin.password);
    console.log('   哈希长度:', admin.password.length);
  }
  console.log('');

  // 4. 测试密码验证
  console.log('4. 测试密码验证:');
  if (!admin.password) {
    console.log('   ❌ 无法测试密码验证：password 字段为空');
    console.log('');
    console.log('========================================');
    console.log('问题诊断');
    console.log('========================================');
    console.log('');
    console.log('核心问题：数据库查询返回的数据中 password 字段为空！');
    console.log('');
    console.log('可能的原因：');
    console.log('1. Supabase RLS（行级安全）策略阻止了 password 字段的访问');
    console.log('   - 即使使用 service_role_key，RLS 仍然可能生效');
    console.log('   - 需要检查 admin_users 表的 RLS 策略');
    console.log('');
    console.log('2. 表结构问题');
    console.log('   - admin_users 表可能没有 password 字段');
    console.log('   - 或者字段名不是 "password"');
    console.log('');
    console.log('建议的解决步骤：');
    console.log('1. 登录 Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. 进入 SQL Editor');
    console.log('3. 运行以下 SQL 禁用 admin_users 表的 RLS：');
    console.log('   ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('4. 或者修改 RLS 策略，允许 service_role 访问所有字段：');
    console.log('   CREATE POLICY "Allow service role full access"');
    console.log('   ON public.admin_users');
    console.log('   TO service_role');
    console.log('   USING (true)');
    console.log('   WITH CHECK (true);');
    console.log('');
    console.log('5. 检查表结构：');
    console.log('   SELECT column_name, data_type');
    console.log('   FROM information_schema.columns');
    console.log('   WHERE table_name = \'admin_users\';');
    return;
  }

  const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
  console.log('   bcrypt.compare("admin123", 存储的哈希):', isPasswordValid);
  console.log('');

  // 5. 分析哈希格式
  console.log('5. 分析哈希格式:');
  console.log('   存储的哈希前缀:', admin.password.substring(0, 10));
  console.log('   bcryptjs 生成的哈希前缀:', bcryptHash.substring(0, 10));
  console.log('');

  // 6. 检查哈希算法
  console.log('6. 哈希算法识别:');
  if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
    console.log('   ✓ 这是 bcrypt 格式（与 Node.js bcryptjs 兼容）');
  } else if (admin.password.startsWith('$2y$')) {
    console.log('   ⚠️  这是 PHP bcrypt 格式（$2y$）');
    console.log('   PHP 的 $2y$ 和 Node.js 的 $2a$/$2b$ 理论上兼容');
  } else {
    console.log('   ❌ 未知格式！');
  }
  console.log('');

  // 7. 如果密码验证失败，尝试重新创建管理员
  if (!isPasswordValid) {
    console.log('7. 密码验证失败，可能的原因：');
    console.log('   - 密码在数据库中使用不同的算法创建');
    console.log('   - PostgreSQL 的 crypt() 函数生成的哈希与 bcryptjs 不兼容');
    console.log('');
    console.log('建议解决方案：');
    console.log('运行以下脚本重新创建管理员账户：');
    console.log('  node scripts/create-admin-simple.js');
    console.log('或使用 TypeScript 版本：');
    console.log('  npm run create-admin -- -u admin -p admin123 --force');
  } else {
    console.log('7. ✓ 密码验证成功！');
    console.log('   问题可能在其他地方，请检查：');
    console.log('   - Session 管理');
    console.log('   - 中间件配置');
    console.log('   - 数据库连接');
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================\n');
}

testPasswordHash().catch(console.error);
