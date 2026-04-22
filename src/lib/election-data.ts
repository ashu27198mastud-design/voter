import { VoterInfoResponse } from './civic-info';
import { TimelineStep, VoterContext } from '../types';

/**
 * Transforms raw Civic API VoterInfoResponse and user context into a structured list of TimelineSteps.
 * RULE: PERSONALIZED ROADMAP GENERATION
 */
export function generateTimelineFromVoterInfo(
  voterInfo: VoterInfoResponse | null,
  context: VoterContext
): TimelineStep[] {
  const steps: TimelineStep[] = [];

  const today = new Date();
  const electionDateObj = voterInfo?.election?.electionDay ? new Date(voterInfo.election.electionDay) : new Date('2024-11-05');
  const isAfterElection = today > electionDateObj;

  // 1. Eligibility & Registration Step
  let registrationDesc = 'Ensure you are registered to vote before the deadline.';
  let regStatus: TimelineStep['status'] = 'Not Started';

  if (isAfterElection) {
    registrationDesc = 'Registration for this election has closed. Prepare for the next cycle.';
    regStatus = 'Not Started';
  } else if (context.registrationStatus === 'registered') {
    registrationDesc = 'Your registration is reported as active. Verify your details.';
    regStatus = 'Completed';
  } else if (context.registrationStatus === 'unsure') {
    registrationDesc = 'Action Required: Check your current registration status immediately.';
    regStatus = 'In Progress';
  }

  steps.push({
    id: 'step-registration',
    title: 'Eligibility & Registration',
    description: registrationDesc,
    isCompleted: context.registrationStatus === 'registered',
    status: regStatus,
    content: `
      <h3>Registration Guidelines</h3>
      <p>Before you can vote, you must be registered. Deadlines vary by state (typically 15-30 days before election day).</p>
      ${isAfterElection ? `
        <div class="p-3 bg-amber-50 rounded-lg border border-amber-200 mt-2">
          <strong>Deadline Missed?</strong> In some states, you can still register on election day (Same Day Registration). 
          Check if your state allows provisional voting or registration at the polls.
        </div>
      ` : ''}
      ${context.voterType === 'first-time' ? '<p><strong>First-Time Voter Note:</strong> You may need to provide additional ID verification when registering.</p>' : ''}
      ${context.voterType === 'moved' ? '<p><strong>Recently Moved:</strong> You must update your registration with your new address to vote in local races.</p>' : ''}
    `,
  });

  // 2. Preparation Step
  steps.push({
    id: 'step-preparation',
    title: 'Documents & Preparation',
    description: 'Review your local ballot and gather required identification.',
    isCompleted: false,
    status: 'Not Started',
    content: `
      <h3>Identification Requirements</h3>
      <p>Depending on your state, you may need a photo ID or other proof of residency.</p>
      ${context.voterType === 'senior' ? '<p><strong>Senior Voter Note:</strong> Check if your polling location offers accessibility assistance or curbside voting.</p>' : ''}
      ${context.votingPreference === 'mail' ? '<p><strong>Mail-In Setup:</strong> Ensure your request for a mail-in ballot is submitted at least 2 weeks early.</p>' : ''}
    `,
  });

  // 3. Voting Step (Localized via Civic API)
  const electionName = voterInfo?.election?.name || 'Upcoming General Election';
  const electionDate = voterInfo?.election?.electionDay || 'November 5, 2024';

  steps.push({
    id: 'step-voting',
    title: 'Casting Your Ballot',
    description: isAfterElection ? 'Election Day has passed.' : `Target Date: ${electionDate}`,
    isCompleted: isAfterElection,
    status: isAfterElection ? 'Completed' : 'Not Started',
    content: `
      <h3>Election Day: ${electionName}</h3>
      <p>Official Date: <strong>${electionDate}</strong></p>
      ${isAfterElection ? '<p class="text-amber-700 font-bold">Voting for this specific event is now closed. If you have already voted, move to the verification step.</p>' : ''}
      ${!isAfterElection && voterInfo?.pollingLocations && voterInfo.pollingLocations.length > 0 ? `
        <div class="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <strong>Your Polling Place:</strong><br/>
          ${voterInfo.pollingLocations[0].address.locationName || ''}<br/>
          ${voterInfo.pollingLocations[0].address.line1}, ${voterInfo.pollingLocations[0].address.city}
        </div>
      ` : !isAfterElection ? '<p>Check your local government website for polling location details.</p>' : ''}
      ${!isAfterElection && context.votingPreference === 'early' ? '<p><strong>Early Voting:</strong> Check for early voting centers that open 10-15 days before the main election.</p>' : ''}
    `,
  });

  // 4. Post-Election
  steps.push({
    id: 'step-post-election',
    title: 'Track & Verify',
    description: 'Monitor your ballot status and wait for certified results.',
    isCompleted: false,
    status: 'Not Started',
    content: `
      <h3>After Voting</h3>
      <p>Official certification can take several weeks. If you voted by mail, use your state's tracking portal to ensure it was received.</p>
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
