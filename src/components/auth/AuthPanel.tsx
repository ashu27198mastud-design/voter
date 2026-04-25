'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges, isMFAEnabled } from '@/lib/auth';
import { LoginModal } from './LoginModal';
import { logFirebaseEvent } from '@/lib/firebase';

export const AuthPanel: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [mfaActive, setMfaActive] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
      setMfaActive(isMFAEnabled());
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setMfaActive(isMFAEnabled());
    setShowLogin(false);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-xl border border-gray-100 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-lg w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-50 rounded-2xl w-full"></div>
          <div className="h-12 bg-gray-50 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-xl border border-gray-100 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Secure Your Journey</h2>
          <p className="text-gray-500 mt-2">Sign in to save your roadmap and enable advanced security features like Multi-Factor Authentication.</p>
        </div>
        
        <button
          onClick={() => setShowLogin(true)}
          className="w-full py-4 bg-election-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-election-blue-700 transition-all active:scale-95"
        >
          Get Started
        </button>

        {showLogin && (
          <LoginModal 
            onSuccess={handleLoginSuccess} 
            onCancel={() => setShowLogin(false)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-0.5 shadow-md">
            {user.photoURL ? (
              <Image 
                src={user.photoURL} 
                alt="" 
                width={64}
                height={64}
                className="w-full h-full rounded-[14px] object-cover" 
                unoptimized
              />
            ) : (
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-blue-600 font-black text-xl">
                {user.displayName?.[0] || user.email?.[0] || user.phoneNumber?.[2]}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.displayName || 'Election Voter'}</h2>
            <p className="text-sm text-gray-500">{user.email || user.phoneNumber || 'Secure Account'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${mfaActive ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span className="text-sm font-bold text-gray-700">Account Security</span>
            </div>
            <span className="text-xs font-medium text-gray-500">
              {mfaActive ? 'MFA Protected' : 'Standard'}
            </span>
          </div>
          
          <button
            onClick={() => {
              logFirebaseEvent('mfa_setup_clicked');
              // This component is mostly for display/triggering settings
            }}
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-bold text-gray-700">Manage MFA Settings</span>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
        <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Google Cloud Security Note
        </h4>
        <p className="text-xs text-amber-800 leading-relaxed">
          MFA setup requires Firebase console configuration for production domains. 
          {mfaActive ? ' Your account is currently verified.' : ' Please ensure your phone is accessible to receive security codes.'}
        </p>
      </div>
    </div>
  );
};
