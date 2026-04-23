# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: voter-flow.spec.ts >> VotePath AI User Journey >> should interact with the chat assistant
- Location: e2e\voter-flow.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div:has-text("EPIC")')
Expected: visible
Error: strict mode violation: locator('div:has-text("EPIC")') resolved to 4 elements:
    1) <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end">…</div> aka locator('div').filter({ hasText: 'VotePath AssistantHi! I\'m' }).first()
    2) <div role="dialog" aria-label="Election Assistant Chat" class="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 w-80 sm:w-96 h-[32rem] mb-4 flex flex-col overflow-hidden">…</div> aka getByRole('dialog', { name: 'Election Assistant Chat' })
    3) <div aria-live="polite" class="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">…</div> aka locator('div').filter({ hasText: 'Hi! I\'m your VotePath' }).nth(2)
    4) <div class="max-w-[85%] p-3 rounded-2xl bg-election-blue-500 text-white rounded-tr-sm self-end">…</div> aka locator('div').filter({ hasText: /^What is an EPIC card\?$/ })

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('div:has-text("EPIC")')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e4]:
        - generic [ref=e8]: VOTE
      - generic [ref=e11]: VotePath AI
    - button "Sign in with Google" [ref=e15]:
      - img [ref=e16]
      - text: Sign in with Google
  - link "Skip to main content" [ref=e21] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e22]:
    - generic [ref=e23]:
      - img [ref=e24]:
        - generic [ref=e28]: VOTE
      - heading "VotePath AI" [level=1] [ref=e31]
      - paragraph [ref=e32]: Your personalized, non-partisan election roadmap. Discover exactly how, when, and where to vote.
      - generic [ref=e33]:
        - generic [ref=e34]: Enter your city or zip code
        - textbox "Enter your city or zip code" [ref=e35]:
          - /placeholder: Enter your city or zip code...
      - paragraph [ref=e38]:
        - img [ref=e39]
        - text: "Privacy Notice: Data is processed in real-time and minimized for your security."
    - region "Election Timeline"
    - generic [ref=e41]:
      - dialog "Election Assistant Chat" [ref=e42]:
        - generic [ref=e43]:
          - heading "VotePath Assistant" [level=3] [ref=e44]:
            - img [ref=e45]
            - text: VotePath Assistant
          - button "Close chat" [ref=e47]:
            - img [ref=e48]
        - generic [ref=e50]:
          - generic [ref=e53]: Hi! I'm your VotePath Assistant. I can help you understand your personalized election roadmap and civic duties.
          - paragraph [ref=e55]: What is an EPIC card?
          - generic [ref=e60]: AI is thinking...
        - generic [ref=e62]:
          - generic [ref=e63]: Type your question
          - textbox "Type your question" [disabled] [ref=e64]:
            - /placeholder: Ask about the voting process...
          - button "Send message" [disabled] [ref=e65]:
            - img [ref=e66]
      - button "Toggle Election Guide Chat" [expanded] [ref=e68]:
        - img [ref=e69]
  - alert [ref=e71]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('VotePath AI User Journey', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // We expect the dev server to be running on localhost:3000
  6  |     await page.goto('http://localhost:3000');
  7  |   });
  8  | 
  9  |   test('should guide user through the roadmap creation', async ({ page }) => {
  10 |     // 1. Landing Page
  11 |     await expect(page.locator('h1')).toContainText('VotePath AI');
  12 |     const locationInput = page.locator('#location-input');
  13 |     await expect(locationInput).toBeVisible();
  14 | 
  15 |     // 2. Enter Location
  16 |     await locationInput.fill('Mumbai, India');
  17 |     await locationInput.press('Enter');
  18 | 
  19 |     // 3. Context Selection
  20 |     await expect(page.getByText('Tell us a bit more about you')).toBeVisible({ timeout: 10000 });
  21 |     
  22 |     // Choose "First-time Voter"
  23 |     await page.getByLabel('First-time Voter').click();
  24 |     // Choose "I haven't registered yet"
  25 |     await page.getByLabel("I haven't registered yet").click();
  26 |     // Choose "In-person"
  27 |     await page.getByLabel("In-person").click();
  28 | 
  29 |     await page.getByRole('button', { name: 'Generate My Roadmap' }).click();
  30 | 
  31 |     // 4. Roadmap Results
  32 |     await expect(page.getByText('Ready to Vote')).not.toBeVisible(); // Should be warning/error
  33 |     await expect(page.getByText('Action Required')).toBeVisible();
  34 |     await expect(page.getByText('Next Best Action')).toBeVisible();
  35 | 
  36 |     // 5. Timeline Steps
  37 |     await expect(page.getByText('Eligibility & Registration')).toBeVisible();
  38 |     await expect(page.getByText('Document Preparation')).toBeVisible();
  39 |   });
  40 | 
  41 |   test('should interact with the chat assistant', async ({ page }) => {
  42 |     const chatBubble = page.getByLabel('Toggle Election Guide Chat');
  43 |     await chatBubble.click();
  44 | 
  45 |     const chatInput = page.locator('#chat-input');
  46 |     await expect(chatInput).toBeVisible();
  47 |     
  48 |     await chatInput.fill('What is an EPIC card?');
  49 |     await chatInput.press('Enter');
  50 | 
  51 |     // Check for AI response (wait for it to appear)
> 52 |     await expect(page.locator('div:has-text("EPIC")')).toBeVisible({ timeout: 15000 });
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  53 |   });
  54 | });
  55 | 
```