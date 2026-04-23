import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SYSTEM_PROMPT } from '@/config/aiPrompt';
import { QuerySchema, LocationSchema } from '@/lib/validation';
import { sanitizeHtml } from '@/lib/security';
import { logger } from '@/lib/logger';
import { ElectionContextResult } from '@/types';

async function fetchElectionContext(req: NextRequest, city: string, state: string, country: string): Promise<ElectionContextResult | null> {
  try {
    const { origin } = new URL(req.url);
    const res = await fetch(`${origin}/api/election-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, state, country }),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    logger.error('Context fetch error', { error: String(error) });
    return null;
  }
}

const RESPONSE_FORMAT = `
Structure your response exactly as follows:
**Election update for [location]**
[Context]

**Key regional information**
[Registry facts]

**Official guidance**
[Steps/Docs]

**What this means for you**
[Summary]

**Your next step**
[Action]

**Verification note**
[Verbatim note]
`;

export async function POST(req: NextRequest) {
  try {
    const { query, location } = await req.json();
    
    // API Key guard
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ response: "Assistant is offline (API Key Missing)." });
    }

    // 1. Context Grounding
    let grounding = "";
    try {
      const validatedLoc = location ? LocationSchema.parse(location) : null;
      if (validatedLoc) {
        const ctx = await fetchElectionContext(req, validatedLoc.city, validatedLoc.state, validatedLoc.country);
        if (ctx) grounding = `VERIFIED REGISTRY CONTEXT: ${JSON.stringify(ctx)}`;
      }
    } catch (e) {
      logger.warn('Grounding skipped due to location parse error');
    }

    // 2. Build Prompt
    const fullPrompt = [
      `SYSTEM INSTRUCTIONS: ${AI_SYSTEM_PROMPT}`,
      grounding,
      `RESPONSE FORMAT: ${RESPONSE_FORMAT}`,
      `USER QUESTION: ${query}`
    ].join('\n\n');

    // 3. Gemini Call
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using a more explicit model path that works across v1/v1beta
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      return NextResponse.json({ response: sanitizeHtml(text) });
    } catch (aiErr: any) {
      logger.error('Gemini call failed', { error: aiErr.message });
      
      // Attempt legacy model fallback
      try {
        const fallback = genAI.getGenerativeModel({ model: "gemini-pro" });
        const res2 = await fallback.generateContent(fullPrompt);
        return NextResponse.json({ response: sanitizeHtml(res2.response.text()) });
      } catch {
        return NextResponse.json({ response: "I'm having trouble connecting to my knowledge base. Please try again in a moment." });
      }
    }

  } catch (error: any) {
    logger.error('Chat API Fatal', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
