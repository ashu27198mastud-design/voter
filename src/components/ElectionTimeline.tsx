'use client';

import React, { useMemo, memo } from 'react';
import { StepCard } from './StepCard';
import { TimelineStep } from '../types';

interface ElectionTimelineProps {
  steps: TimelineStep[];
  isVisible: boolean;
}

/**
 * ElectionTimeline Component
 * Renders the sequence of election steps.
 * Uses progressive disclosure (only shows when isVisible is true).
 */
export const ElectionTimeline: React.FC<ElectionTimelineProps> = memo(({ steps, isVisible }) => {
  // Memoize the rendered steps to prevent unnecessary re-renders of the whole list
  // when interacting with a single card.
  const renderedSteps = useMemo(() => {
    return steps.map((step, index) => (
      <StepCard 
        key={step.id} 
        step={step} 
        index={index} 
        isFirstExpanded={index === 0} 
      />
    ));
  }, [steps]);

  if (!isVisible || steps.length === 0) return null;

  return (
    <section 
      className="w-full max-w-3xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out"
      aria-label="Election Process Timeline"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Your Election Journey</h2>
        <p className="text-gray-600 mt-2">Follow these steps to ensure your vote is counted.</p>
      </div>

      <div className="space-y-0 pb-12" role="list">
        {renderedSteps}
      </div>
    </section>
  );
});

ElectionTimeline.displayName = 'ElectionTimeline';
