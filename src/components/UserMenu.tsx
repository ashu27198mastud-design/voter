'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';
import { logOut, subscribeToAuthChanges } from '../lib/auth';
import { LoginModal } from './auth/LoginModal';

export const UserMenu: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

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
          <div className="relative group">
            <Image 
              src={user.photoURL || ''} 
              alt={user.displayName || 'User'} 
              width={40}
              height={40}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-2 ring-blue-50 transition-transform group-hover:scale-105"
              unoptimized // Firebase photo URLs are external and variable
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
    </div>
  );
};
