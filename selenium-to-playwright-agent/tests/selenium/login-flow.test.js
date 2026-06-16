/**
 * Sample Selenium test — E-commerce Login Flow
 * This file demonstrates common Selenium patterns that the agent will migrate.
 */
const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');

describe('Login Flow', () => {
  let driver;

  beforeEach(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('should login with valid credentials', async () => {
    await driver.get('https://demo-store.example.com/login');

    // Fill in login form
    const emailInput = await driver.findElement(By.id('email'));
    await emailInput.clear();
    await emailInput.sendKeys('[email]');

    const passwordInput = await driver.findElement(By.id('password'));
    await passwordInput.clear();
    await passwordInput.sendKeys('[password]');

    // Click login button
    const loginBtn = await driver.findElement(By.css('.btn-login'));
    await loginBtn.click();

    // Wait for dashboard to load
    await driver.wait(until.elementLocated(By.id('dashboard')), 10000);

    // Verify user is logged in
    const welcomeText = await driver.findElement(By.css('.welcome-message'));
    const text = await welcomeText.getText();
    expect(text).toContain('Welcome');
  });

  it('should show error for invalid credentials', async () => {
    await driver.get('https://demo-store.example.com/login');

    await driver.findElement(By.id('email')).sendKeys('[email]');
    await driver.findElement(By.id('password')).sendKeys('wrongpassword');
    await driver.findElement(By.css('.btn-login')).click();

    // Wait for error message
    await driver.wait(until.elementLocated(By.css('.error-message')), 5000);
    const errorEl = await driver.findElement(By.css('.error-message'));

    expect(await errorEl.isDisplayed()).toBe(true);
    expect(await errorEl.getText()).toBe('Invalid email or password');
  });

  it('should navigate to forgot password', async () => {
    await driver.get('https://demo-store.example.com/login');

    const forgotLink = await driver.findElement(By.linkText('Forgot Password?'));
    await forgotLink.click();

    await driver.wait(until.elementLocated(By.id('reset-form')), 5000);
    const heading = await driver.findElement(By.css('h1'));
    expect(await heading.getText()).toBe('Reset Password');
  });
});
