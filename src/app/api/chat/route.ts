import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { AI_SYSTEM_PROMPT } from '@/config/aiPrompt';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeHtml } from '@/lib/security';
import { LocationSchema, QuerySchema } from '@/lib/validation';
import { ElectionContextResult } from '@/types';
import { searchElectionSources } from '@/services/searchGrounding';
import { isLocationLikeQuery, extractLocationIntent } from '@/lib/locationIntelligence';
import { getElectionAuthorityGuidance } from '@/lib/electionAuthority';

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
      const guidance = getElectionAuthorityGuidance(null);
      return NextResponse.json(
        { response: sanitizeHtml(`
<strong>Direct answer</strong><br />
I am currently operating in verified data mode.
<br /><br />
<strong>Key information</strong>
<ul>
${guidance.keyInfo.map(info => `<li>${info}</li>`).join('')}
</ul>
<br />
<strong>What you should do next</strong>
<ol>
${guidance.nextSteps.map(step => `<li>${step}</li>`).join('')}
</ol>
<br />
<strong>Sources / verification</strong><br />
<p>${guidance.verificationNote}</p>
        `.trim()) },
        { status: 200 },
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

    let query = parsedQuery.data.query;
    let location = parsedLocation?.success ? parsedLocation.data : null;

    // Smart location normalization: If query has location intent, use it as context
    if (!location) {
      const intent = extractLocationIntent(query);
      if (intent) {
        location = intent;
        if (isLocationLikeQuery(query)) {
          query = `What is the election process in ${intent.city}, ${intent.state}, ${intent.country}?`;
        }
      }
    }

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

    // New logic: Trigger search grounding if context is missing or specific intent is detected
    let searchGroundingContent = '';
    const needsSearch = 
      !grounding || 
      /current|latest|status|deadline|registration|polling|how to|where is/i.test(query) ||
      (location && query.toLowerCase().includes(location.city.toLowerCase()));

    if (needsSearch) {
      try {
        const searchResults = await searchElectionSources(query, location as { city: string; state: string; country: string } | undefined);
        if (searchResults.length > 0) {
          searchGroundingContent = `SEARCH_GROUNDING:\n${searchResults.map(r => `[${r.title}]\n${r.snippet}\nSource: ${r.link}`).join('\n\n')}`;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('Search grounding failed during chat', { error: message });
      }
    }

    const fullPrompt = [
      `SYSTEM INSTRUCTIONS: ${AI_SYSTEM_PROMPT}`,
      grounding,
      searchGroundingContent,
      `RESPONSE FORMAT: ${RESPONSE_FORMAT}`,
      `USER QUESTION: ${query}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest',
        tools: [{ googleSearch: {} }] as never
      });
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();
      
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }
      
      return NextResponse.json({ response: sanitizeHtml(responseText) });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.warn('Gemini 1.5 Flash failed, attempting Pro fallback', { error: errorMessage });
      // Fallback 1: Gemini Pro
      try {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-pro-latest',
          tools: [{ googleSearch: {} }] as never
        });
        const result = await model.generateContent(fullPrompt);
        return NextResponse.json({ response: sanitizeHtml(result.response.text()) });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error('All Gemini models failed', { error: errorMessage });

        // If we have a verified context (ctx), generate a helpful static response
        const ctx = location
          ? await fetchElectionContext(req, location.city, location.state, location.country)
          : null;

        if (ctx && ctx.hasOfficialData) {
          return NextResponse.json({
            response: sanitizeHtml(`
**Election Information for ${ctx.location}**

I am currently experiencing a service interruption with my primary AI engine, but I can provide you with verified registry data for your location:

- **Process**: ${ctx.officialGuidance}
- **Required Documents**: ${ctx.requiredDocuments.join(', ')}
- **Key Steps**: ${ctx.keySteps.join(' → ')}

${ctx.verifiedUpdates.length > 0 ? `*Verification Note: ${ctx.verifiedUpdates[0]}*` : ''}

Please use your personalized roadmap below for a full step-by-step guide.
            `),
          });
        }

        // Global smart fallback if no specific context exists
        const guidance = getElectionAuthorityGuidance(location);
        const regionText = location ? `${location.city}, ${location.state}, ${location.country}` : 'your region';
        
        return NextResponse.json({
          response: sanitizeHtml(`
<strong>Direct answer</strong><br />
For ${regionText}, verify live voter status and election dates through the ${guidance.authority}.
<br /><br />
<strong>Key information</strong>
<ul>
${guidance.keyInfo.map(info => `<li>${info}</li>`).join('')}
</ul>
<br />
<strong>What you should do next</strong>
<ol>
${guidance.nextSteps.map(step => `<li>${step}</li>`).join('')}
</ol>
<br />
<strong>Sources / verification</strong><br />
<p>${guidance.verificationNote}</p>
          `.trim()),
        });
      }
    }
  } catch (error: unknown) {
    logger.error('Chat API fatal error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
