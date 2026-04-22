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
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e5]:
        - generic [ref=e9]: VOTE
      - heading "VotePath AI" [level=1] [ref=e12]
      - paragraph [ref=e13]: Your personalized, non-partisan election roadmap. Enter your location to discover exactly how, when, and where to vote.
      - generic [ref=e14]:
        - img [ref=e15]
        - generic [ref=e18]: Mumbai, India
        - button "Change" [ref=e19]
      - paragraph [ref=e21]:
        - img [ref=e22]
        - text: "Privacy Notice: Location is used temporarily for fetching info and is never stored."
    - generic [ref=e24]:
      - generic [ref=e25]:
        - heading "Personalize Your Roadmap" [level=2] [ref=e26]
        - generic [ref=e27]: Step 1 of 3
      - generic [ref=e28]:
        - paragraph [ref=e29]: Which best describes you?
        - button "First-Time Voter Never voted before" [ref=e30]:
          - generic [ref=e31]: First-Time Voter
          - generic [ref=e32]: Never voted before
        - button "Returning Voter Voted in previous elections" [ref=e33]:
          - generic [ref=e34]: Returning Voter
          - generic [ref=e35]: Voted in previous elections
        - button "Recently Moved New address in a new jurisdiction" [ref=e36]:
          - generic [ref=e37]: Recently Moved
          - generic [ref=e38]: New address in a new jurisdiction
        - button "Senior Voter May require accessibility support" [ref=e39]:
          - generic [ref=e40]: Senior Voter
          - generic [ref=e41]: May require accessibility support
        - button "Overseas / Military Voting from outside the US" [ref=e42]:
          - generic [ref=e43]: Overseas / Military
          - generic [ref=e44]: Voting from outside the US
    - region "Election Timeline"
    - complementary "Educational Chat Assistant":
      - button "Toggle Election Guide Chat" [ref=e46]:
        - img [ref=e47]
  - generic [ref=e55]:
    - button "Open Next.js Dev Tools" [ref=e56]:
      - img [ref=e57]
    - generic [ref=e60]:
      - button "Open issues overlay" [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e63]: "0"
          - generic [ref=e64]: "1"
        - generic [ref=e65]: Issue
      - button "Collapse issues badge" [ref=e66]:
        - img [ref=e67]
  - alert [ref=e69]
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