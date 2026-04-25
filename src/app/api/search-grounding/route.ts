import { NextRequest, NextResponse } from 'next/server';
import { QuerySchema, LocationSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';
import { searchElectionSources } from '@/services/searchGrounding';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const queryResult = QuerySchema.safeParse({ query: body.query });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    const locationResult = body.location ? LocationSchema.safeParse(body.location) : { success: true, data: undefined };
    if (!locationResult.success) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }

    const results = await searchElectionSources(
      queryResult.data.query, 
      locationResult.data as { city: string; state: string; country: string } | undefined
    );
    
    logger.info('Search grounding performed', { query: queryResult.data.query });
    
    return NextResponse.json(results);
  } catch (error) {
    logger.error('Search grounding route error', { error });
    return NextResponse.json([], { status: 200 }); // Fail gracefully with empty results
  }
}
