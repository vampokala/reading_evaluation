#!/usr/bin/env node
// Renders all mockup HTML files to PNG screenshots using Playwright.
// Usage: node screenshot.js
// Output: ../screenshots/step-01.png … step-11.png

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const MOCKUPS = [
  { file: '01_new_sheet.html',          out: 'step-01-new-sheet.png' },
  { file: '02_extensions_menu.html',    out: 'step-02-extensions-menu.png' },
  { file: '03_apps_script_editor.html', out: 'step-03-apps-script-editor.png' },
  { file: '04_reading_tracker_menu.html', out: 'step-04-reading-tracker-menu.png' },
  { file: '05_wizard_step1.html',       out: 'step-05-wizard-step1.png' },
  { file: '06_settings_tab.html',       out: 'step-06-settings-tab.png' },
  { file: '07_api_key_dialog.html',     out: 'step-07-api-key-dialog.png' },
  { file: '08_setup_complete.html',     out: 'step-08-setup-complete.png' },
  { file: '09_daily_log.html',          out: 'step-09-daily-log.png' },
  { file: '10_evaluations_tab.html',    out: 'step-10-evaluations-tab.png' },
  { file: '11_email.html',             out: 'step-11-email.png' },
];

const MOCKUPS_DIR  = __dirname;
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

(async () => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const { file, out } of MOCKUPS) {
    const url = `file://${path.join(MOCKUPS_DIR, file)}`;
    const dest = path.join(SCREENSHOTS_DIR, out);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`✅  ${out}`);
  }

  await browser.close();
  console.log(`\nAll screenshots saved to: ${SCREENSHOTS_DIR}`);
})();
