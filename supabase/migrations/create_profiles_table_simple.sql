-- =============================================================================
-- 用户资料表 (profiles) - 简化版（参考模板项目 mvp_28-main）
-- =============================================================================
-- 此表存储用户注册后的资料信息，用于后台管理系统的用户统计
-- 与 Supabase Auth 的 auth.users 表通过 id 关联
-- =============================================================================

-- =====================
-- 删除旧表（如果存在）
-- =====================
drop table if exists public.profiles cascade;

-- =====================
-- 创建用户资料表（简化版）
-- =====================
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  email text,
  name text,
  display_name text,
  avatar text,
  region text default 'US',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint profiles_pkey primary key (id)
);

-- =====================
-- 创建索引
-- =====================
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_region on public.profiles(region);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- =====================
-- 行级安全配置 (RLS)
-- =====================
-- 开启 RLS
alter table public.profiles enable row level security;

-- 允许所有用户读取自己的资料
create policy "Users manage own profiles" on public.profiles for all using (auth.uid() = id);

-- 允许服务角色（Service Role）完全访问（重要！后台管理系统需要）
create policy "Service role can do anything" on public.profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- =====================
-- 注释
-- =====================
comment on table public.profiles is '用户资料表，存储用户注册后的信息';
comment on column public.profiles.id is '用户ID，关联 auth.users';
comment on column public.profiles.email is '用户邮箱';
comment on column public.profiles.name is '用户姓名';
comment on column public.profiles.display_name is '显示名称';
comment on column public.profiles.avatar is '头像URL';
comment on column public.profiles.region is '地区';
comment on column public.profiles.created_at is '创建时间';
comment on column public.profiles.updated_at is '更新时间';
