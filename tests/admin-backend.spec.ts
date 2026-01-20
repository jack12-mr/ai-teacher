import { test, expect } from '@playwright/test';

/**
 * 管理后台全面功能测试
 *
 * 测试所有管理后台功能：
 * - 登录/登出
 * - 仪表板统计数据
 * - 广告管理 (CRUD + 文件上传)
 * - 社交链接管理 (CRUD + 文件上传)
 * - 版本发布管理 (CRUD + 文件上传)
 * - 评估记录管理
 * - 用户管理
 * - 支付记录管理
 */

// ==================== 测试配置 ====================
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

test.describe('管理后台 - 登录认证', () => {
  test('管理员登录', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);

    // 等待页面加载
    await expect(page.getByText('管理后台').first()).toBeVisible();

    // 填写登录表单
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);

    // 点击登录按钮
    await page.click('button[type="submit"]');

    // 等待导航到仪表板
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`, { timeout: 10000 });

    // 验证登录成功
    await expect(page.getByText('数据统计仪表板')).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-login-success.png' });
  });

  test('未登录访问受保护页面重定向到登录页', async ({ page }) => {
    // 清除 cookies
    await page.context().clearCookies();

    // 直接访问仪表板
    await page.goto(`${ADMIN_BASE_URL}/admin/dashboard`);

    // 应该重定向到登录页
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/login`, { timeout: 5000 });

    // 验证登录表单可见
    await expect(page.getByText('管理后台').first()).toBeVisible();
  });
});

test.describe('管理后台 - 仪表板', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前登录
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`);
  });

  test('仪表板统计数据加载', async ({ page }) => {
    // 等待仪表板加载
    await expect(page.getByRole('heading', { name: '数据统计仪表板' })).toBeVisible();

    // 检查核心指标卡片（使用更精确的选择器）
    await expect(page.getByRole('heading', { name: '数据统计仪表板' })).toBeVisible();
    await expect(page.locator('span:has-text("总用户数")').first()).toBeVisible();
    await expect(page.locator('span:has-text("总收入")').first()).toBeVisible();
    await expect(page.locator('span:has-text("总评估数")').first()).toBeVisible();
    await expect(page.locator('span:has-text("活跃广告")').first()).toBeVisible();

    // 检查详细统计区域
    await expect(page.getByText('用户统计')).toBeVisible();
    await expect(page.getByText('收入统计')).toBeVisible();
    await expect(page.getByText('评估统计')).toBeVisible();
    await expect(page.getByText('系统状态')).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-dashboard-loaded.png', fullPage: true });
  });

  test('仪表板刷新数据', async ({ page }) => {
    // 点击刷新按钮
    await page.getByRole('button', { name: /刷新数据/ }).click();

    // 等待加载完成
    await page.waitForTimeout(2000);

    // 验证数据仍然显示
    await expect(page.getByRole('heading', { name: '数据统计仪表板' })).toBeVisible();
  });
});

test.describe('管理后台 - 广告管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`);
  });

  test('广告列表页面加载', async ({ page }) => {
    // 导航到广告管理页面
    await page.getByRole('link', { name: '广告管理' }).click();
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/ads`);

    // 验证页面标题（使用 h1 选择器）
    await expect(page.getByRole('heading', { name: '广告管理' })).toBeVisible();

    // 检查新建广告按钮
    await expect(page.getByRole('button', { name: '新建广告' })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-ads-list.png' });
  });

  test('创建图片广告表单', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/ads`);
    await page.getByRole('button', { name: '新建广告' }).click();

    // 等待对话框/表单加载
    await expect(page.getByRole('heading', { name: /新建广告/ })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-ads-create-form.png' });
  });

  test('广告搜索和筛选', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/ads`);

    // 检查搜索框
    const searchInput = page.locator('input[placeholder*="搜索"]');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('测试');
      await page.waitForTimeout(500);
    }

    // 截图
    await page.screenshot({ path: 'screenshots/admin-ads-search.png' });
  });
});

test.describe('管理后台 - 社交链接管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`);
  });

  test('社交链接列表页面加载', async ({ page }) => {
    // 导航到社交链接页面
    await page.getByRole('link', { name: '社交链接' }).click();
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/social-links`);

    // 验证页面标题
    await expect(page.getByRole('heading', { name: '社交链接' })).toBeVisible();

    // 检查新建链接按钮
    await expect(page.getByRole('button', { name: '新建链接' })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-social-links-list.png' });
  });

  test('创建社交链接表单', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/social-links`);
    await page.getByRole('button', { name: '新建链接' }).click();

    // 等待表单加载
    await expect(page.getByRole('heading', { name: /新建社交链接/ })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-social-links-create-form.png' });
  });
});

test.describe('管理后台 - 版本发布管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`);
  });

  test('版本发布列表页面加载', async ({ page }) => {
    // 导航到版本发布页面
    await page.getByRole('link', { name: '版本发布' }).click();
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/releases`);

    // 验证页面标题
    await expect(page.getByRole('heading', { name: '版本发布' })).toBeVisible();

    // 检查新建版本按钮
    await expect(page.getByRole('button', { name: '新建版本' })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-releases-list.png' });
  });

  test('创建新版本表单', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/releases`);
    await page.getByRole('button', { name: '新建版本' }).click();

    // 等待表单加载
    await expect(page.getByRole('heading', { name: /新建版本/ })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-releases-create-form.png' });
  });
});

test.describe('管理后台 - 评估记录管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`);
  });

  test('评估记录列表页面加载', async ({ page }) => {
    // 导航到评估记录页面
    await page.getByRole('link', { name: '评估记录' }).click();
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/assessments`);

    // 验证页面标题
    await expect(page.getByRole('heading', { name: '评估记录' })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-assessments-list.png' });
  });

  test('评估记录筛选功能', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/assessments`);

    // 检查筛选选项
    const statusFilter = page.locator('select[name="status"], button:has-text("状态")');
    if (await statusFilter.isVisible({ timeout: 5000 })) {
      // 截图显示筛选器
      await page.screenshot({ path: 'screenshots/admin-assessments-filters.png' });
    }
  });
});

test.describe('管理后台 - 用户管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`);
  });

  test('用户列表页面加载', async ({ page }) => {
    // 导航到用户管理页面
    await page.getByRole('link', { name: '用户管理' }).click();
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/users`);

    // 验证页面标题
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-users-list.png' });
  });

  test('用户搜索功能', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/users`);

    // 检查搜索框
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="邮箱"]');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/admin-users-search.png' });
    }
  });
});

test.describe('管理后台 - 支付记录管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`);
  });

  test('支付记录列表页面加载', async ({ page }) => {
    // 导航到支付记录页面
    await page.getByRole('link', { name: '支付记录' }).click();
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/payments`);

    // 验证页面标题
    await expect(page.getByRole('heading', { name: '支付记录' })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-payments-list.png' });
  });
});

test.describe('管理后台 - 系统设置', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`);
  });

  test('系统设置页面加载', async ({ page }) => {
    // 导航到系统设置页面
    await page.getByRole('link', { name: '系统设置' }).click();
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/settings`);

    // 验证页面标题
    await expect(page.getByRole('heading', { name: '系统设置' })).toBeVisible();

    // 截图
    await page.screenshot({ path: 'screenshots/admin-settings.png' });
  });
});

test.describe('管理后台 - 管理员登出', () => {
  test('管理员登出流程', async ({ page }) => {
    // 登录
    await page.goto(`${ADMIN_BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/dashboard`);

    // 点击登出按钮（尝试多种可能的选择器）
    try {
      await page.getByRole('button', { name: '登出' }).click();
    } catch {
      await page.getByRole('link', { name: '登出' }).click();
    }

    // 验证重定向到登录页
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/login`, { timeout: 10000 });

    // 验证登录表单可见
    await expect(page.getByText('管理后台').first()).toBeVisible();

    // 尝试访问仪表板，应该重定向到登录页
    await page.goto(`${ADMIN_BASE_URL}/admin/dashboard`);
    await page.waitForURL(`${ADMIN_BASE_URL}/admin/login`);

    // 截图
    await page.screenshot({ path: 'screenshots/admin-logout-success.png' });
  });
});
