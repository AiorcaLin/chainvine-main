const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport size for consistent screenshots
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Wait a bit more for any animations/hydration
  await page.waitForTimeout(2000);
  
  console.log('Capturing homepage screenshot...');
  await page.screenshot({ 
    path: 'screenshot-homepage.png',
    fullPage: true 
  });
  console.log('✓ Homepage screenshot saved as screenshot-homepage.png');
  
  console.log('\nNavigating to audit page...');
  await page.goto('http://localhost:3000/audit', { waitUntil: 'networkidle' });
  
  // Wait for the page to fully load
  await page.waitForTimeout(2000);
  
  console.log('Capturing audit page screenshot...');
  await page.screenshot({ 
    path: 'screenshot-audit-page.png',
    fullPage: true 
  });
  console.log('✓ Audit page screenshot saved as screenshot-audit-page.png');
  
  await browser.close();
  
  console.log('\n✅ All screenshots captured successfully!');
  console.log('Files saved in:', process.cwd());
})();
