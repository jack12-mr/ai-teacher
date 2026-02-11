# 管理后台数据分离部署指南

## 概述

本项目支持国内版和国际版两套独立的管理后台部署，通过环境变量完全隔离数据统计。

## 配置文件

- `.env.cn` - 国内版配置（使用 CloudBase 数据库）
- `.env.intl` - 国际版配置（使用 Supabase 数据库）

## 部署步骤

### 1. 国内版部署

```bash
# 使用国内版配置
cp .env.cn .env.local

# 初始化管理员账号
npm run init-admin

# 启动应用
npm run dev
# 或生产环境
npm run build && npm start
```

部署到域名：https://morncoach.mornscience.top

### 2. 国际版部署

```bash
# 使用国际版配置
cp .env.intl .env.local

# 初始化管理员账号
npm run init-admin

# 启动应用
npm run dev
# 或生产环境
npm run build && npm start
```

部署到域名：https://mornhub.biz

## 管理员账号

两个版本的管理员账号信息：

- **用户名**: morncoach
- **密码**: Zyx!213416
- **角色**: super_admin

**重要提示**：
- 国内版的管理员账号存储在 CloudBase 数据库
- 国际版的管理员账号存储在 Supabase 数据库
- 两个版本的管理员账号是独立的，需要分别初始化

## 环境变量说明

### 关键环境变量

- `NEXT_PUBLIC_DEPLOYMENT_REGION`: 部署区域
  - `CN` - 国内版（使用 CloudBase）
  - `INTL` - 国际版（使用 Supabase）

## 调试日志

系统在关键位置添加了调试日志，方便排查问题：

- `[getDatabaseAdapter]` - 数据库适配器初始化
- `[adminLogin]` - 管理员登录流程
- `[adminLogout]` - 管理员登出流程
- `[changePassword]` - 修改密码流程
- `[initAdmin]` - 管理员账号初始化

## 常见问题

### 1. 登录失败

检查：
- 环境变量 `NEXT_PUBLIC_DEPLOYMENT_REGION` 是否正确设置
- 数据库连接配置是否正确
- 管理员账号是否已初始化
- 查看控制台日志中的 `[adminLogin]` 相关信息

### 2. 数据库连接失败

检查：
- 国内版：CloudBase 环境 ID、Secret ID、Secret Key 是否正确
- 国际版：Supabase URL、Anon Key、Service Role Key 是否正确
- 网络连接是否正常
- 查看控制台日志中的 `[getDatabaseAdapter]` 相关信息
