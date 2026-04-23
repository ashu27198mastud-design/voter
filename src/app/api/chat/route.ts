import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { AI_SYSTEM_PROMPT } from '@/config/aiPrompt';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeHtml } from '@/lib/security';
import { LocationSchema, QuerySchema } from '@/lib/validation';
import { ElectionContextResult } from '@/types';

async function fetchElectionContext(
  req: NextRequest,
  city: string,
  state: string,
  country: string,
): Promise<ElectionContextResult | null> {
  try {
    const { origin } = new URL(req.url);
    const res = await fetch(`${origin}/api/election-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, state, country }),
      cache: 'no-store',
    });

    if (!res.ok) {
      logger.warn('Election context lookup failed', { status: res.status });
      return null;
    }

    return (await res.json()) as ElectionContextResult;
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('Missing GEMINI_API_KEY');
      return NextResponse.json(
        { response: 'Assistant is offline (API Key Missing).' },
        { status: 503 },
      );
    }

    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for') ?? 'unknown';
    const clientKey = forwardedFor.split(',')[0]?.trim() || 'unknown';
    const rate = checkRateLimit(clientKey);

    if (!rate.allowed) {
      logger.warn('Rate limit exceeded', { clientKey });
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429 },
      );
    }

    const body: unknown = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const rawQuery = (body as { query?: unknown }).query;
    const rawLocation = (body as { location?: unknown }).location;

    const parsedQuery = QuerySchema.safeParse({ query: rawQuery });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    const parsedLocation = rawLocation
      ? LocationSchema.safeParse(rawLocation)
      : null;

    if (rawLocation && !parsedLocation?.success) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }

    const query = parsedQuery.data.query;
    const location = parsedLocation?.success ? parsedLocation.data : null;

    let grounding = '';
    if (location) {
      const ctx = await fetchElectionContext(
        req,
        location.city,
        location.state,
        location.country,
      );

      if (ctx) {
        grounding = `VERIFIED REGISTRY CONTEXT: ${JSON.stringify(ctx)}`;
      }
    }

    const fullPrompt = [
      `SYSTEM INSTRUCTIONS: ${AI_SYSTEM_PROMPT}`,
      grounding,
      `RESPONSE FORMAT: ${RESPONSE_FORMAT}`,
      `USER QUESTION: ${query}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    const primaryModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
      const result = await primaryModel.generateContent(fullPrompt);
      const text = result.response.text();
      return NextResponse.json({ response: sanitizeHtml(text) });
    } catch (primaryError: unknown) {
      logger.error('Primary Gemini call failed', {
        error:
          primaryError instanceof Error ? primaryError.message : String(primaryError),
      });

      try {
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const fallbackResult = await fallbackModel.generateContent(fullPrompt);
        return NextResponse.json({
          response: sanitizeHtml(fallbackResult.response.text()),
        });
      } catch (fallbackError: unknown) {
        logger.error('Fallback Gemini call failed', {
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });

        return NextResponse.json({
          response:
            "I'm having trouble connecting to my knowledge base. Please try again in a moment.",
        });
      }
    }
  } catch (error: unknown) {
    logger.error('Chat API fatal error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
