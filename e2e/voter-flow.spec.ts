import { test, expect } from '@playwright/test';

test.describe('VotePath AI User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // We expect the dev server to be running on localhost:3000
    await page.goto('http://localhost:3000');
  });

  test('should guide user through the roadmap creation', async ({ page }) => {
    // 1. Landing Page
    await expect(page.locator('h1')).toContainText('VotePath AI');
    const locationInput = page.locator('#location-input');
    await expect(locationInput).toBeVisible();

    // 2. Enter Location
    await locationInput.fill('Mumbai, India');
    await locationInput.press('Enter');

    // 3. Context Selection
    await expect(page.getByText('Tell us a bit more about you')).toBeVisible({ timeout: 10000 });
    
    // Choose "First-time Voter"
    await page.getByLabel('First-time Voter').click();
    // Choose "I haven't registered yet"
    await page.getByLabel("I haven't registered yet").click();
    // Choose "In-person"
    await page.getByLabel("In-person").click();

    await page.getByRole('button', { name: 'Generate My Roadmap' }).click();

    // 4. Roadmap Results
    await expect(page.getByText('Ready to Vote')).not.toBeVisible(); // Should be warning/error
    await expect(page.getByText('Action Required')).toBeVisible();
    await expect(page.getByText('Next Best Action')).toBeVisible();

    // 5. Timeline Steps
    await expect(page.getByText('Eligibility & Registration')).toBeVisible();
    await expect(page.getByText('Document Preparation')).toBeVisible();
  });

  test('should interact with the chat assistant', async ({ page }) => {
    const chatBubble = page.getByLabel('Toggle Election Guide Chat');
    await chatBubble.click();

    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toBeVisible();
    
    await chatInput.fill('What is an EPIC card?');
    await chatInput.press('Enter');

    // Check for AI response (wait for it to appear)
    await expect(page.locator('div:has-text("EPIC")')).toBeVisible({ timeout: 15000 });
  });
});
