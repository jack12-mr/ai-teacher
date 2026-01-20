/**
 * Playwright 配置文件
 *
 * 配置测试运行环境和浏览器选项
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // 测试目录
  testDir: "./tests",

  // 测试超时时间（增加到 60 秒）
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },

  // 失败时截图
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },

  // 串行执行，避免并发问题
  fullyParallel: false,
  workers: 1,

  // 报告器
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],

  // 测试运行配置 - 只使用 Chromium
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // 开发服务器（可选）
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
