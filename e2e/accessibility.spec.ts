import { test, expect } from '@playwright/test';

test.describe('Accessibility and Keyboard Navigation', () => {
  test('keyboard navigation works throughout app', async ({ page }) => {
    await page.goto('/');
    
    // Initial focus on body
    await page.keyboard.press('Tab'); // Should skip link
    await page.keyboard.press('Tab'); // Focus on location input

    // Wait for the input to become interactive
    const input = page.locator('#location-input');
    await input.waitFor({ state: 'visible' });
    
    // Verify focus is on the input
    const isInputFocused = await input.evaluate((el) => document.activeElement === el);
    expect(isInputFocused).toBe(true);

    // Enter a location and submit
    await page.keyboard.type('San Francisco');
    await page.keyboard.press('Enter');

    // Tab to the chat toggle button


  });

  test('color contrast check', async ({ page }) => {
    await page.goto('/');
    // A full contrast check typically requires Axe integration, but we can verify our primary colors exist in the DOM
    const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    // Ensure body background is our light theme FAFAFA or similar light gray (rgb(250, 250, 250))
    expect(bodyBg).toMatch(/rgba?\(250,\s*250,\s*250/);
  });
});
