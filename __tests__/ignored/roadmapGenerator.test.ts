import { generateTimeline, getNextBestAction, getReadiness } from '../src/logic/roadmapGenerator';
import { VoterContext } from '../src/types';

describe('Roadmap Generator Logic', () => {
  const mockContext: VoterContext = {
    voterType: 'first-time',
    registrationStatus: 'registered',
    votingPreference: 'in-person'
  };

  test('should generate timeline steps', () => {
    const steps = generateTimeline(null, mockContext, { country: 'US' });
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].title).toBe('Eligibility & Registration');
    expect(steps[0].isCompleted).toBe(true);
  });

  test('should handle international fallback', () => {
    const steps = generateTimeline(null, mockContext, { country: 'GB' });
    expect(steps[0].content).toContain('UK Registration Guidelines');
  });

  test('should handle expired elections', () => {
    const pastVoterInfo = {
      election: { name: 'Past Election', electionDay: '2020-11-03' }
    };
    const steps = generateTimeline(pastVoterInfo as any, mockContext, { country: 'US' });
    expect(steps[2].description).toBe('Voting period has concluded.');
  });

  test('should determine next best action', () => {
    const steps = generateTimeline(null, mockContext, { country: 'US' });
    const nextAction = getNextBestAction(steps);
    expect(nextAction.title).toBe('Documents & Preparation');
  });

  test('should return completion message when all steps done', () => {
    const steps = [
      { id: '1', title: 'Done', status: 'Completed' as const, isCompleted: true, description: 'd', content: 'c' }
    ];
    const nextAction = getNextBestAction(steps);
    expect(nextAction.title).toBe('All set!');
  });

  test('should determine readiness status', () => {
    const readiness = getReadiness(mockContext, null);
    expect(readiness.status).toBe('ready');
    expect(readiness.text).toBe('✔ Ready to Vote');
  });

  test('should handle unsure registration status', () => {
    const unsureContext: VoterContext = { ...mockContext, registrationStatus: 'unsure' };
    const readiness = getReadiness(unsureContext, null);
    expect(readiness.status).toBe('warning');
    expect(readiness.text).toBe('⚠ Action Required');
  });

  test('should handle not-eligible status', () => {
    const ineligibleContext: VoterContext = { ...mockContext, registrationStatus: 'not-eligible' };
    const readiness = getReadiness(ineligibleContext, null);
    expect(readiness.status).toBe('error');
    expect(readiness.text).toBe('❌ Not Eligible Yet');
  });
});
