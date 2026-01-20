-- =============================================================================
-- 修复管理员密码为 bcrypt 格式
-- =============================================================================
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================================================

-- 说明：
-- 代码使用 Node.js 的 bcryptjs 库验证密码
-- 生成的 bcrypt 哈希值（密码: admin123, rounds: 10）：
-- $2b$10$0B7I5qUWRnNmbeHkE385l.clBoB9DJ.uZGatJ1gJwfXMeEbIynAx2

-- 删除旧的管理员账户（如果存在）
DELETE FROM public.admin_users WHERE username = 'admin';

-- 插入新的管理员账户，使用正确的 bcrypt 哈希
INSERT INTO public.admin_users (id, username, password_hash, role, status)
VALUES (
  gen_random_uuid(),
  'admin',
  '$2b$10$0B7I5qUWRnNmbeHkE385l.clBoB9DJ.uZGatJ1gJwfXMeEbIynAx2',
  'super_admin',
  'active'
);

-- 验证插入结果
SELECT id, username, role, status, LEFT(password_hash, 30) as password_preview
FROM public.admin_users
WHERE username = 'admin';
