'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';
import { logOut, subscribeToAuthChanges } from '../lib/auth';
import { LoginModal } from './auth/LoginModal';
import { MFASettings } from './auth/MFASettings';
import { motion, AnimatePresence } from 'framer-motion';

export const UserMenu: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setShowLogin(false);
  };

  if (isLoading) return <div className="h-10 w-10 animate-pulse bg-gray-100 rounded-full"></div>;

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-gray-500">Welcome back,</p>
            <p className="text-sm font-bold text-gray-900">{user.displayName?.split(' ')[0]}</p>
          </div>
          <div className="relative group flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-bold text-gray-600 transition-all border border-gray-100"
              aria-label="Security Settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security
            </button>
            <div className="relative group-avatar">
              <Image 
                src={user.photoURL || ''} 
                alt={user.displayName || 'User'} 
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-2 ring-blue-50 transition-transform group-hover:scale-105"
                unoptimized
              />
              <button 
                onClick={handleLogout}
                className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Log out"
              >
                <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign In
        </button>
      )}

      {showLogin && (
        <LoginModal 
          onSuccess={handleLoginSuccess} 
          onCancel={() => setShowLogin(false)} 
        />
      )}

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-16 right-0 w-80 z-50 p-2"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
               <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                 <h4 className="font-bold text-gray-900">Account Security</h4>
                 <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
               </div>
               <div className="p-2">
                 <MFASettings />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
