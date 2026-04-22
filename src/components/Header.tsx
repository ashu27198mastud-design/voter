'use client';

import React from 'react';
import { BallotBoxIcon } from './BallotBoxIcon';
import { UserMenu } from './UserMenu';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <BallotBoxIcon className="w-8 h-8" />
        <span className="text-xl font-black text-gray-900 tracking-tighter">VotePath AI</span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Google Translate Container */}
        <div id="google_translate_element" className="hidden sm:block"></div>
        
        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
        
        <UserMenu />
      </div>
    </header>
  );
};
