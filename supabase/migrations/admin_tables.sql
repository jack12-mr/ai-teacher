-- =============================================================================
-- 管理后台数据库初始化脚本 (Supabase/PostgreSQL)
-- =============================================================================
-- 此脚本创建管理后台所需的数据库表
-- 运行方式：在 Supabase SQL Editor 中执行
-- =============================================================================

-- =====================
-- 0. 启用加密扩展
-- =====================
create extension if not exists pgcrypto;

-- =====================
-- 1. 创建管理员表
-- =====================
create table if not exists public.admin_users (
  id uuid default gen_random_uuid() primary key,
  username text not null unique,
  password text not null,
  role text check (role in ('admin', 'super_admin')) default 'admin',
  status text check (status in ('active', 'disabled')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login_at timestamptz,
  created_by uuid references public.admin_users(id)
);

-- 创建索引
create index if not exists idx_admin_users_username on public.admin_users(username);
create index if not exists idx_admin_users_status on public.admin_users(status);
create index if not exists idx_admin_users_role on public.admin_users(role);

-- =====================
-- 2. 创建操作日志表
-- =====================
create table if not exists public.system_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  admin_username text not null,
  action text not null,
  resource_type text,
  resource_id uuid,
  details jsonb default '{}',
  ip_address text,
  user_agent text,
  status text check (status in ('success', 'failure')) default 'success',
  error_message text,
  created_at timestamptz default now()
);

-- 创建索引
create index if not exists idx_system_logs_admin_id on public.system_logs(admin_id);
create index if not exists idx_system_logs_action on public.system_logs(action);
create index if not exists idx_system_logs_resource_type on public.system_logs(resource_type);
create index if not exists idx_system_logs_created_at on public.system_logs(created_at desc);

-- =====================
-- 3. 创建系统配置表
-- =====================
create table if not exists public.system_config (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  value jsonb not null,
  description text,
  category text not null,
  updated_at timestamptz default now()
);

-- 创建索引
create index if not exists idx_system_config_key on public.system_config(key);
create index if not exists idx_system_config_category on public.system_config(category);

-- =====================
-- 4. 行级安全配置 (RLS)
-- =====================
-- 管理员表：开启 RLS 但不创建任何策略
-- 效果：前端 API (Anon Key) 无法访问，只有后端代码 (Service Role Key) 可以访问
alter table public.admin_users enable row level security;

-- 日志表：开启 RLS 但不创建任何策略
alter table public.system_logs enable row level security;

-- 配置表：开启 RLS 但不创建任何策略
alter table public.system_config enable row level security;

-- =====================
-- 5. 创建更新时间触发器
-- =====================
-- 管理员表更新时间触发器
create or replace function update_admin_users_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_admin_users_updated_at on public.admin_users;
create trigger trigger_update_admin_users_updated_at
  before update on public.admin_users
  for each row
  execute function update_admin_users_updated_at();

-- 配置表更新时间触发器
create or replace function update_system_config_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_system_config_updated_at on public.system_config;
create trigger trigger_update_system_config_updated_at
  before update on public.system_config
  for each row
  execute function update_system_config_updated_at();

-- =====================
-- 6. 插入初始配置
-- =====================
insert into public.system_config (key, value, description, category)
values
  ('site_name', '"AI Teacher"', '网站名称', 'general'),
  ('site_description', '"AI 驱动的智能教学平台"', '网站描述', 'general'),
  ('maintenance_mode', 'false', '维护模式', 'general'),
  ('max_free_assessments', '3', '免费用户最大评估次数', 'ai'),
  ('admin_email', '""', '管理员邮箱', 'notification')
on conflict (key) do nothing;

-- =====================
-- 注意事项
-- =====================
-- 1. 初始管理员账户需要使用 create-admin.ts 脚本创建
-- 2. 不要直接在此脚本中插入管理员账户（密码安全性）
-- 3. 运行此脚本后，执行: npm run create-admin
-- =============================================================================
