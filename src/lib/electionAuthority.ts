import { UserLocation } from '@/types';

export interface AuthorityGuidance {
  authority: string;
  keyInfo: string[];
  nextSteps: string[];
  verificationNote: string;
}

export function getElectionAuthorityGuidance(location?: UserLocation | null): AuthorityGuidance {
  const defaultGuidance: AuthorityGuidance = {
    authority: 'your local election authority',
    keyInfo: [
      'Verify your voter registration status',
      'Check required documents',
      'Confirm official election dates'
    ],
    nextSteps: [
      'Check your voter status on the official portal',
      'Confirm your polling booth location',
      'Keep an approved photo ID ready before election day'
    ],
    verificationNote: 'Live dates, voter status, and polling booth details must be verified with the official election authority.'
  };

  if (!location) {
    return defaultGuidance;
  }

  const { country, state, city } = location;

  if (country === 'IN' || country === 'Bharat' || country === 'India') {
    let specificAuthority = 'Election Commission of India and your State Chief Electoral Officer';
    
    // State-specific overrides
    if (state === 'TG' || state === 'Telangana') specificAuthority = 'Election Commission of India and Chief Electoral Officer, Telangana';
    else if (state === 'TN' || state === 'Tamil Nadu') specificAuthority = 'Election Commission of India and Chief Electoral Officer, Tamil Nadu';
    else if (state === 'WB' || state === 'West Bengal') specificAuthority = 'Election Commission of India and Chief Electoral Officer, West Bengal';
    else if (state === 'MH' || state === 'Maharashtra') specificAuthority = 'Election Commission of India and Chief Electoral Officer, Maharashtra';
    else if (state === 'DL' || state === 'Delhi' || state === 'New Delhi') specificAuthority = 'Election Commission of India and Chief Electoral Officer, Delhi';
    else if (state === 'KA' || state === 'Karnataka') specificAuthority = 'Election Commission of India and Chief Electoral Officer, Karnataka';

    return {
      authority: specificAuthority,
      keyInfo: [
        'EPIC/voter ID requirements',
        'Electoral roll inclusion',
        'Polling booth confirmation',
        'Approved photo ID types'
      ],
      nextSteps: [
        'Visit the official ECI voter portal',
        `Check ${specificAuthority} updates`,
        'Confirm your name in the electoral roll and polling booth'
      ],
      verificationNote: `Sources to verify: ${specificAuthority}.`
    };
  }

  if (country === 'AU' || country === 'Australia') {
    return {
      authority: 'Australian Electoral Commission (AEC)',
      keyInfo: [
        'Enrolment status',
        'Your specific electorate',
        'Polling place locations',
        'Postal voting options'
      ],
      nextSteps: [
        'Visit the AEC website to check your enrolment',
        'Find your local polling place',
        'Review early or postal voting eligibility if needed'
      ],
      verificationNote: 'Sources to verify: Australian Electoral Commission.'
    };
  }

  if (country === 'GB' || country === 'UK' || country === 'United Kingdom') {
    return {
      authority: 'gov.uk and your local electoral registration office',
      keyInfo: [
        'Voter registration deadlines',
        'Accepted photo ID (now required for voting)',
        'Polling station locations'
      ],
      nextSteps: [
        'Register to vote or check your status on gov.uk',
        'Ensure you have an accepted form of photo ID',
        'Find your designated polling station'
      ],
      verificationNote: 'Sources to verify: gov.uk and your local council.'
    };
  }

  if (country === 'US' || country === 'United States') {
    return {
      authority: 'vote.gov and your relevant state election office',
      keyInfo: [
        'Voter registration status and deadlines',
        'Polling place locations and hours',
        'Early voting and absentee ballot rules'
      ],
      nextSteps: [
        'Check your registration status at vote.gov',
        'Request an absentee ballot if applicable',
        'Confirm your polling place before election day'
      ],
      verificationNote: 'Sources to verify: vote.gov and your state election office.'
    };
  }

  if (country === 'CA' || country === 'Canada') {
    return {
      authority: 'Elections Canada or your relevant provincial election authority',
      keyInfo: [
        'Voter registration status',
        'Required identification to vote',
        'Advance polling options'
      ],
      nextSteps: [
        'Check your registration via the Elections Canada portal',
        'Review accepted forms of ID',
        'Locate your polling station or advance polling location'
      ],
      verificationNote: 'Sources to verify: Elections Canada and provincial election authorities.'
    };
  }

  // Generic fallback with localized context
  const fallback = { ...defaultGuidance };
  if (city && city !== 'Unknown') {
    fallback.authority = `the official election authority for ${city}, ${state !== 'Unknown' ? state : country}`;
  }
  return fallback;
}
