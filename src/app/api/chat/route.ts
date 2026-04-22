import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SYSTEM_PROMPT } from '@/config/aiPrompt';
import { QuerySchema } from '@/lib/validation';
import { sanitizeHtml } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, location } = body;

    // 1. Validate Input
    const validated = QuerySchema.parse({ query });

    // 2. Get API Key (Server-side only, no NEXT_PUBLIC_)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
    }

    // 3. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      systemInstruction: AI_SYSTEM_PROMPT
    });

    const locationContext = location 
      ? `User location: ${location.city}, ${location.state}, ${location.country}.`
      : "User location: Unknown.";

    const prompt = `
      ${locationContext}
      User question: ${validated.query}
      Provide a factual, nonpartisan answer about the election PROCESS only.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 4. Sanitize and Return
    return NextResponse.json({ response: sanitizeHtml(responseText) });

  } catch (error: any) {
    console.error('API Chat Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
