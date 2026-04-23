import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SYSTEM_PROMPT } from '@/constants/prompts';
import { QuerySchema, LocationSchema } from '@/lib/validation';
import { sanitizeHtml } from '@/lib/security';
import { logger } from '@/lib/logger';
import type { ElectionContextResult } from '@/app/api/election-context/route';

// ---------------------------------------------------------------------------
// Internal helper — fetch election context from our own route.
// Called server-side so there is no cross-origin overhead.
// ---------------------------------------------------------------------------

async function fetchElectionContext(
  city: string,
  state: string,
  country: string
): Promise<ElectionContextResult | null> {
  try {
    // Build an absolute URL so fetch() works in the server runtime
    const baseUrl = process.env.NEXTAUTH_URL
      ?? process.env.NEXT_PUBLIC_APP_URL
      ?? 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/election-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, state, country }),
      // Never cache — we want fresh context per request
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return (await res.json()) as ElectionContextResult;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Build the grounded context block that is injected into the Gemini prompt
// ---------------------------------------------------------------------------

function buildGroundingBlock(ctx: ElectionContextResult): string {
  const lines: string[] = [
    `=== ELECTION CONTEXT FOR ${ctx.location.toUpperCase()} ===`,
    `Country code : ${ctx.countryCode}`,
    `Has official data : ${ctx.hasOfficialData ? 'YES' : 'NO — use fallback only'}`,
    '',
  ];

  if (ctx.officialGuidance) {
    lines.push('OFFICIAL PROCESS GUIDANCE:', ctx.officialGuidance, '');
  }

  if (ctx.keySteps.length > 0) {
    lines.push('KEY VOTING STEPS:', ctx.keySteps.map((s, i) => `  ${i + 1}. ${s}`).join('\n'), '');
  }

  if (ctx.requiredDocuments.length > 0) {
    lines.push('REQUIRED DOCUMENTS:', ctx.requiredDocuments.map((d) => `  - ${d}`).join('\n'), '');
  }

  if (ctx.recentUpdates.length > 0) {
    lines.push('RECENT UPDATES / NOTEWORTHY INFORMATION:',
      ctx.recentUpdates.map((u) => `  • ${u}`).join('\n'), '');
  }

  lines.push('FALLBACK SUMMARY:', ctx.fallbackSummary, '');
  lines.push('VERIFICATION NOTE:', ctx.verificationNote);
  lines.push('=== END ELECTION CONTEXT ===');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Response structure instruction injected into every prompt
// ---------------------------------------------------------------------------

const RESPONSE_FORMAT_INSTRUCTION = `
Structure your response using the following sections where relevant.
Use plain language — avoid jargon:

**Election update for [location]**
[One sentence on the current election landscape for this location]

**Recent developments**
[Bullet points from the RECENT UPDATES section of the context above.
 Only cite what is explicitly in the context. Do not invent facts.]

**Official guidance**
[Summarise the official process and key steps from context]

**What this means for you**
[Plain-language interpretation relevant to the user's question]

**Your next step**
[Single, clear, actionable next step]

**Verification note**
[Repeat the verification note from context verbatim — do not modify it]

IMPORTANT: If the context says "Has official data: NO", begin your response with:
"I cannot find verified election data for that location at this time."
and base your answer only on the fallback summary provided.
`.trim();

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, location } = body;

    // 1. Validate inputs
    const validated = QuerySchema.parse({ query });
    const validatedLocation = location ? LocationSchema.parse(location) : null;

    // 2. API key guard
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        response: 'AI service is currently unavailable. Please ensure GEMINI_API_KEY is configured.',
      });
    }

    // 3. Fetch grounding context (non-blocking — proceed even on failure)
    let groundingBlock = '';
    if (validatedLocation) {
      const ctx = await fetchElectionContext(
        validatedLocation.city,
        validatedLocation.state,
        validatedLocation.country
      );
      if (ctx) {
        groundingBlock = buildGroundingBlock(ctx);
      }
    }

    // 4. Build final prompt
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const locationLine = validatedLocation
      ? `User location: ${validatedLocation.city}, ${validatedLocation.state}, ${validatedLocation.country}`
      : 'User location: not provided';

    const prompt = [
      `Current date: ${currentDate}`,
      locationLine,
      '',
      groundingBlock || '(No regional election context available — apply general fallback guidance.)',
      '',
      RESPONSE_FORMAT_INSTRUCTION,
      '',
      `User question: ${validated.query}`,
    ].join('\n');

    // 5. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: AI_SYSTEM_PROMPT,
    });

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      logger.info('AI Chat successful', {
        query: validated.query,
        location: validatedLocation?.city ?? 'unknown',
        hasGrounding: groundingBlock.length > 0,
      });

      return NextResponse.json({ response: sanitizeHtml(responseText) });

    } catch (aiError) {
      const message = aiError instanceof Error ? aiError.message : String(aiError);
      logger.warn('Gemini API failed, using context fallback', { error: message });

      // Graceful fallback: return the fallback summary from the context if available
      const fallback = groundingBlock.includes('FALLBACK SUMMARY:')
        ? groundingBlock
            .split('FALLBACK SUMMARY:')[1]
            ?.split('\n')[1]
            ?.trim() ?? ''
        : '';

      const fallbackResponse = fallback.length > 0
        ? `The AI assistant is temporarily offline. Based on your location: ${fallback}`
        : 'The VotePath Assistant is temporarily offline. Please follow the steps in your personalized roadmap.';

      return NextResponse.json({ response: sanitizeHtml(fallbackResponse) });
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('Chat route error', { error: message, stack });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
