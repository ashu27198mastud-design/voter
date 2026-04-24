import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { QuerySchema, LocationSchema } from '@/lib/validation';
import { searchElectionSources } from '@/services/searchGrounding';
import { logger } from '@/lib/logger';
import { sanitizeHtml } from '@/lib/security';

/**
 * API Route for Search Grounding
 * Provides sanitized search results from official election sources.
 */
export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for') ?? 'unknown';
    const clientKey = forwardedFor.split(',')[0]?.trim() || 'unknown';
    
    const rate = checkRateLimit(`search_${clientKey}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many search requests. Please try again shortly.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate inputs
    const queryResult = QuerySchema.safeParse({ query: body.query });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    const locationResult = body.location 
      ? LocationSchema.safeParse(body.location) 
      : { success: true, data: undefined };
    
    if (!locationResult.success) {
      return NextResponse.json({ error: 'Invalid location data' }, { status: 400 });
    }

    const results = await searchElectionSources(
      queryResult.data.query, 
      locationResult.data as { city: string; state: string; country: string } | undefined
    );

    // Sanitize snippets before returning
    const sanitizedResults = results.map(r => ({
      ...r,
      snippet: sanitizeHtml(r.snippet)
    }));

    return NextResponse.json({ results: sanitizedResults });
  } catch (error) {
    logger.error('Search grounding API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
