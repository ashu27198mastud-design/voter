import { VoterInfoResponse } from '@/services/civic';
import { TimelineStep, VoterContext } from '../types';
import { GLOBAL_CONFIG } from '../constants/regions';

/**
 * Transforms raw Civic API VoterInfoResponse and user context into a structured list of TimelineSteps.
 * This is a pure function for better testability and performance.
 */
export function generateTimeline(
  voterInfo: VoterInfoResponse | null,
  context: VoterContext,
  location: { countryCode?: string, city?: string } | null = null
): TimelineStep[] {
  const steps: TimelineStep[] = [];
  const today = new Date();
  const countryCode = location?.countryCode || 'US';
  const fallback = GLOBAL_CONFIG[countryCode];

  const electionName = voterInfo?.election?.name || (fallback ? `Upcoming ${countryCode} Election` : 'General Election Guidance');
  const electionDate = voterInfo?.election?.electionDay || 'Check local announcements';
  const electionDateObj = voterInfo?.election?.electionDay ? new Date(voterInfo.election.electionDay) : null;
  const isAfterElection = electionDateObj ? today > electionDateObj : false;

  // 1. Eligibility & Registration
  steps.push({
    id: 'step-registration',
    title: 'Eligibility & Registration',
    description: getRegistrationDesc(context, isAfterElection),
    isCompleted: context.registrationStatus === 'registered',
    status: getRegistrationStatus(context, isAfterElection),
    content: `
      <h3>${countryCode === 'US' ? 'US' : 'General'} Registration Guidelines</h3>
      <p>${fallback?.process || 'Verify your eligibility based on age, citizenship, and residency requirements.'}</p>
      ${fallback?.steps ? `<ul class="list-disc ml-5 mt-2">${fallback.steps.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
    `,
  });

  // 2. Preparation & Documents
  steps.push({
    id: 'step-preparation',
    title: 'Documents & Preparation',
    description: 'Review required identification and ballot items.',
    isCompleted: false,
    status: 'Not Started',
    content: `
      <h3>Required Identification</h3>
      <ul class="list-disc ml-5 mt-2">
        ${(fallback?.documents || ['Government Photo ID', 'Proof of Residency']).map(d => `<li>${d}</li>`).join('')}
      </ul>
    `,
  });

  // 3. Voting Step
  steps.push({
    id: 'step-voting',
    title: 'Casting Your Ballot',
    description: isAfterElection ? 'Voting period has concluded.' : `Target: ${electionDate}`,
    isCompleted: isAfterElection,
    status: isAfterElection ? 'Completed' : 'Not Started',
    pollingAddress: voterInfo?.pollingLocations?.length ? {
      line1: voterInfo.pollingLocations[0].address.line1,
      city: voterInfo.pollingLocations[0].address.city,
      state: voterInfo.pollingLocations[0].address.state,
    } : undefined,
    content: `
      <h3>Election: ${electionName}</h3>
      <p>Date: <strong>${electionDate}</strong></p>
      ${voterInfo?.pollingLocations?.length ? `
        <div class="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
          <strong>Polling Place:</strong><br/>
          ${voterInfo.pollingLocations[0].address.line1}, ${voterInfo.pollingLocations[0].address.city}
        </div>
      ` : `<p class="mt-2">${fallback ? 'Visit your local election commission portal to find your booth.' : 'Locate your designated polling station via official government channels.'}</p>`}
    `,
  });

  return steps;
}

function getRegistrationDesc(context: VoterContext, isAfterElection: boolean): string {
  if (isAfterElection) return 'Official registration for this specific event is closed.';
  if (context.registrationStatus === 'registered') return 'Your registration is reported as active.';
  if (context.registrationStatus === 'unsure') return 'Action Required: Check your registration status immediately.';
  return 'Ensure you are registered to vote before the deadline.';
}

function getRegistrationStatus(context: VoterContext, isAfterElection: boolean): TimelineStep['status'] {
  if (isAfterElection) return 'Not Started';
  if (context.registrationStatus === 'registered') return 'Completed';
  if (context.registrationStatus === 'unsure') return 'In Progress';
  return 'Not Started';
}

export function getNextBestAction(steps: TimelineStep[]) {
  const nextIncomplete = steps.find(s => s.status !== 'Completed');
  if (!nextIncomplete) return { title: 'All set!', action: 'You are ready to vote!' };
  return { title: nextIncomplete.title, action: nextIncomplete.description };
}

export function getReadiness(context: VoterContext, voterInfo: VoterInfoResponse | null) {
  const today = new Date();
  const electionDateObj = voterInfo?.election?.electionDay ? new Date(voterInfo.election.electionDay) : new Date('2026-11-05');
  const isAfterElection = today > electionDateObj;

  if (isAfterElection) return { status: 'warning', text: '📅 Election Passed' };
  if (context.registrationStatus === 'registered') return { status: 'ready', text: '✔ Ready to Vote' };
  if (context.registrationStatus === 'unsure') return { status: 'warning', text: '⚠ Action Required' };
  return { status: 'error', text: '❌ Not Eligible Yet' };
}
