/**
 * Fallback Structured Data for global support
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
