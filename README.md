# 🗳️ VotePath AI – Election Process Education Assistant

VotePath AI is a decision-driven, non-partisan election guidance system that helps users navigate the voting process. This app provides personalized roadmaps, registration guidance, and an AI-powered educational guide.

## ✨ Key Features

### 🧠 Context-Aware Guidance Engine
Transforms user inputs (location, voter status, preferences) into a personalized election roadmap with clear next steps.

### 📍 Localized Election Intelligence
Fetches real-time election timelines, polling data, and deadlines using the Google Civic Information API.

### 📊 Visual Election Timeline
Breaks down the voting process into a structured, step-by-step journey with clear stages and explanations.

### 🤖 Controlled AI Assistant (Gemini)
Provides simplified explanations of civic procedures with strict neutrality, factual grounding, and scope enforcement.

### ⚡ Smart Location Input
Debounced predictive search with instant ZIP code detection for fast and accurate user onboarding.

### 🔒 Security-First Architecture
- **Data Minimization**: Zero backend data storage (NIST aligned).
- **Validation**: Zod-based strict input validation.
- **Protection**: CSP headers for browser-level protection.
- **Sanitization**: DOMPurify for output sanitization.

### ♿ Accessibility by Design
WCAG 2.1 AA compliant with full keyboard navigation and screen reader compatibility.

### 🎨 Premium UX
Clean, modern civic-tech interface with smooth animations and intuitive visual hierarchy (focused on clarity over decoration).

## 🧩 How It Works

1. **Location Entry**: User enters their city or ZIP code.
2. **Data Fetching**: System fetches region-specific election data via Google Civic API.
3. **Context Selection**: User identifies their status (first-time, registered, moved, etc.).
4. **Roadmap Generation**: The decision engine generates:
   - A personalized checklist
   - A structured timeline
   - The next recommended action
5. **AI Guidance**: The VotePath Assistant provides contextual explanations for each step.

This ensures users are not just informed — they are **guided**.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Validation**: Zod
- **AI**: Google Gemini API (controlled and scoped)
- **APIs**:
  - Google Civic Information API
  - Google Maps Places & Geocoding
- **Testing**:
  - Jest (unit)
  - Playwright (E2E)
- **Deployment**:
  - GitHub + Google Cloud Run

## ☁️ Deployment

The application is containerized and deployed using **Google Cloud Run**, ensuring scalability and production readiness.

**Workflow**:
`GitHub` → `Build` → `Container` → `Cloud Run Deployment`

The app is designed to run in a stateless, serverless environment with minimal infrastructure overhead, matching the NIST-aligned security mandate.

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ashu27198mastud-design/voter.git
   cd voter
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file and add your API keys:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_key
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key
   NEXT_PUBLIC_CIVIC_API_KEY=your_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Run Tests**:
   ```bash
   npm test          # Unit tests
   npm run test:e2e  # Playwright tests
   ```

## 📜 AI System Rules & Compliance

The integrated AI assistant obeys 4 core mandates:
1. **Strict Neutrality**: No political opinions or candidate endorsements.
2. **Factual Grounding**: Answers based strictly on verified Civic API data.
3. **Clarity & Format**: Complex jargon is simplified; timelines are rendered visually.
4. **Scope Lock**: Refuses any non-civic/election related queries.

## 📄 License

MIT
