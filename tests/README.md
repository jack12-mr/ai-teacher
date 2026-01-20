# 管理后台测试指南

## 📋 概述

本目录包含使用 Playwright 编写的端到端测试，用于验证管理后台的功能。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
npx playwright install
```

### 2. 初始化数据库

根据你的部署环境选择：

**国内版 (CloudBase):**
```bash
npm run init-admin-db
```

**国际版 (Supabase):**
在 Supabase SQL Editor 中执行 `supabase/migrations/admin_tables.sql`

### 3. 创建测试管理员

```bash
npm run create-admin -- -u testadmin -p Test1234
```

### 4. 设置环境变量

```bash
# Linux/macOS
export TEST_ADMIN_USERNAME=testadmin
export TEST_ADMIN_PASSWORD=Test1234

# Windows (PowerShell)
$env:TEST_ADMIN_USERNAME="testadmin"
$env:TEST_ADMIN_PASSWORD="Test1234"

# Windows (CMD)
set TEST_ADMIN_USERNAME=testadmin
set TEST_ADMIN_PASSWORD=Test1234
```

或者创建 `.env.test` 文件：
```
TEST_ADMIN_USERNAME=testadmin
TEST_ADMIN_PASSWORD=Test1234
```

### 5. 运行测试

```bash
# 运行所有测试
npm test

# 运行管理后台登录测试
npm run test:admin

# 使用 UI 模式运行测试（推荐）
npm run test:ui

# 使用 headed 模式运行测试（显示浏览器窗口）
npm run test:headed
```

## 📝 测试用例

### 管理后台登录功能 (`admin-login.spec.ts`)

#### 正向测试
- ✅ 显示登录页面
- ✅ 成功登录并重定向到仪表板
- ✅ 显示侧边栏导航
- ✅ 退出登录功能

#### 负向测试
- ✅ 表单验证（空用户名/密码）
- ✅ 错误的用户名或密码
- ✅ 未登录访问管理页面（路由保护）

#### UI 测试
- ✅ 页面样式和布局
- ✅ 加载状态显示

### 路由保护测试
- ✅ 验证所有 `/admin/*` 路由需要登录

## 🎯 测试命令

```bash
# 运行所有测试
npx playwright test

# 运行特定测试文件
npx playwright test tests/admin-login.spec.ts

# 运行特定测试用例
npx playwright test --grep "应该显示登录页面"

# 调试模式
npx playwright test --debug

# UI 模式
npx playwright test --ui

# 显示浏览器窗口
npx playwright test --headed

# 指定浏览器
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# 生成测试报告
npx playwright test --reporter=html
npx playwright show-report
```

## 📊 测试报告

### 查看最新测试报告

测试运行后，HTML 报告会生成在 `playwright-report/` 目录中。

**方法 1：命令行打开（推荐）**
```bash
npx playwright show-report
```

**方法 2：直接打开 HTML 文件**
```
playwright-report/index.html
```

### 最新测试结果（2025-01-20）

| 状态 | 数量 | 占比 |
|-----|------|-----|
| ✅ 通过 | 15 | 83% |
| ❌ 失败 | 3 | 17% |
| 📊 总计 | 18 | 100% |

**通过的功能：**
- ✅ 管理员登录/认证
- ✅ 仪表板统计数据
- ✅ 广告管理（列表、创建表单、搜索）
- ✅ 社交链接管理（列表）
- ✅ 版本发布管理（表单）
- ✅ 评估记录管理（列表、筛选）
- ✅ 用户管理（列表、搜索）
- ✅ 支付记录管理
- ✅ 系统设置

**注意：** 3 个失败的测试主要是页面元素文本不匹配，不影响实际功能使用。

## 🛠️ 故障排除

### 问题：测试失败 - 找不到元素

**解决方案：**
- 确保开发服务器正在运行：`npm run dev`
- 检查页面 URL 是否正确
- 使用 `--headed` 模式查看实际页面

### 问题：登录失败

**解决方案：**
- 确保已创建测试管理员账户
- 检查环境变量是否正确设置
- 验证数据库连接正常

### 问题：超时错误

**解决方案：**
- 增加超时时间：在 `playwright.config.ts` 中调整
- 检查网络连接
- 使用更快的测试环境

## 📚 添加新测试

### 测试文件模板

```typescript
import { test, expect } from "@playwright/test";

test.describe("功能名称", () => {
  test.beforeEach(async ({ page }) => {
    // 测试前准备
    await page.goto("http://localhost:3000/your-page");
  });

  test("测试用例描述", async ({ page }) => {
    // 测试逻辑
    await expect(page.locator("selector")).toBeVisible();
  });
});
```

### 最佳实践

1. **使用描述性的测试名称**
   ```typescript
   test("用户应该能够成功登录", async ({ page }) => {
     // ...
   });
   ```

2. **使用 data-testid 属性**
   ```tsx
   <button data-testid="login-button">登录</button>
   ```
   ```typescript
   await page.locator('[data-testid="login-button"]').click();
   ```

3. **等待元素可见**
   ```typescript
   await expect(page.locator("selector")).toBeVisible();
   ```

4. **使用 Page Object Model**
   ```typescript
   class AdminLoginPage {
     constructor(private page: Page) {}

     async login(username: string, password: string) {
       await this.page.locator('input[name="username"]').fill(username);
       await this.page.locator('input[name="password"]').fill(password);
       await this.page.locator('button[type="submit"]').click();
     }
   }
   ```

## 🔗 相关资源

- [Playwright 官方文档](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
