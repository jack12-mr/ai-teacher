-- =============================================================================
-- 用户资料表 (profiles)
-- =============================================================================
-- 此表存储用户注册后的资料信息，用于后台管理系统的用户统计
-- 与 Supabase Auth 的 auth.users 表通过 id 关联
-- =============================================================================

-- =====================
-- 创建用户资料表
-- =====================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  display_name text,
  avatar text,
  role text check (role in ('user', 'admin')) default 'user',
  subscription_plan text check (subscription_plan in ('free', 'pro', 'enterprise')) default 'free',
  status text check (status in ('active', 'disabled', 'banned')) default 'active',
  region text check (region in ('CN', 'INTL')) default 'INTL',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login_at timestamptz,
  pro_expires_at timestamptz
);

-- =====================
-- 创建索引
-- =====================
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_subscription_plan on public.profiles(subscription_plan);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_region on public.profiles(region);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);
create index if not exists idx_profiles_last_login_at on public.profiles(last_login_at desc);

-- =====================
-- 创建更新时间触发器
-- =====================
create or replace function update_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_profiles_updated_at on public.profiles;
create trigger trigger_update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function update_profiles_updated_at();

-- =====================
-- 行级安全配置 (RLS)
-- =====================
-- 开启 RLS
alter table public.profiles enable row level security;

-- 允许所有用户读取自己的资料
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 允许所有用户插入自己的资料（注册时）
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 允许所有用户更新自己的资料
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 允许服务角色（Service Role）完全访问
create policy "Service role can do anything"
  on public.profiles
  for all
  using (auth.role() = 'service_role');

-- =====================
-- 注释
-- =====================
comment on table public.profiles is '用户资料表，存储用户注册后的信息';
comment on column public.profiles.id is '用户ID，关联 auth.users';
comment on column public.profiles.email is '用户邮箱';
comment on column public.profiles.name is '用户姓名';
comment on column public.profiles.display_name is '显示名称';
comment on column public.profiles.avatar is '头像URL';
comment on column public.profiles.role is '角色';
comment on column public.profiles.subscription_plan is '订阅计划';
comment on column public.profiles.status is '账户状态';
comment on column public.profiles.region is '地区';
comment on column public.profiles.created_at is '创建时间';
comment on column public.profiles.updated_at is '更新时间';
comment on column public.profiles.last_login_at is '最后登录时间';
comment on column public.profiles.pro_expires_at is '会员到期时间';
