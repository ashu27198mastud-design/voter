import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { queryVoterInfo, queryRepresentatives } from '@/utils/civicApi';
import { logger } from '@/lib/logger';

/**
 * RULE 1 & 2 - Civic API Proxy:
 * Securely handles requests to the Google Civic Information API via dedicated utility.
 * Enforces Zod validation on inputs and maintains strict data minimization.
 */

const ParamsSchema = z.object({
  address: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9\s,.\-#/()]+$/, 'Invalid characters in address'),
  type: z.enum(['voterinfo', 'representatives']).default('voterinfo'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const type = searchParams.get('type') || 'voterinfo';

    const validated = ParamsSchema.safeParse({ address, type });

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { address: cleanAddress, type: cleanType } = validated.data;

    // DATA MINIMIZATION: Pass to utility, then it's discarded
    const data = cleanType === 'representatives'
      ? await queryRepresentatives(cleanAddress)
      : await queryVoterInfo(cleanAddress);

    if (!data) {
      return NextResponse.json(
        { error: 'No data found for this location or API unavailable' },
        { status: 404 }
      );
    }

    logger.info('Civic API Fetch Successful', { type: cleanType });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Civic API Route error', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
