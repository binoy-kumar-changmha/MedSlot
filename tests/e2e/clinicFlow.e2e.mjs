import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { createApp } from '../../src/app.js';

async function maybeSaveScreenshot(driver, filename) {
  const dir = process.env.SAVE_SCREENSHOTS_DIR;
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  const png = await driver.takeScreenshot();
  fs.writeFileSync(path.join(dir, filename), png, 'base64');
}

async function runE2E() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'medslot-e2e-'));
  const tempDbPath = path.join(tempDir, 'medslot-e2e.db');
  const { app, db } = createApp({ dbPath: tempDbPath, seed: true });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const options = new chrome.Options();
  options.addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1440,900'
  );

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  try {
    // 1. Login and verify Dashboard KPI cards
    await driver.get(baseUrl);
    const emailInput = await driver.wait(
      until.elementLocated(By.css('[data-testid="login-email"]')),
      10000
    );
    await emailInput.sendKeys('admin@medslot.local');
    await driver.findElement(By.css('[data-testid="login-password"]')).sendKeys('admin123');
    await driver.findElement(By.css('[data-testid="login-submit"]')).click();

    await driver.wait(until.elementLocated(By.css('[data-testid="kpi-patients"]')), 10000);
    await driver.wait(async () => {
      const text = await driver.findElement(By.css('[data-testid="kpi-patients"]')).getText();
      return !text.includes('—');
    }, 10000);
    await maybeSaveScreenshot(driver, 'dashboard.png');

    // 2. Create patient Farhana Akter
    await driver.findElement(By.css('[data-testid="nav-patients"]')).click();
    await driver.wait(until.elementLocated(By.css('[data-testid="add-patient-btn"]')), 5000).click();
    await driver
      .wait(until.elementLocated(By.css('[data-testid="patient-name-input"]')), 5000)
      .sendKeys('Farhana Akter');
    await driver.findElement(By.css('[data-testid="patient-phone-input"]')).sendKeys('01711000999');
    await driver
      .findElement(By.css('[data-testid="patient-email-input"]'))
      .sendKeys('farhana@example.com');
    const ageInput = driver.findElement(By.css('[data-testid="patient-age-input"]'));
    await ageInput.clear();
    await ageInput.sendKeys('26');
    await driver.findElement(By.css('[data-testid="save-patient-btn"]')).click();

    await driver.wait(async () => {
      const bodyText = await driver.findElement(By.tagName('body')).getText();
      return bodyText.includes('Farhana Akter') && bodyText.includes('01711000999');
    }, 8000);

    // 3. Book EMERGENCY appointment for Farhana Akter with Dr. Tariq Hasan
    await driver.findElement(By.css('[data-testid="nav-appointments"]')).click();
    await driver
      .wait(until.elementLocated(By.css('[data-testid="book-appointment-btn"]')), 5000)
      .click();

    const patientSelect = await driver.wait(
      until.elementLocated(By.css('[data-testid="appt-patient-select"]')),
      5000
    );
    const patientOptions = await patientSelect.findElements(By.tagName('option'));
    for (const opt of patientOptions) {
      if ((await opt.getText()).includes('Farhana Akter')) {
        await opt.click();
        break;
      }
    }

    const doctorSelect = driver.findElement(By.css('[data-testid="appt-doctor-select"]'));
    const doctorOptions = await doctorSelect.findElements(By.tagName('option'));
    for (const opt of doctorOptions) {
      if ((await opt.getText()).includes('Dr. Tariq Hasan')) {
        await opt.click();
        break;
      }
    }

    const typeSelect = driver.findElement(By.css('[data-testid="appt-type-select"]'));
    await typeSelect.findElement(By.css('option[value="EMERGENCY"]')).click();

    const dateInput = driver.findElement(By.css('[data-testid="appt-date-input"]'));
    await dateInput.clear();
    await dateInput.sendKeys('2026-12-01');

    const slotInput = driver.findElement(By.css('[data-testid="appt-slot-input"]'));
    await slotInput.clear();
    await slotInput.sendKeys('11:00');

    await driver
      .findElement(By.css('[data-testid="appt-reason-input"]'))
      .sendKeys('Severe migraine triage');
    await driver.findElement(By.css('[data-testid="save-appointment-btn"]')).click();

    await driver.wait(async () => {
      const rows = await driver.findElements(By.css('tbody tr'));
      for (const row of rows) {
        const text = await row.getText();
        if (
          text.includes('Farhana Akter') &&
          text.includes('EMERGENCY') &&
          text.includes('SCHEDULED')
        ) {
          return true;
        }
      }
      return false;
    }, 8000);

    // 4. Generate invoice (1400 BDT) and settle via PaymentGatewayAdapter
    await driver.findElement(By.css('[data-testid="nav-billing"]')).click();
    await driver
      .wait(until.elementLocated(By.css('[data-testid="generate-invoice-btn"]')), 5000)
      .click();

    const apptSelect = await driver.wait(
      until.elementLocated(By.css('[data-testid="invoice-appointment-select"]')),
      5000
    );
    const apptOptions = await apptSelect.findElements(By.tagName('option'));
    for (const opt of apptOptions) {
      if ((await opt.getText()).includes('Farhana Akter')) {
        await opt.click();
        break;
      }
    }

    await driver.findElement(By.css('[data-testid="save-invoice-btn"]')).click();

    let farhanaInvoiceTestId = null;
    await driver.wait(async () => {
      const rows = await driver.findElements(By.css('tbody tr'));
      for (const row of rows) {
        const text = await row.getText();
        if (text.includes('Farhana Akter') && text.includes('1,400') && text.includes('UNPAID')) {
          farhanaInvoiceTestId = await row.getAttribute('data-testid');
          return true;
        }
      }
      return false;
    }, 8000);

    assert.ok(farhanaInvoiceTestId, 'Expected Farhana invoice row to appear');
    const payButton = await driver.findElement(
      By.css(`tr[data-testid="${farhanaInvoiceTestId}"] [data-testid="pay-invoice-btn"]`)
    );
    await payButton.click();

    await driver.wait(async () => {
      const rowText = await driver
        .findElement(By.css(`tr[data-testid="${farhanaInvoiceTestId}"]`))
        .getText();
      return rowText.includes('PAID') && rowText.includes('BANK-INV-');
    }, 8000);
    await maybeSaveScreenshot(driver, 'billing.png');

    // 5. Verify Swagger OpenAPI UI renders cleanly
    await driver.get(`${baseUrl}/api-docs/`);
    await driver.wait(until.elementLocated(By.css('.swagger-ui')), 10000);
    await driver.wait(async () => {
      const text = await driver.findElement(By.tagName('body')).getText();
      return text.includes('MedSlot Clinic API');
    }, 10000);

    console.log('Selenium E2E clinicFlow passed all 5 end-to-end assertions!');
  } finally {
    await driver.quit();
    await new Promise((resolve) => server.close(resolve));
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

runE2E().catch((err) => {
  console.error('Selenium E2E failed:', err);
  process.exit(1);
});
