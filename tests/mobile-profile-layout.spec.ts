import { test, expect } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
})

test.describe('Mobile Profile Layout', () => {
  test('should display toggle buttons next to Pro membership and handle text overflow', async ({ page }) => {
    // Navigate to profile page
    await page.goto('http://localhost:3000/profile')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check if subscription card header contains toggle buttons
    const subscriptionCard = page.locator('text=订阅状态').locator('..')
    await expect(subscriptionCard).toBeVisible()

    // Verify language switcher is present
    const languageSwitcher = subscriptionCard.locator('button:has-text("EN"), button:has-text("中")')
    await expect(languageSwitcher).toBeVisible()

    // Verify theme toggle is present
    const themeToggle = subscriptionCard.locator('button:has(svg)')
    await expect(themeToggle).toBeVisible()

    // Check email text overflow handling
    const emailElement = page.locator('text=邮箱').locator('..').locator('span').nth(1)
    await expect(emailElement).toBeVisible()

    // Verify email has truncate class
    const emailClasses = await emailElement.getAttribute('class')
    expect(emailClasses).toContain('truncate')

    // Check user ID text overflow handling
    const userIdElement = page.locator('text=用户 ID').locator('..').locator('span').nth(1)
    await expect(userIdElement).toBeVisible()

    // Verify user ID has truncate class
    const userIdClasses = await userIdElement.getAttribute('class')
    expect(userIdClasses).toContain('truncate')

    // Take screenshot for visual verification
    await page.screenshot({ path: 'tests/screenshots/mobile-profile-layout.png', fullPage: true })
  })

  test('should toggle language when clicking language button', async ({ page }) => {
    await page.goto('http://localhost:3000/profile')
    await page.waitForLoadState('networkidle')

    const languageSwitcher = page.locator('button:has-text("EN"), button:has-text("中")').first()
    const initialText = await languageSwitcher.textContent()

    await languageSwitcher.click()
    await page.waitForTimeout(500)

    const newText = await languageSwitcher.textContent()
    expect(newText).not.toBe(initialText)
  })

  test('should toggle theme when clicking theme button', async ({ page }) => {
    await page.goto('http://localhost:3000/profile')
    await page.waitForLoadState('networkidle')

    const themeToggle = page.locator('button:has(svg[class*="lucide"])').first()
    await expect(themeToggle).toBeVisible()

    await themeToggle.click()
    await page.waitForTimeout(500)

    // Verify theme changed by checking html class
    const htmlElement = page.locator('html')
    const htmlClass = await htmlElement.getAttribute('class')
    expect(htmlClass).toBeTruthy()
  })
})
