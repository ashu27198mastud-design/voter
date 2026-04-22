import { VoterInfoResponse } from './civic-info';
import { TimelineStep } from '../types';

/**
 * Transforms raw Civic API VoterInfoResponse into a structured list of TimelineSteps.
 * This ensures the frontend receives clean, organized data.
 */
export function generateTimelineFromVoterInfo(voterInfo: VoterInfoResponse | null): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      id: 'step-registration',
      title: 'Voter Registration',
      description: 'Ensure you are registered to vote before the deadline.',
      isCompleted: false,
      content: `
        <h3>Registration Guidelines</h3>
        <p>Before you can vote, you must be registered in your jurisdiction. Registration deadlines vary by state, but it is typically 15-30 days before election day.</p>
        <p><strong>What you need:</strong></p>
        <ul>
          <li>Proof of identity (e.g., Driver's License, State ID)</li>
          <li>Proof of residency (e.g., utility bill, bank statement)</li>
        </ul>
      `,
    },
    {
      id: 'step-preparation',
      title: 'Preparing to Vote',
      description: 'Know what is on the ballot and find your polling location.',
      isCompleted: false,
      content: `
        <h3>Preparation</h3>
        <p>Review the candidates and measures on your local ballot. Make a plan for when and where you will vote.</p>
      `,
    }
  ];

  // Add specific election day info if available
  if (voterInfo?.election) {
    steps.push({
      id: 'step-voting',
      title: 'Casting Your Ballot',
      description: `Election Day is ${voterInfo.election.electionDay}.`,
      isCompleted: false,
      content: `
        <h3>Election Day: ${voterInfo.election.name}</h3>
        <p>The official election day is <strong>${voterInfo.election.electionDay}</strong>.</p>
        ${voterInfo.pollingLocations && voterInfo.pollingLocations.length > 0 ? `
          <h4>Your Polling Location:</h4>
          <p>
            ${voterInfo.pollingLocations[0].address.locationName || ''}<br/>
            ${voterInfo.pollingLocations[0].address.line1}<br/>
            ${voterInfo.pollingLocations[0].address.city}, ${voterInfo.pollingLocations[0].address.state} ${voterInfo.pollingLocations[0].address.zip}
          </p>
          <p><strong>Hours:</strong> ${voterInfo.pollingLocations[0].pollingHours}</p>
        ` : '<p>Polling location details are currently unavailable for your address.</p>'}
      `,
    });
  } else {
    // Generic voting step if no specific election data
    steps.push({
      id: 'step-voting',
      title: 'Casting Your Ballot',
      description: 'Go to your designated polling place or submit your mail-in ballot.',
      isCompleted: false,
      content: `
        <h3>Voting Process</h3>
        <p>On election day, go to your designated polling location. If you are voting by mail, ensure your ballot is postmarked by the required date.</p>
      `,
    });
  }

  steps.push({
    id: 'step-post-election',
    title: 'After the Vote',
    description: 'Track your ballot and understand how results are certified.',
    isCompleted: false,
    content: `
      <h3>Post-Election Process</h3>
      <p>After polls close, election officials begin counting ballots. Official certification can take several days or weeks depending on the margin and state laws.</p>
    `,
  });

  return steps;
}
