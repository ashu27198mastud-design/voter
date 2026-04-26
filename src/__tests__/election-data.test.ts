import { generateTimeline, getNextBestAction, getReadiness } from '@/logic/roadmapGenerator';
import { VoterContext } from '@/types';
import { VoterInfoResponse } from '@/services/civic';

describe('Election Data Decision Engine', () => {
  const mockContext: VoterContext = {
    voterType: 'returning',
    registrationStatus: 'registered',
    votingPreference: 'in-person'
  };

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const futureDateString = futureDate.toISOString().split('T')[0];

  const mockVoterInfo = {
    election: { name: 'Future Election', electionDay: futureDateString },
    pollingLocations: []
  };

  it('generates a personalized roadmap for US voters', () => {
    const steps = generateTimeline(mockVoterInfo as unknown as VoterInfoResponse, mockContext, { country: 'US' });
    expect(steps).toHaveLength(3);
    expect(steps[0].title).toBe('Eligibility & Registration');
    expect(steps[0].status).toBe('Completed');
  });

  it('uses global fallbacks for India (IN)', () => {
    const steps = generateTimeline(null, mockContext, { country: 'IN' });
    expect(steps[0].content).toContain('General Registration Guidelines');
    expect(steps[0].content).toContain('EPIC Card');
  });

  it('calculates the next best action correctly', () => {
    const steps = generateTimeline(mockVoterInfo as unknown as VoterInfoResponse, { ...mockContext, registrationStatus: 'unsure' }, { country: 'US' });
    const nextAction = getNextBestAction(steps);
    expect(nextAction.title).toBe('Eligibility & Registration');
  });

  it('determines readiness status accurately', () => {
    const status = getReadiness(mockContext, mockVoterInfo as unknown as VoterInfoResponse);
    expect(status.text).toContain('Ready to Vote');
  });

  it('detects passed elections', () => {
    const pastVoterInfo = {
        election: { name: 'Past Election', electionDay: '2000-01-01' }
    };
    const status = getReadiness(mockContext, pastVoterInfo as unknown as VoterInfoResponse);
    expect(status.text).toContain('Passed');
  });
});
