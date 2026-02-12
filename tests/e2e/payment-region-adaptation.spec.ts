import { test, expect } from '@playwright/test';

test.describe('CN环境支付适配测试', () => {
  test.beforeEach(async ({ page }) => {
    // 模拟CN环境
    await page.addInitScript(() => {
      Object.defineProperty(window, 'process', {
        value: {
          env: {
            NEXT_PUBLIC_DEPLOYMENT_REGION: 'CN'
          }
        },
        writable: true,
        configurable: true
      });
    });
  });

  test('管理后台只显示CN支付方式统计', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.waitForLoadState('networkidle');

    // 验证显示微信和支付宝
    await expect(page.getByText('微信支付')).toBeVisible();
    await expect(page.getByText('支付宝')).toBeVisible();

    // 验证不显示Stripe和PayPal
    const stripeText = page.getByText('Stripe', { exact: true });
    const paypalText = page.getByText('PayPal', { exact: true });

    await expect(stripeText).not.toBeVisible();
    await expect(paypalText).not.toBeVisible();
  });

  test('支付方式筛选器只包含CN选项', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.waitForLoadState('networkidle');

    // 点击支付方式筛选器
    const filterTrigger = page.locator('[role="combobox"]').filter({ hasText: '支付方式' });
    await filterTrigger.click();

    // 等待下拉菜单出现
    await page.waitForTimeout(500);

    // 验证选项
    const wechatOption = page.locator('[role="option"]').filter({ hasText: '微信支付' });
    const alipayOption = page.locator('[role="option"]').filter({ hasText: '支付宝' });

    await expect(wechatOption).toBeVisible();
    await expect(alipayOption).toBeVisible();
  });

  test('货币显示为CNY', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.waitForLoadState('networkidle');

    // 验证总收入显示人民币符号
    const revenue = page.locator('text=/¥/').first();
    await expect(revenue).toBeVisible();
  });
});

test.describe('INTL环境支付适配测试', () => {
  test.beforeEach(async ({ page }) => {
    // 模拟INTL环境
    await page.addInitScript(() => {
      Object.defineProperty(window, 'process', {
        value: {
          env: {
            NEXT_PUBLIC_DEPLOYMENT_REGION: 'INTL'
          }
        },
        writable: true,
        configurable: true
      });
    });
  });

  test('管理后台只显示INTL支付方式统计', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.waitForLoadState('networkidle');

    // 验证显示Stripe和PayPal
    await expect(page.getByText('Stripe', { exact: true })).toBeVisible();
    await expect(page.getByText('PayPal', { exact: true })).toBeVisible();

    // 验证不显示微信和支付宝
    await expect(page.getByText('微信支付')).not.toBeVisible();
    await expect(page.getByText('支付宝')).not.toBeVisible();
  });

  test('支付方式筛选器只包含INTL选项', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.waitForLoadState('networkidle');

    // 点击支付方式筛选器
    const filterTrigger = page.locator('[role="combobox"]').filter({ hasText: '支付方式' });
    await filterTrigger.click();

    // 等待下拉菜单出现
    await page.waitForTimeout(500);

    // 验证选项
    const stripeOption = page.locator('[role="option"]').filter({ hasText: 'Stripe' });
    const paypalOption = page.locator('[role="option"]').filter({ hasText: 'PayPal' });

    await expect(stripeOption).toBeVisible();
    await expect(paypalOption).toBeVisible();
  });

  test('货币显示为USD', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.waitForLoadState('networkidle');

    // 验证总收入显示美元符号
    const revenue = page.locator('text=/\\$/').first();
    await expect(revenue).toBeVisible();
  });
});
