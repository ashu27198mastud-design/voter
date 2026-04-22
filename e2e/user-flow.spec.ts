import { test, expect } from '@playwright/test';

test.describe('End-to-End User Flow', () => {
  test('user can enter a location and see the election timeline', async ({ page }) => {
    // Start at home
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/VotePath AI/);

    // Enter a location (Mocking the manual enter behavior)
    const input = page.locator('#location-input');
    await input.fill('New York, NY');
    await input.press('Enter');

    // Timeline should appear
    const timeline = page.locator('section[aria-label="Election Process Timeline"]');
    await expect(timeline).toBeVisible();

    // First step should be expanded
    await expect(page.getByText('Voter Registration')).toBeVisible();
    await expect(page.getByText('Registration Guidelines')).toBeVisible();

    // Check chat interface
    const chatBtn = page.getByLabelText('Toggle Election Guide Chat');
    await chatBtn.click();
    await expect(page.getByText('VotePath Assistant')).toBeVisible();
  });
});
