import { test, expect } from '@playwright/test';

test.describe('管理后台登录', () => {
  test('未登录用户访问登录页：只显示登录表单，无侧边栏', async ({ page }) => {
    // 清除所有 cookies 确保未登录状态
    const context = page.context();
    await context.clearCookies();

    await page.goto('/admin/login');

    // 检查登录表单可见
    await expect(page.locator('text=管理后台').first()).toBeVisible();
    await expect(page.locator('text=请输入管理员账号密码登录')).toBeVisible();

    // 检查侧边栏不存在
    const sidebar = page.locator('aside');
    await expect(sidebar).not.toBeVisible();

    // 截图保存
    await page.screenshot({ path: 'screenshots/admin-login-logged-out.png' });
  });

  test('已登录用户访问登录页：自动重定向到仪表板', async ({ page }) => {
    // 先登录
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 等待导航到仪表板
    await page.waitForURL('/admin/dashboard');

    // 验证仪表板内容
    await expect(page.locator('text=数据统计仪表板')).toBeVisible();

    // 验证侧边栏可见
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // 然后尝试访问登录页
    await page.goto('/admin/login');

    // 应该被重定向回仪表板
    await page.waitForURL('/admin/dashboard');

    // 检查仪表板内容仍然可见
    await expect(page.locator('text=数据统计仪表板')).toBeVisible();

    // 截图保存
    await page.screenshot({ path: 'screenshots/admin-dashboard.png' });
  });

  test('登录流程完整测试', async ({ page }) => {
    // 清除 cookies
    await page.context().clearCookies();

    // 访问登录页
    await page.goto('/admin/login');

    // 填写表单
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');

    // 点击登录
    await page.click('button[type="submit"]');

    // 等待导航到仪表板
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });

    // 验证登录成功
    await expect(page.locator('text=数据统计仪表板')).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
  });
});
