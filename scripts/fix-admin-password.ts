/**
 * 修复管理员密码
 *
 * 生成正确的 bcrypt 哈希并更新数据库
 */

import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '../lib/integrations/supabase-admin';

async function fixAdminPassword() {
  const plainPassword = 'admin123';
  const username = 'admin';

  // 生成 bcrypt 哈希（rounds = 10）
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  console.log('用户名:', username);
  console.log('明文密码:', plainPassword);
  console.log('bcrypt 哈希:', passwordHash);

  // 连接 Supabase
  const supabase = getSupabaseAdmin();

  // 更新数据库中的密码
  const { data, error } = await supabase
    .from('admin_users')
    .update({ password_hash: passwordHash })
    .eq('username', username)
    .select();

  if (error) {
    console.error('更新密码失败:', error);
    process.exit(1);
  }

  console.log('密码更新成功！');
  console.log('更新后的用户记录:', data);

  // 验证密码
  const isValid = await bcrypt.compare(plainPassword, passwordHash);
  console.log('验证密码哈希:', isValid ? '✓ 正确' : '✗ 错误');
}

fixAdminPassword().catch(console.error);
