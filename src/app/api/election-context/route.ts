import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GLOBAL_CONFIG } from '@/constants/regions';
import { logger } from '@/lib/logger';
import { ElectionContextResult } from '@/types';

// Input validation
const ElectionContextSchema = z.object({
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().min(1).max(10),
});

/**
 * VERIFIED_REGIONAL_FACTS: Curated, non-partisan election process guidance.
 * Refined wording to indicate these are verified registry facts rather than live news.
 */
const VERIFIED_REGIONAL_FACTS: Record<string, string[]> = {
  IN: [
    'General and state elections are managed by the Election Commission of India (ECI).',
    'Registry Status: Several state assembly cycles are noted for 2026 (WB, TN, Kerala).',
    'Verified voter ID requirements: EPIC card or any of 12 approved photo ID documents.',
    'Accessibility: Postal ballot facilities exist for PwD and senior citizens (80+).',
  ],
  GB: [
    'UK polling stations require accepted photo ID as of 2023 regulations.',
    'Alternative: Free Voter Authority Certificates are available via gov.uk for those without ID.',
    'Process: Registration is mandatory and typically closes 12 working days before polling.',
  ],
  CA: [
    'Federal cycles are managed by Elections Canada; provinces maintain separate registries.',
    'Registration: Address updates can be performed online at elections.ca.',
    'Requirement: Two pieces of identification showing name and address are mandatory.',
  ],
  US: [
    'Note: State-level variations apply for registration deadlines and ID requirements.',
    'Guidance: Consult vote.gov for specific state Secretary of State instructions.',
    'Access: Early voting and absentee ballot rules vary by jurisdiction.',
  ],
};

function normaliseCountryCode(raw: string): string {
  const upper = raw.toUpperCase().trim();
  const aliases: Record<string, string> = { 'UK': 'GB', 'INDIA': 'IN', 'USA': 'US', 'AMERICA': 'US' };
  return aliases[upper] ?? upper;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ElectionContextSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const { city, state, country } = parsed.data;
    const countryCode = normaliseCountryCode(country);
    const regionalConfig = GLOBAL_CONFIG[countryCode] ?? null;
    const hasOfficialData = regionalConfig !== null;

    const result: ElectionContextResult = {
      location: `${city}, ${state}, ${country}`,
      countryCode,
      officialGuidance: regionalConfig?.process ?? null,
      keySteps: regionalConfig?.steps ?? [],
      requiredDocuments: regionalConfig?.documents ?? [],
      verifiedUpdates: VERIFIED_REGIONAL_FACTS[countryCode] ?? [],
      fallbackSummary: hasOfficialData 
        ? `Official election guidance is available for ${countryCode} in our registry.` 
        : `Specific process data for this region is not currently in our verified registry.`,
      verificationNote: `Cross-reference all dates with your official national electoral authority.`,
      hasOfficialData,
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Election context route error', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
