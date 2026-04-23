import { z } from 'zod';
import { LocationSchema, QuerySchema, StepSchema } from '../lib/validation';

export type UserLocation = z.infer<typeof LocationSchema>;
export type UserQuery = z.infer<typeof QuerySchema>;
export type ElectionStep = z.infer<typeof StepSchema>;

export interface TimelineStep {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    content: string; // The detailed content when expanded
    actionLabel?: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    pollingAddress?: {
      line1: string;
      city: string;
      state: string;
    };
}

export type VoterType = 'first-time' | 'returning' | 'moved' | 'overseas' | 'senior';
export type RegistrationStatus = 'registered' | 'not-registered' | 'unsure';
export type VotingPreference = 'in-person' | 'early' | 'mail';

export interface VoterContext {
    voterType: VoterType;
    registrationStatus: RegistrationStatus;
    votingPreference: VotingPreference;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
}

export interface ElectionContextResult {
  location: string;
  countryCode: string;
  officialGuidance: string | null;
  keySteps: string[];
  requiredDocuments: string[];
  verifiedUpdates: string[]; // Refined from "recentUpdates" to avoid live-search implication
  fallbackSummary: string;
  verificationNote: string;
  hasOfficialData: boolean;
}
