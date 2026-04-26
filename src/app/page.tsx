'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';

// Components
import { BallotBoxIcon } from '@/components/BallotBoxIcon';
import { LocationInput } from '@/components/LocationInput';
import { ElectionTimeline } from '@/components/ElectionTimeline';
import { VoterContextSelector } from '@/components/VoterContextSelector';
import { NextActionCard } from '@/components/roadmap/NextActionCard';
import { ReadinessBanner } from '@/components/roadmap/ReadinessBanner';

// Hooks & Services
import { useElectionData } from '@/hooks/useElectionData';
import { generateTimeline, getNextBestAction, getReadiness } from '@/logic/roadmapGenerator';
import { subscribeToAuthChanges } from '@/lib/auth';
import { saveUserProgress, getUserProgress } from '@/lib/firestore';
import { UserLocation, VoterContext } from '@/types';

import { AppHeader } from '@/components/AppHeader';

// Lazy Load non-critical components
const ChatInterface = dynamic(() => import('@/components/ChatInterface').then(mod => mod.ChatInterface), {
  ssr: false,
  loading: () => <div className="fixed bottom-6 right-6 w-16 h-16 bg-election-amber-100 rounded-full animate-pulse shadow-lg" />
});

export default function Home() {
  const { location, setLocation, isLoading, error, voterInfo, fetchDataForLocation } = useElectionData();
  const [voterContext, setVoterContext] = useState<VoterContext | null>(null);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Derived State (Optimization: No extra state/renders)
  const timelineSteps = useMemo(() => 
    voterContext ? generateTimeline(voterInfo, voterContext, {
      country: location?.country,
      city: location?.city
    }) : [], 
  [voterInfo, voterContext, location]);

  const nextAction = useMemo(() => 
    timelineSteps.length > 0 ? getNextBestAction(timelineSteps) : null,
  [timelineSteps]);

  const readiness = useMemo(() => 
    voterContext ? getReadiness(voterContext, voterInfo) : null,
  [voterContext, voterInfo]);

  // 1. Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (u) => {
      setUser(u);
      if (u && !location && !voterContext) {
        // Load progress if user is logged in
        const progress = await getUserProgress(u.uid);
        if (progress) {
          if (progress.location) {
            setLocation(progress.location);
            await fetchDataForLocation(progress.location);
          }
          if (progress.voterContext) {
            setVoterContext(progress.voterContext);
            setShowTimeline(true);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [fetchDataForLocation, setLocation, location, voterContext]);

  // 2. Persist Progress
  useEffect(() => {
    if (user && (location || voterContext)) {
      saveUserProgress(user.uid, {
        location,
        voterContext,
      });
    }
  }, [user, location, voterContext]);

  // Handlers
  const handleLocationSubmit = useCallback(async (loc: UserLocation) => {
    // Transition UI immediately to prevent "stuck" feeling
    setShowContextSelector(true);
    setLocation(loc);
    
    // Fetch data in background
    try {
      await fetchDataForLocation(loc);
    } catch (error) {
      console.error('Background data fetch failed:', error);
      // We don't block here because the AI fallback will handle missing data
    }
  }, [fetchDataForLocation, setLocation]);

  const handleContextComplete = useCallback((context: VoterContext) => {
    setVoterContext(context);
    setShowContextSelector(false);
    setShowTimeline(true);
    
    // Smooth scroll down to timeline
    setTimeout(() => {
      timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const resetFlow = useCallback(() => {
    setShowContextSelector(false);
    setShowTimeline(false);
    setVoterContext(null);
    if (user) {
      saveUserProgress(user.uid, { location: null, voterContext: null });
    }
  }, [user]);

  return (
    <>
      <AppHeader />
      <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        
        {/* Hero Section */}
        <section className="w-full flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <BallotBoxIcon className="w-40 h-40 mb-8" />
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            VotePath AI
          </h1>
          
          <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
            Your personalized, non-partisan election roadmap. Discover exactly how, when, and where to vote.
          </p>

          {(!showContextSelector && !showTimeline) ? (
            <LocationInput onLocationSubmit={handleLocationSubmit} />
          ) : location ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-blue-100 shadow-sm"
            >
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-bold text-gray-900">
                {location.city || 'Unknown'}, {location.state || 'Unknown'}, {location.country || 'Unknown'}
              </span>
              <button 
                onClick={resetFlow}
                className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline underline-offset-4"
              >
                Change
              </button>
            </motion.div>
          ) : null}

          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Privacy Notice: Data is processed in real-time and minimized for your security.
            </p>
          </div>
        </section>

        <AnimatePresence>
          {showContextSelector && (
            <>
              {/* Global Error Notice (if civic data fetch failed) */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full max-w-lg mb-6 bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3"
                >
                  <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    <strong>Limited coverage:</strong> We&apos;re providing general guidance for this region while official registry data is being synchronized.
                  </p>
                </motion.div>
              )}
              <VoterContextSelector onComplete={handleContextComplete} />
            </>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-12 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <NextActionCard title={nextAction.title} action={nextAction.action} />
            <ReadinessBanner status={readiness.status as "ready" | "warning" | "error"} text={readiness.text} />
          </motion.div>
        )}

        {/* Timeline Section */}
        <section ref={timelineRef} className="w-full" tabIndex={-1} aria-label="Election Timeline">
          {!isLoading && showTimeline && (
            <ElectionTimeline steps={timelineSteps} isVisible={showTimeline} />
          )}
        </section>

        {/* Floating Chat Interface */}
        <ChatInterface location={location} />

      </main>
    </>
  );
}
