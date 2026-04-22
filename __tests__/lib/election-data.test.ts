import { generateTimelineFromVoterInfo, getNextBestAction, getReadinessStatus } from '../../src/lib/election-data';
import { VoterContext } from '../../src/types';

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
  } as any;

  it('generates a personalized roadmap for US voters', () => {
    const steps = generateTimelineFromVoterInfo(mockVoterInfo, mockContext, { countryCode: 'US' });
    expect(steps).toHaveLength(4);
    expect(steps[0].title).toBe('Eligibility & Registration');
    expect(steps[0].status).toBe('Completed'); // Because registered
  });

  it('uses global fallbacks for India (IN)', () => {
    const steps = generateTimelineFromVoterInfo(null, mockContext, { countryCode: 'IN' });
    expect(steps[0].content).toContain('General Registration Guidelines');
    expect(steps[0].content).toContain('EPIC Card');
  });

  it('calculates the next best action correctly', () => {
    const steps = generateTimelineFromVoterInfo(mockVoterInfo, { ...mockContext, registrationStatus: 'unsure' });
    const nextAction = getNextBestAction(steps);
    expect(nextAction.title).toBe('Eligibility & Registration');
  });

  it('determines readiness status accurately', () => {
    const status = getReadinessStatus(mockContext, mockVoterInfo);
    expect(status.text).toContain('Ready to Vote');
  });

  it('detects passed elections', () => {
    const pastVoterInfo = {
        election: { name: 'Past Election', electionDay: '2000-01-01' }
    } as any;
    const status = getReadinessStatus(mockContext, pastVoterInfo);
    expect(status.text).toContain('Passed');
  });
});
