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

  // 1. Eligibility & Registration Step
  let registrationDesc = 'Ensure you are registered to vote before the deadline.';
  let regStatus: TimelineStep['status'] = 'Not Started';

  if (context.registrationStatus === 'registered') {
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
    description: `Target Date: ${electionDate}`,
    isCompleted: false,
    status: 'Not Started',
    content: `
      <h3>Election Day: ${electionName}</h3>
      <p>Official Date: <strong>${electionDate}</strong></p>
      ${voterInfo?.pollingLocations && voterInfo.pollingLocations.length > 0 ? `
        <div class="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <strong>Your Polling Place:</strong><br/>
          ${voterInfo.pollingLocations[0].address.locationName || ''}<br/>
          ${voterInfo.pollingLocations[0].address.line1}, ${voterInfo.pollingLocations[0].address.city}
        </div>
      ` : '<p>Check your local government website for polling location details.</p>'}
      ${context.votingPreference === 'early' ? '<p><strong>Early Voting:</strong> Check for early voting centers that open 10-15 days before the main election.</p>' : ''}
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
export function getReadinessStatus(context: VoterContext): { status: 'ready' | 'warning' | 'error'; text: string } {
  if (context.registrationStatus === 'registered') {
    return { status: 'ready', text: '✔ Ready to Vote' };
  } else if (context.registrationStatus === 'unsure') {
    return { status: 'warning', text: '⚠ Action Required' };
  } else {
    return { status: 'error', text: '❌ Not Eligible Yet' };
  }
}
