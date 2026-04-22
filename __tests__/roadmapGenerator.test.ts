import { generateTimeline, getNextBestAction, getReadiness } from '../src/logic/roadmapGenerator';
import { VoterContext } from '../src/types';

describe('Roadmap Generator Logic', () => {
  const mockContext: VoterContext = {
    voterType: 'first-time',
    registrationStatus: 'registered',
    votingPreference: 'in-person'
  };

  test('should generate timeline steps', () => {
    const steps = generateTimeline(null, mockContext, { countryCode: 'US' });
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].title).toBe('Eligibility & Registration');
    expect(steps[0].isCompleted).toBe(true); // Since context says 'registered'
  });

  test('should determine next best action', () => {
    const steps = generateTimeline(null, mockContext, { countryCode: 'US' });
    // All steps except registration should be incomplete
    const nextAction = getNextBestAction(steps);
    expect(nextAction.title).toBe('Documents & Preparation');
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
});
