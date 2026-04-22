'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { BallotBoxIcon } from '../components/BallotBoxIcon';
import { LocationInput } from '../components/LocationInput';
import { ElectionTimeline } from '../components/ElectionTimeline';
import { VoterContextSelector } from '../components/VoterContextSelector';
import { useElectionData } from '../hooks/useElectionData';
import { generateTimelineFromVoterInfo, getNextBestAction, getReadinessStatus } from '../lib/election-data';
import { UserLocation, VoterContext } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// Efficiency: Lazy load ChatInterface
const ChatInterface = dynamic(() => import('../components/ChatInterface').then(mod => mod.ChatInterface), {
  ssr: false,
  loading: () => <div className="fixed bottom-6 right-6 w-16 h-16 bg-election-amber-100 rounded-full animate-pulse" />
});

export default function Home() {
  const { location, isLoading, error, voterInfo, fetchDataForLocation } = useElectionData();
  const [voterContext, setVoterContext] = useState<VoterContext | null>(null);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleLocationSubmit = async (loc: UserLocation) => {
    await fetchDataForLocation(loc);
    setShowContextSelector(true);
  };

  const handleContextComplete = (context: VoterContext) => {
    setVoterContext(context);
    setShowContextSelector(false);
    setShowTimeline(true);
    
    // Smooth scroll down to timeline
    setTimeout(() => {
      timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Generate timeline steps based on fetched data AND context AND location
  const timelineSteps = voterContext ? generateTimelineFromVoterInfo(voterInfo, voterContext, {
    countryCode: location?.country,
    city: location?.city
  }) : [];
  const nextAction = timelineSteps.length > 0 ? getNextBestAction(timelineSteps) : null;
  const readiness = voterContext ? getReadinessStatus(voterContext, voterInfo) : null;

  return (
    <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
        <BallotBoxIcon className="w-40 h-40 mb-8" />
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 text-balance">
          VotePath AI
        </h1>
        
        <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
          Your personalized, non-partisan election roadmap. Enter your location to discover exactly how, when, and where to vote.
        </p>

        {!showContextSelector && !showTimeline && (
          <LocationInput onLocationSubmit={handleLocationSubmit} />
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Privacy Notice: Location is used temporarily for fetching info and is never stored.
          </p>
        </div>
      </section>

      {/* Context Selector Step */}
      <AnimatePresence>
        {showContextSelector && (
          <VoterContextSelector onComplete={handleContextComplete} />
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <div className="w-full py-12 flex justify-center" aria-busy="true" aria-live="polite">
          <div className="flex flex-col items-center gap-4 text-election-blue-600">
             <div className="w-12 h-12 rounded-full border-4 border-election-blue-100 border-t-election-blue-600 animate-spin"></div>
             <p className="font-medium">Fetching official data...</p>
          </div>
        </div>
      )}

      {/* Roadmap Summary (Next Best Action + Readiness) */}
      {showTimeline && nextAction && readiness && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mb-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Next Best Action Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                   <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" />
                </svg>
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2 block">Next Best Action</span>
             <h3 className="text-2xl font-bold mb-2">{nextAction.title}</h3>
             <p className="text-blue-100">{nextAction.action}</p>
          </div>

          {/* Readiness Status Card */}
          <div className={`rounded-3xl p-8 shadow-lg border-2 flex flex-col justify-center items-center text-center ${
            readiness.status === 'ready' ? 'bg-green-50 border-green-100 text-green-800' :
            readiness.status === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
            'bg-red-50 border-red-100 text-red-800'
          }`}>
             <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
               readiness.status === 'ready' ? 'bg-green-500' :
               readiness.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
             } text-white`}>
               {readiness.status === 'ready' ? (
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               ) : (
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               )}
             </div>
             <h3 className="text-3xl font-black">{readiness.text}</h3>
             <p className="opacity-70 mt-1">Based on your provided context</p>
          </div>
        </motion.div>
      )}

      {/* Timeline Section */}
      <section ref={timelineRef} className="w-full" tabIndex={-1} aria-label="Election Timeline">
        {!isLoading && showTimeline && (
          <ElectionTimeline steps={timelineSteps} isVisible={showTimeline} />
        )}
      </section>

      {/* Floating Chat Interface */}
      <aside aria-label="Educational Chat Assistant">
        <ChatInterface location={location} />
      </aside>

    </main>
  );
}
