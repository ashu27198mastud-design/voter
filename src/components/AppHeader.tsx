'use client';

import React from 'react';
import { AuthPanel } from '@/components/auth/AuthPanel';

export const AppHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            🗳️
          </div>
          <span className="text-lg font-bold text-gray-900">VotePath AI</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-xs text-gray-500 md:block">
            Powered by Gemini · Firebase · Maps · Search
          </div>
          <AuthPanel />
        </div>
      </div>
    </header>
  );
};
