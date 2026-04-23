import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GLOBAL_CONFIG } from '@/constants/regions';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const ElectionContextSchema = z.object({
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().min(1).max(10),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ElectionContextResult {
  location: string;
  countryCode: string;
  officialGuidance: string | null;
  keySteps: string[];
  requiredDocuments: string[];
  recentUpdates: string[];
  fallbackSummary: string;
  verificationNote: string;
  hasOfficialData: boolean;
}

// ---------------------------------------------------------------------------
// Static recent-updates registry
//
// This is curated, factual, non-partisan election process guidance per country.
// It deliberately avoids candidate names, poll predictions, or party news.
// Extend this map as new election cycles are confirmed.
// ---------------------------------------------------------------------------

const RECENT_UPDATES: Record<string, string[]> = {
  IN: [
    'The Election Commission of India (ECI) oversees all general and state elections.',
    'Several state Legislative Assembly elections are scheduled for 2026, including West Bengal, Tamil Nadu, and Kerala.',
    'Voters can check their electoral roll status at voters.eci.gov.in.',
    'EPIC (Voter ID card) or any of 12 alternate photo IDs are accepted at polling booths.',
    'Persons with Disabilities (PwD) and senior citizens (80+) can apply for postal ballots.',
  ],
  GB: [
    'UK voters are now required to show an accepted photo ID at polling stations — a rule introduced from 2023.',
    'If you do not have an accepted ID, you can apply for a free Voter Authority Certificate at gov.uk.',
    'Register to vote at gov.uk/register-to-vote; the deadline is typically 12 working days before polling day.',
    'You can vote by post or by proxy if you cannot attend in person.',
  ],
  CA: [
    'Elections Canada manages federal elections; provincial elections are managed by each province\'s electoral authority.',
    'You can register to vote or update your address at elections.ca.',
    'Acceptable IDs include a driver\'s license or any two documents showing name and address.',
    'Advance polling and special ballots are available for those who cannot vote on election day.',
  ],
  US: [
    'Voter registration deadlines vary by state; check vote.gov for your state\'s deadline.',
    'Photo ID requirements differ by state — some require it, others do not.',
    'Early voting, absentee voting, and mail-in ballots are available in most states.',
    'Find your polling place at vote.gov or your state\'s Secretary of State website.',
  ],
  AU: [
    'Voting is compulsory for all enrolled citizens aged 18 and over in federal elections.',
    'Enrol or update your enrolment at aec.gov.au before the electoral roll closes.',
    'Polling places are open from 8 am to 6 pm on election day.',
    'Early voting (pre-poll) centres open several weeks before election day.',
  ],
  DE: [
    'German federal elections are held every four years; the next Bundestag election is scheduled for 2025.',
    'You must be registered at your local municipality (Einwohnermeldeamt) to receive a polling card.',
    'Postal voting (Briefwahl) is available on request — apply to your local electoral office.',
    'Official election information is available at bundeswahlleiter.de.',
  ],
  FR: [
    'French elections include Presidential, Legislative, and Municipal rounds.',
    'Voters must be on the electoral list — register at service-public.fr.',
    'Valid ID (national ID card or passport) is required to vote in person.',
    'Proxy voting is permitted if you cannot attend in person.',
  ],
  JP: [
    'Japanese voters must be registered in their resident municipality.',
    'A voter notification card (投票所入場券) is sent by the local authority before each election.',
    'Bring the notification card and any valid ID to your designated polling station.',
    'Absentee voting is available for those travelling or unable to vote locally.',
  ],
};

/** Returns the best matching country code from a 2-letter ISO code or common alias. */
function normaliseCountryCode(raw: string): string {
  const upper = raw.toUpperCase().trim();
  // Common aliases
  const aliases: Record<string, string> = {
    UK: 'GB',
    INDIA: 'IN',
    USA: 'US',
    AMERICA: 'US',
    AUSTRALIA: 'AU',
    GERMANY: 'DE',
    FRANCE: 'FR',
    JAPAN: 'JP',
    CANADA: 'CA',
  };
  return aliases[upper] ?? upper;
}

/** Builds a human-readable location label. */
function buildLocationLabel(city: string, state: string, country: string): string {
  const parts = [city, state !== 'Global' && state !== city ? state : '', country]
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(parts)].join(', ');
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ElectionContextSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { city, state, country } = parsed.data;
    const countryCode = normaliseCountryCode(country);
    const locationLabel = buildLocationLabel(city, state, country);

    const regionalConfig = GLOBAL_CONFIG[countryCode] ?? null;
    const recentUpdates = RECENT_UPDATES[countryCode] ?? [];

    const hasOfficialData = regionalConfig !== null;

    const officialGuidance = hasOfficialData ? regionalConfig.process : null;
    const keySteps = hasOfficialData ? regionalConfig.steps : [];
    const requiredDocuments = hasOfficialData ? regionalConfig.documents : [];

    const fallbackSummary = hasOfficialData
      ? `Official election guidance is available for ${locationLabel}.`
      : [
          `Specific election process data for ${locationLabel} is not available in our regional database.`,
          'For authoritative guidance, please consult your national or local election authority.',
          'General civic steps typically include: verifying your registration status, obtaining acceptable photo ID, ',
          'locating your polling place, and understanding your country\'s voting method.',
        ].join(' ');

    const verificationNote = hasOfficialData
      ? `This guidance reflects the established process for ${countryCode}. ` +
        'Verify exact dates and deadlines with your official national election authority.'
      : 'No regional configuration found. Information provided is general civic guidance only. ' +
        'Always verify with your official national election authority.';

    const result: ElectionContextResult = {
      location: locationLabel,
      countryCode,
      officialGuidance,
      keySteps,
      requiredDocuments,
      recentUpdates,
      fallbackSummary,
      verificationNote,
      hasOfficialData,
    };

    logger.info('Election context generated', { location: locationLabel, countryCode, hasOfficialData });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Election context route error', { error: message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
