'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VoterContext, VoterType, RegistrationStatus, VotingPreference } from '../types';

interface VoterContextSelectorProps {
  onComplete: (context: VoterContext) => void;
}

export const VoterContextSelector: React.FC<VoterContextSelectorProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [context, setContext] = useState<Partial<VoterContext>>({
    voterType: 'returning',
    registrationStatus: 'registered',
    votingPreference: 'in-person'
  });

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(context as VoterContext);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-[0_20px_50px_rgba(21,101,192,0.1)] border border-blue-50"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Personalize Your Roadmap</h2>
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Step {step} of 3</span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-gray-600">Which best describes you?</p>
          {[
            { id: 'first-time', label: 'First-Time Voter', desc: 'Never voted before' },
            { id: 'returning', label: 'Returning Voter', desc: 'Voted in previous elections' },
            { id: 'moved', label: 'Recently Moved', desc: 'New address in a new jurisdiction' },
            { id: 'senior', label: 'Senior Voter', desc: 'May require accessibility support' },
            { id: 'overseas', label: 'Overseas / Military', desc: 'Voting from outside the US' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => { setContext({ ...context, voterType: type.id as VoterType }); nextStep(); }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${context.voterType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
            >
              <div className="font-bold text-gray-900">{type.label}</div>
              <div className="text-sm text-gray-500">{type.desc}</div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-gray-600">What is your registration status?</p>
          {[
            { id: 'registered', label: 'I am Registered', desc: 'My registration is active' },
            { id: 'not-registered', label: 'Not Registered', desc: 'I need to register' },
            { id: 'unsure', label: 'I am Unsure', desc: 'I need to check my status' }
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => { setContext({ ...context, registrationStatus: status.id as RegistrationStatus }); nextStep(); }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${context.registrationStatus === status.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
            >
              <div className="font-bold text-gray-900">{status.label}</div>
              <div className="text-sm text-gray-500">{status.desc}</div>
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-gray-600">How do you prefer to vote?</p>
          {[
            { id: 'in-person', label: 'In-Person', desc: 'Vote at my local polling place' },
            { id: 'early', label: 'Early Voting', desc: 'Vote before election day' },
            { id: 'mail', label: 'By Mail', desc: 'Request and send a paper ballot' }
          ].map((pref) => (
            <button
              key={pref.id}
              onClick={() => { setContext({ ...context, votingPreference: pref.id as VotingPreference }); onComplete({ ...context, votingPreference: pref.id as VotingPreference } as VoterContext); }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${context.votingPreference === pref.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
            >
              <div className="font-bold text-gray-900">{pref.label}</div>
              <div className="text-sm text-gray-500">{pref.desc}</div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
