# 🗳️ Election Process Education Assistant

A futuristic, non-partisan interactive web application designed to help users navigate the voting process. Built for the PromptWars challenge, this app provides localized election timelines, registration guidance, and an AI-powered educational guide.

## ✨ Features

- **📍 Localized Election Timelines**: Fetches real-time election data from the Google Civic Information API based on your location.
- **🤖 Non-Partisan AI Assistant**: A Gemini-powered chat interface that follows strict educational and neutrality rules to explain civic procedures.
- **🔍 Auto-Search as you Type**: High-performance location input with debounced predictive search and instant Zip Code detection.
- **🔒 Security First**: 
  - NIST-aligned data minimization (Zero-backend architecture).
  - Strict Zod input validation.
  - Content Security Policy (CSP) headers.
  - Output sanitization using DOMPurify.
- **🎨 Premium UX**: 3D Pixar-inspired design with smooth Framer Motion animations and claymorphism aesthetics.
- **♿ Fully Accessible**: WCAG 2.1 AA compliant with full keyboard navigation and screen reader support.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Validation**: Zod
- **AI**: Google Gemini API
- **Maps**: Google Maps Places & Geocoding
- **Data**: Google Civic Information API
- **Testing**: Jest & Playwright

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

## 📜 AI System Rules (PromptWars Compliance)

The integrated AI assistant obeys 4 core mandates:
1. **Strict Neutrality**: No political opinions or candidate endorsements.
2. **Factual Grounding**: Answers based strictly on verified Civic API data.
3. **Clarity & Format**: Complex jargon is simplified; timelines are rendered visually.
4. **Scope Lock**: Refuses any non-civic/election related queries.

## 📄 License

MIT
