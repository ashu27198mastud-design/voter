'use client';

import React, { useState, useEffect } from 'react';
import { auth, multiFactor } from '@/lib/firebase';
import { isMFAEnabled, unenrollPhoneMFA } from '@/lib/auth';

export const MFASettings: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth?.currentUser) {
      // Use a microtask to avoid synchronous cascading renders
      Promise.resolve().then(() => {
        setIsEnabled(isMFAEnabled());
        setLoading(false);
      });
    } else {
      // Use a microtask even for the fallback to maintain consistency
      Promise.resolve().then(() => {
        setLoading(false);
      });
    }
  }, []);

  const handleToggle = async () => {
    if (isEnabled) {
      // Unenroll logic
      if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) return;
      
      setLoading(true);
      try {
        const user = multiFactor(auth!.currentUser!);
        const factor = user.enrolledFactors[0]; // Assuming only one for now
        await unenrollPhoneMFA(factor.uid);
        setIsEnabled(false);
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : 'Failed to disable MFA.';
        setError(message);
      } finally {
        setLoading(false);
      }
    } else {
      // Direct user to enrollment flow (PhoneAuth component would be used here in a real app)
      alert('To enable MFA, please use the "Sign in with Phone" flow or we will implement the enrollment modal in the next step.');
    }
  };

  if (loading) return <div className="h-20 animate-pulse bg-gray-50 rounded-xl"></div>;

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Two-Factor Authentication (MFA)
            {isEnabled && (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-green-100">
                Active
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Add an extra layer of security to your account by requiring a code sent to your phone when you sign in.
          </p>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
          {error}
        </p>
      )}

      {!isEnabled && (
        <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-blue-900">Highly Recommended</p>
            <p className="text-[11px] text-blue-700">MFA helps protect your voting data from unauthorized access.</p>
          </div>
        </div>
      )}
    </div>
  );
};
