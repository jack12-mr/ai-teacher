-- =============================================================================
-- 修复管理后台表的 RLS 和字段名问题
-- =============================================================================
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================================================

-- =====================
-- 1. 禁用 RLS（推荐方案）
-- =====================
-- 由于 admin_users 表只通过后端 Service Role Key 访问
-- 不需要 RLS 保护，直接禁用它
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config DISABLE ROW LEVEL SECURITY;

-- =====================
-- 如果你坚持使用 RLS，请执行以下替代方案：
-- =====================
-- 取消上面的 DISABLE 语句，改用下面的语句：

-- -- 为 service_role 创建完全访问策略
-- CREATE POLICY "Allow service role full access on admin_users"
-- ON public.admin_users
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Allow service role full access on system_logs"
-- ON public.system_logs
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Allow service role full access on system_config"
-- ON public.system_config
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- =====================
-- 2. 修复字段名（如果需要）
-- =====================
-- 注意：如果你已经按照之前的 SQL 创建了表，字段名可能是 password
-- 需要改为 password_hash 以匹配代码
DO $$
BEGIN
    -- 检查 password 列是否存在
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_users'
        AND column_name = 'password'
    ) THEN
        -- 重命名列为 password_hash
        ALTER TABLE public.admin_users RENAME COLUMN password TO password_hash;
        RAISE NOTICE '已将 password 列重命名为 password_hash';
    ELSE
        RAISE NOTICE 'password 列不存在，可能已经是 password_hash';
    END IF;
END $$;

-- =====================
-- 3. 插入/更新管理员账户
-- =====================
-- 删除旧的测试账户（如果存在）
DELETE FROM public.admin_users WHERE username = 'admin';

-- 使用 bcrypt 哈希密码 'admin123'（使用 gen_salt('bf') 生成）
INSERT INTO public.admin_users (username, password_hash, role, status)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'super_admin', 'active');

-- =====================
-- 4. 验证修复
-- =====================
-- 检查 RLS 状态
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('admin_users', 'system_logs', 'system_config');

-- 检查管理员账户
SELECT username, role, status FROM public.admin_users;

-- =====================
-- 完成！现在可以测试登录了
-- =====================
