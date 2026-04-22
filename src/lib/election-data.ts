import { VoterInfoResponse } from './civic-info';
import { TimelineStep, VoterContext } from '../types';

/**
 * LAYER 2: Fallback Structured Data for global support
 */
export const GLOBAL_CONFIG: Record<string, { steps: string[], documents: string[], process: string }> = {
  'IN': {
    steps: ['Obtain EPIC Card', 'Check Name in Electoral Roll', 'Locate Polling Station', 'Verify Identity at Booth'],
    documents: ['Voter ID (EPIC)', 'Aadhaar Card', 'PAN Card', 'Passport'],
    process: 'Elections in India are managed by the ECI. In 2026, several states (including West Bengal, Tamil Nadu, and Kerala) are scheduled for Legislative Assembly elections. Please check the official ECI portal for specific phase dates. Voters must be on the electoral roll and present a photo ID.'
  },
  'GB': {
    steps: ['Register to Vote', 'Choose Voting Method', 'Receive Poll Card', 'Cast Vote'],
    documents: ['Photo ID (New Requirement)', 'Passport', 'Driving License'],
    process: 'UK elections require registration. Recent law changes now require a valid photo ID to vote in person at polling stations.'
  },
  'CA': {
    steps: ['Check Registration', 'Watch for Voter Information Card', 'Bring ID to Polls', 'Vote'],
    documents: ['Driver\'s License', 'Voter Information Card + ID', 'Two pieces of ID with name'],
    process: 'Elections Canada manages federal elections. You can register at the polls if you are not already on the list.'
  }
};

/**
 * Transforms raw Civic API VoterInfoResponse and user context into a structured list of TimelineSteps.
 * RULE: MULTI-LAYER DATA ARCHITECTURE
 */
export function generateTimelineFromVoterInfo(
  voterInfo: VoterInfoResponse | null,
  context: VoterContext,
  location: { countryCode?: string, city?: string } | null = null
): TimelineStep[] {
  const steps: TimelineStep[] = [];
  const today = new Date();
  const countryCode = location?.countryCode || 'US';
  const fallback = GLOBAL_CONFIG[countryCode];

  // LAYER 1 & 2: Data Extraction
  const electionName = voterInfo?.election?.name || (fallback ? `Upcoming ${countryCode} Election` : 'General Election Guidance');
  const electionDate = voterInfo?.election?.electionDay || 'Check local announcements';
  const electionDateObj = voterInfo?.election?.electionDay ? new Date(voterInfo.election.electionDay) : null;
  const isAfterElection = electionDateObj ? today > electionDateObj : false;

  // 1. Eligibility & Registration Step (Layer 4: Safe Fallback)
  let registrationDesc = 'Ensure you are registered to vote before the deadline.';
  let regStatus: TimelineStep['status'] = 'Not Started';

  if (isAfterElection) {
    registrationDesc = 'Official registration for this specific event is closed.';
    regStatus = 'Not Started';
  } else if (context.registrationStatus === 'registered') {
    registrationDesc = 'Your registration is reported as active.';
    regStatus = 'Completed';
  } else if (context.registrationStatus === 'unsure') {
    registrationDesc = 'Action Required: Check your registration status immediately.';
    regStatus = 'In Progress';
  }

  steps.push({
    id: 'step-registration',
    title: 'Eligibility & Registration',
    description: registrationDesc,
    isCompleted: context.registrationStatus === 'registered',
    status: regStatus,
    content: `
      <h3>${countryCode === 'US' ? 'US' : 'General'} Registration Guidelines</h3>
      <p>${fallback?.process || 'Verify your eligibility based on age, citizenship, and residency requirements.'}</p>
      ${fallback?.steps ? `<ul class="list-disc ml-5 mt-2">${fallback.steps.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
      ${isAfterElection ? '<p class="mt-2 text-amber-600 font-medium">Alternative: Check for same-day registration or future election cycles.</p>' : ''}
    `,
  });

  // 2. Preparation & Documents (Layer 2 Fallback)
  steps.push({
    id: 'step-preparation',
    title: 'Documents & Preparation',
    description: 'Review required identification and ballot items.',
    isCompleted: false,
    status: 'Not Started',
    content: `
      <h3>Required Identification</h3>
      <p>Ensure you have the following documents ready:</p>
      <ul class="list-disc ml-5 mt-2">
        ${(fallback?.documents || ['Government Photo ID', 'Proof of Residency']).map(d => `<li>${d}</li>`).join('')}
      </ul>
      ${context.voterType === 'first-time' ? '<p class="mt-2"><strong>Tip:</strong> Bring an extra proof of address as a backup.</p>' : ''}
    `,
  });

  // 3. Voting Step (Layer 1 Primary / Layer 4 Fallback)
  steps.push({
    id: 'step-voting',
    title: 'Casting Your Ballot',
    description: isAfterElection ? 'Voting period has concluded.' : `Target: ${electionDate}`,
    isCompleted: isAfterElection,
    status: isAfterElection ? 'Completed' : 'Not Started',
    content: `
      <h3>Election: ${electionName}</h3>
      <p>Date: <strong>${electionDate}</strong></p>
      ${voterInfo?.pollingLocations?.length ? `
        <div class="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
          <strong>Poling Place:</strong><br/>
          ${voterInfo.pollingLocations[0].address.line1}, ${voterInfo.pollingLocations[0].address.city}
        </div>
      ` : `<p class="mt-2">${fallback ? 'Visit your local election commission portal to find your booth.' : 'Locate your designated polling station via official government channels.'}</p>`}
      ${context.votingPreference === 'mail' ? '<p class="mt-2"><strong>Mail-In:</strong> Ensure your ballot is postmarked by the deadline.</p>' : ''}
    `,
  });

  // 4. Post-Election
  steps.push({
    id: 'step-post-election',
    title: 'Track & Verify',
    description: 'Monitor results and ballot status.',
    isCompleted: false,
    status: 'Not Started',
    content: `
      <h3>Next Steps</h3>
      <p>Wait for the official results certification. ${context.votingPreference === 'mail' ? 'Use the tracking portal if available to verify receipt.' : 'Keep your poll receipt if provided.'}</p>
    `,
  });

  return steps;
}

/**
 * Calculates the "Next Best Action" based on current context and steps.
 */
export function getNextBestAction(steps: TimelineStep[]): { title: string; action: string } {
  const nextIncomplete = steps.find(s => s.status !== 'Completed');
  if (!nextIncomplete) return { title: 'All set!', action: 'You are ready to vote!' };

  return {
    title: nextIncomplete.title,
    action: nextIncomplete.description
  };
}

/**
 * Determines readiness status
 */
export function getReadinessStatus(context: VoterContext, voterInfo: VoterInfoResponse | null): { status: 'ready' | 'warning' | 'error'; text: string } {
  const today = new Date();
  const electionDateObj = voterInfo?.election?.electionDay ? new Date(voterInfo.election.electionDay) : new Date('2024-11-05');
  const isAfterElection = today > electionDateObj;

  if (isAfterElection) {
    return { status: 'warning', text: '📅 Election Passed' };
  } else if (context.registrationStatus === 'registered') {
    return { status: 'ready', text: '✔ Ready to Vote' };
  } else if (context.registrationStatus === 'unsure') {
    return { status: 'warning', text: '⚠ Action Required' };
  } else {
    return { status: 'error', text: '❌ Not Eligible Yet' };
  }
}
