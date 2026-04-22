import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SYSTEM_PROMPT } from '@/config/aiPrompt';
import { QuerySchema } from '@/lib/validation';
import { sanitizeHtml } from '@/lib/security';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, location } = body;

    // 1. Validate Input
    const validated = QuerySchema.parse({ query });

    // 2. Get API Key (Check both internal and legacy prefixed names)
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        response: "AI service is currently unavailable. Please ensure GEMINI_API_KEY is configured in your deployment environment." 
      }, { status: 200 }); // Return as 200 to show message gracefully in chat
    }

    // 3. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);

    const { GLOBAL_CONFIG } = await import('@/lib/election-data');
    const countryCode = location?.countryCode || 'US';
    const regionalData = GLOBAL_CONFIG[countryCode];

    const locationContext = location 
      ? `User location: ${location.city}, ${location.state}, ${location.country}.`
      : "User location: Unknown.";

    const regionalContext = regionalData
      ? `Regional Configuration Data for ${countryCode}:
         - Standard Process: ${regionalData.process}
         - Key Steps: ${regionalData.steps.join(', ')}
         - Required Docs: ${regionalData.documents.join(', ')}`
      : "";

    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    const prompt = `
      Current Date: ${currentDate}
      ${locationContext}
      ${regionalContext}
      User question: ${validated.query}
      Provide a factual, nonpartisan answer about the election PROCESS only.
    `;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: AI_SYSTEM_PROMPT
    });

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      logger.info('AI Chat successful', { query: validated.query });

      // 4. Sanitize and Return
      return NextResponse.json({ response: sanitizeHtml(responseText) });
    } catch (aiError: any) {
      logger.warn('Gemini API failed, using regional fallback', { error: aiError.message });
      
      // Fallback: Provide the regional process summary if available
      const fallbackText = regionalData 
        ? `The VotePath Assistant is temporarily offline, but here is the official process for your region: ${regionalData.process}`
        : "The VotePath Assistant is temporarily offline. Please follow the steps in your personalized roadmap.";
        
      return NextResponse.json({ response: sanitizeHtml(fallbackText) });
    }

  } catch (error: any) {
    logger.error('API Chat Error', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
