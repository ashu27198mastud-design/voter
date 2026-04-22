'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BallotBoxIcon } from '../components/BallotBoxIcon';
import { LocationInput } from '../components/LocationInput';
import { ElectionTimeline } from '../components/ElectionTimeline';
import { ChatInterface } from '../components/ChatInterface';
import { useElectionData } from '../hooks/useElectionData';
import { generateTimelineFromVoterInfo } from '../lib/election-data';
import { UserLocation } from '../lib/validation';

export default function Home() {
  const { location, isLoading, error, voterInfo, fetchDataForLocation } = useElectionData();
  const [showTimeline, setShowTimeline] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleLocationSubmit = async (loc: UserLocation) => {
    await fetchDataForLocation(loc);
    setShowTimeline(true);
    
    // Smooth scroll down to timeline
    setTimeout(() => {
      timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Generate timeline steps based on fetched data
  const timelineSteps = generateTimelineFromVoterInfo(voterInfo);

  // RULE 1: DATA MINIMIZATION - Clear session data on unmount (window close)
  useEffect(() => {
    return () => {
      // Data is only held in React state, so it's cleared when the component unmounts.
      // This ensures we meet the requirement of zero backend persistence and clear on close.
    };
  }, []);

  return (
    <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
        <BallotBoxIcon className="w-40 h-40 mb-8" />
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 text-balance">
          Understand Your Election Process
        </h1>
        
        <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
          Learn how, when, and where to vote. Enter your location below to get personalized, factual information about upcoming elections.
        </p>

        <LocationInput onLocationSubmit={handleLocationSubmit} />

        <p className="text-xs text-gray-400 mt-6 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Privacy Notice: Location is used temporarily for fetching info and is never stored.
        </p>
      </section>

      {/* Loading State */}
      {isLoading && (
        <div className="w-full py-12 flex justify-center" aria-busy="true" aria-live="polite">
          <div className="flex flex-col items-center gap-4 text-election-blue-600">
             <div className="w-12 h-12 rounded-full border-4 border-election-blue-100 border-t-election-blue-600 animate-spin"></div>
             <p className="font-medium">Fetching official data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
         <div className="w-full max-w-2xl bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 mb-8 shadow-sm" role="alert" aria-live="assertive">
           <div className="flex items-start gap-3">
             <svg className="w-6 h-6 shrink-0 mt-0.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             <div>
               <h3 className="font-bold">Information Unavailable</h3>
               <p className="mt-1 text-sm">{error}</p>
             </div>
           </div>
         </div>
      )}

      {/* Timeline Section - always visible after location submitted */}
      <div ref={timelineRef} className="w-full" tabIndex={-1}>
        {!isLoading && showTimeline && (
          <ElectionTimeline steps={timelineSteps} isVisible={showTimeline} />
        )}
      </div>

      {/* Floating Chat Interface */}
      <ChatInterface location={location} />

    </main>
  );
}
