/**
 * Sample Selenium test — Shopping Cart Flow
 * Demonstrates more complex patterns: multiple elements, assertions, screenshots.
 */
const { Builder, By, until, Key } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
require('chromedriver');

describe('Shopping Cart', () => {
  let driver;

  beforeEach(async () => {
    const chromeOptions = new Options();
    chromeOptions.addArguments('--headless');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('should add product to cart', async () => {
    await driver.get('https://demo-store.example.com/products');

    // Search for a product
    const searchInput = await driver.findElement(By.name('search'));
    await searchInput.sendKeys('Wireless Headphones');
    await searchInput.sendKeys(Key.ENTER);

    // Wait for results
    await driver.wait(until.elementLocated(By.css('.product-card')), 10000);

    // Click first product
    const firstProduct = await driver.findElement(By.css('.product-card:first-child'));
    await firstProduct.click();

    // Add to cart
    await driver.wait(until.elementLocated(By.id('add-to-cart')), 5000);
    const addToCartBtn = await driver.findElement(By.id('add-to-cart'));
    await addToCartBtn.click();

    // Verify cart badge updates
    await driver.wait(until.elementLocated(By.css('.cart-badge')), 3000);
    const cartBadge = await driver.findElement(By.css('.cart-badge'));
    expect(await cartBadge.getText()).toBe('1');
  });

  it('should update quantity in cart', async () => {
    await driver.get('https://demo-store.example.com/cart');

    // Find quantity input
    const qtyInput = await driver.findElement(By.css('.qty-input'));
    await qtyInput.clear();
    await qtyInput.sendKeys('3');

    // Click update button
    const updateBtn = await driver.findElement(By.css('.btn-update-qty'));
    await updateBtn.click();

    // Wait for total to update
    await driver.sleep(1000);
    const total = await driver.findElement(By.id('cart-total'));
    const totalText = await total.getText();
    expect(totalText).toContain('$');

    // Take screenshot for verification
    await driver.takeScreenshot();
  });

  it('should remove item from cart', async () => {
    await driver.get('https://demo-store.example.com/cart');

    const removeBtn = await driver.findElement(By.css('.btn-remove'));
    await removeBtn.click();

    // Wait for empty cart message
    await driver.wait(until.elementIsVisible(
      driver.findElement(By.css('.empty-cart-message'))
    ), 5000);

    const emptyMsg = await driver.findElement(By.css('.empty-cart-message'));
    expect(await emptyMsg.isDisplayed()).toBe(true);
  });

  it('should proceed to checkout', async () => {
    await driver.get('https://demo-store.example.com/cart');

    // Switch to payment iframe
    await driver.switchTo().frame('payment-frame');

    const cardInput = await driver.findElement(By.id('card-number'));
    await cardInput.sendKeys('4111111111111111');

    // Back to main content
    await driver.switchTo().defaultContent();

    // Click checkout
    const checkoutBtn = await driver.findElement(By.id('checkout-btn'));
    await checkoutBtn.click();

    // Execute script to scroll
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');

    // Verify order confirmation
    await driver.wait(until.elementLocated(By.css('.order-confirmation')), 10000);
    const confirmation = await driver.findElement(By.css('.order-confirmation'));
    expect(await confirmation.getText()).toContain('Order Placed');
  });
});
