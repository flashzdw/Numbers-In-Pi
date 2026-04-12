const { chromium } = require('playwright');

(async () => {
  console.log('启动浏览器...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true }); // Make sure downloads are accepted
  const page = await context.newPage();

  // Add event listener for dialogs (in case of 'alert')
  page.on('dialog', dialog => {
    console.log('Dialog opened:', dialog.message());
    dialog.dismiss();
  });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  console.log('导航到 http://localhost:5173 ...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  console.log('输入搜索数字 1234 ...');
  const inputLocator = page.locator('input[placeholder*="4-8"]');
  await inputLocator.fill('1234');
  
  console.log('点击搜索按钮...');
  const buttonLocator = page.locator('button[type="submit"]');
  await buttonLocator.click();

  console.log('等待结果展示...');
  
  await page.waitForTimeout(3000); // Wait for React to render

  // 检查是否有错误信息
  const errorText = await page.locator('.text-red-400').textContent().catch(() => null);
  if (errorText) {
    console.log('发现错误信息:', errorText);
  } else {
    // 只有在没错误的情况下才点击下载
    console.log('测试下载功能...');
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        page.locator('button:has-text("保存海报")').click()
      ]);
      
      const downloadPath = '/workspace/test-download.png';
      await download.saveAs(downloadPath);
      console.log(`海报已下载并保存到: ${downloadPath}`);
    } catch(err) {
      console.error('下载过程报错:', err);
    }
  }

  await browser.close();
  console.log('自动化测试完成！');
})().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
