const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: 'mobile-profile-screenshot.png', fullPage: true });

  await browser.close();
  console.log('Screenshot saved to mobile-profile-screenshot.png');
})();
