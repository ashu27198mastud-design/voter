# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: voter-flow.spec.ts >> VotePath AI User Journey >> should guide user through the roadmap creation
- Location: e2e\voter-flow.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Tell us a bit more about you')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Tell us a bit more about you')

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
        - img [ref=e34]
        - generic [ref=e37]: Mumbai, India
        - button "Change" [ref=e38]
      - paragraph [ref=e40]:
        - img [ref=e41]
        - text: "Privacy Notice: Data is processed in real-time and minimized for your security."
    - generic [ref=e43]:
      - generic [ref=e44]:
        - heading "Personalize Your Roadmap" [level=2] [ref=e45]
        - generic [ref=e46]: Step 1 of 3
      - generic [ref=e47]:
        - paragraph [ref=e48]: Which best describes you?
        - button "First-Time Voter Never voted before" [ref=e49]:
          - generic [ref=e50]: First-Time Voter
          - generic [ref=e51]: Never voted before
        - button "Returning Voter Voted in previous elections" [ref=e52]:
          - generic [ref=e53]: Returning Voter
          - generic [ref=e54]: Voted in previous elections
        - button "Recently Moved New address in a new jurisdiction" [ref=e55]:
          - generic [ref=e56]: Recently Moved
          - generic [ref=e57]: New address in a new jurisdiction
        - button "Senior Voter May require accessibility support" [ref=e58]:
          - generic [ref=e59]: Senior Voter
          - generic [ref=e60]: May require accessibility support
        - button "Overseas / Military Voting from outside the US" [ref=e61]:
          - generic [ref=e62]: Overseas / Military
          - generic [ref=e63]: Voting from outside the US
    - region "Election Timeline"
    - button "Toggle Election Guide Chat" [ref=e65]:
      - img [ref=e66]
  - alert [ref=e68]
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
> 20 |     await expect(page.getByText('Tell us a bit more about you')).toBeVisible({ timeout: 10000 });
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
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
  52 |     await expect(page.locator('div:has-text("EPIC")')).toBeVisible({ timeout: 15000 });
  53 |   });
  54 | });
  55 | 
```