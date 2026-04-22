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
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
}
