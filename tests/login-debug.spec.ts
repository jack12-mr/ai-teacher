import { test, expect } from '@playwright/test';

/**
 * 登录功能调试测试
 * 用于诊断登录失败的原因
 */

test.describe('登录功能调试', () => {
  test('检查登录页面是否可访问', async ({ page }) => {
    console.log('访问登录页...');
    await page.goto('http://localhost:3000/admin/login');

    // 截图
    await page.screenshot({ path: 'screenshots/debug-01-login-page.png' });

    // 检查页面标题
    const title = await page.title();
    console.log('页面标题:', title);

    // 检查是否有登录表单
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    console.log('用户名输入框可见:', await usernameInput.isVisible());
    console.log('密码输入框可见:', await passwordInput.isVisible());
    console.log('提交按钮可见:', await submitButton.isVisible());

    // 尝试登录
    console.log('填写登录表单...');
    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');

    await page.screenshot({ path: 'screenshots/debug-02-form-filled.png' });

    console.log('点击登录按钮...');
    await submitButton.click();

    // 等待导航
    console.log('等待导航...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('当前 URL:', currentUrl);

    await page.screenshot({ path: 'screenshots/debug-03-after-login.png' });

    // 检查是否有错误消息
    const errorMessages = await page.locator('text=错误, text=失败, text=无效, text=错误').all();
    console.log('错误消息数量:', errorMessages.length);
  });
});
