import React from 'react';
import { SystemStatusBadge } from './SystemStatusBadge';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-12 px-6 mt-20">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Built with Google Intelligence</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2 text-gray-500 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-sm font-medium">Gemini 1.5 Flash</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-sm font-medium">Google Civic Data</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-sm font-medium">Firebase Auth & MFA</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-sm font-medium">Maps Static API</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-sm font-medium">Cloud Run</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">System Integrity</p>
            <SystemStatusBadge />
          </div>

        <div className="w-full h-px bg-gray-50 max-w-md"></div>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-400">
            VotePath AI is a non-partisan educational tool. We do not store your private address data.
          </p>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} VotePath. Built for the Google Agentic AI Hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
};
