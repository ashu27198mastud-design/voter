'use client';

import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { signInWithGoogle, logOut, subscribeToAuthChanges } from '@/lib/auth';
import { PhoneAuth } from '@/components/auth/PhoneAuth';

export const AuthPanel: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);

  useEffect(() => {
    return subscribeToAuthChanges(setUser);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {user ? 'Account' : 'Sign in'}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Account options"
          className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl z-50"
        >
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-900">Save your progress</p>
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => setShowPhoneAuth(true)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Continue with Phone
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-900">Signed in</p>
              <p className="text-xs text-gray-500 break-all">
                {user.email || user.phoneNumber || user.uid}
              </p>
              <div className="rounded-xl bg-green-50 p-3 text-xs text-green-700">
                Progress saved securely with Firebase.
              </div>
              <button
                type="button"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                MFA setup requires Firebase console configuration
              </button>
              <button
                type="button"
                onClick={() => logOut()}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}

      {showPhoneAuth && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="phone-auth-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-2 shadow-2xl">
            <h2 id="phone-auth-modal-title" className="sr-only">
              Phone sign in
            </h2>
            <PhoneAuth
              onSuccess={(signedInUser) => {
                setUser(signedInUser);
                setShowPhoneAuth(false);
                setIsOpen(false);
              }}
              onCancel={() => setShowPhoneAuth(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
