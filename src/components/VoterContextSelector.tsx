'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VoterContext } from '@/types';
import { ContextOption } from './ui/ContextOption';

interface VoterContextSelectorProps {
  onComplete: (context: VoterContext) => void;
}

const STEPS = [
  {
    title: 'Which best describes you?',
    key: 'voterType',
    options: [
      { id: 'first-time', label: 'First-Time Voter', desc: 'Never voted before' },
      { id: 'returning', label: 'Returning Voter', desc: 'Voted in previous elections' },
      { id: 'moved', label: 'Recently Moved', desc: 'New address in a new jurisdiction' },
      { id: 'senior', label: 'Senior Voter', desc: 'May require accessibility support' },
      { id: 'overseas', label: 'Overseas / Military', desc: 'Voting from outside the US' },
    ],
  },
  {
    title: 'What is your registration status?',
    key: 'registrationStatus',
    options: [
      { id: 'registered', label: 'I am Registered', desc: 'My registration is active' },
      { id: 'not-registered', label: 'Not Registered', desc: 'I need to register' },
      { id: 'unsure', label: 'I am Unsure', desc: 'I need to check my status' },
    ],
  },
  {
    title: 'How do you prefer to vote?',
    key: 'votingPreference',
    options: [
      { id: 'in-person', label: 'In-Person', desc: 'Vote at my local polling place' },
      { id: 'early', label: 'Early Voting', desc: 'Vote before election day' },
      { id: 'mail', label: 'By Mail', desc: 'Request and send a paper ballot' },
    ],
  },
] as const;

export const VoterContextSelector: React.FC<VoterContextSelectorProps> = ({
  onComplete,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [context, setContext] = useState<Partial<VoterContext>>({
    voterType: 'returning',
    registrationStatus: 'registered',
    votingPreference: 'in-person',
  });

  const currentStep = STEPS[stepIndex];

  const handleSelect = (id: string) => {
    const nextContext = { ...context, [currentStep.key]: id };
    setContext(nextContext);

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onComplete(nextContext as VoterContext);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-[0_20px_50px_rgba(21,101,192,0.1)] border border-blue-50"
      aria-labelledby="roadmap-personalization-heading"
    >
      <div className="flex justify-between items-center mb-8">
        <h2
          id="roadmap-personalization-heading"
          className="text-2xl font-bold text-gray-900"
        >
          Personalize Your Roadmap
        </h2>
        <span
          className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
          aria-live="polite"
        >
          Step {stepIndex + 1} of 3
        </span>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600">{currentStep.title}</p>
        {currentStep.options.map((opt) => (
          <ContextOption
            key={opt.id}
            isSelected={context[currentStep.key as keyof VoterContext] === opt.id}
            onClick={() => handleSelect(opt.id)}
            label={opt.label}
            desc={opt.desc}
            id={opt.id}
          />
        ))}
      </div>
    </motion.div>
  );
};
