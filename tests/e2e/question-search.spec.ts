import { test, expect } from '@playwright/test'

/**
 * 搜题功能 E2E 测试
 *
 * 注意：搜题入口已移至 dashboard 页面（需要登录认证）
 * UI 测试需要先完成登录流程，目前主要测试 API 功能
 */

test.describe('Search API Tests', () => {
  test('should verify search API endpoint is accessible', async ({ page }) => {
    // 测试 API 端点是否可访问
    const response = await page.request.get('/api/exam/search-question')

    // API 应该返回 200
    expect(response.status()).toBe(200)

    // 验证返回的 API 信息
    const data = await response.json()
    expect(data.name).toContain('搜题')
    expect(data.features).toContain('文字搜题')
  })

  test('should return error for empty request', async ({ page }) => {
    // 发送空请求
    const response = await page.request.post('/api/exam/search-question', {
      headers: { 'Content-Type': 'application/json' },
      data: {}
    })

    // 应该返回 400 错误
    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('请输入')
  })

  test('should accept text input for search', async ({ page }) => {
    // 发送文字搜题请求
    const response = await page.request.post('/api/exam/search-question', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        questionText: '1 + 1 = ?'
      }
    })

    // 验证请求被接受
    expect([200, 500]).toContain(response.status()) // 可能因为 AI API 配置而失败

    const data = await response.json()
    // 验证返回结构
    expect(data).toHaveProperty('success')
  })

  test('should accept math formula in search', async ({ page }) => {
    // 发送包含数学公式的搜题请求
    const response = await page.request.post('/api/exam/search-question', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        questionText: '已知函数 f(x) = x² + 2x + 1，求 f(2) 的值'
      }
    })

    // 验证请求被接受
    expect([200, 500]).toContain(response.status())

    const data = await response.json()
    expect(data).toHaveProperty('success')

    // 如果成功，验证返回结构
    if (data.success && data.result) {
      expect(data.result).toHaveProperty('originalQuestion')
      expect(data.result).toHaveProperty('answer')
      expect(data.result).toHaveProperty('explanation')
      expect(data.result).toHaveProperty('source')
      expect(data.result).toHaveProperty('confidence')
    }
  })
})

/**
 * UI 测试 - 需要登录认证
 *
 * 要运行 UI 测试，需要先设置测试用户账号并在测试中完成登录流程
 *
 * 示例登录流程：
 * 1. await page.goto('/login')
 * 2. await page.fill('input[type="email"]', 'test@example.com')
 * 3. await page.fill('input[type="password"]', 'testpassword')
 * 4. await page.click('button[type="submit"]')
 * 5. await page.waitForURL('/dashboard')
 *
 * 然后可以测试搜题功能：
 * - 验证搜题按钮在 dashboard 页面可见
 * - 点击按钮打开搜题弹窗
 * - 测试文字输入和拍照上传模式切换
 * - 测试搜索结果显示和数学公式渲染
 */
