'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineStep } from '../types';
import { sanitizeHtml } from '../lib/security';
import { PollingMap } from './PollingMap';

interface StepCardProps {
  step: TimelineStep;
  index: number;
  isFirstExpanded?: boolean; // Used to auto-expand the first item initially
}

/**
 * StepCard Component
 * Displays a single phase of the election process.
 * Uses Framer Motion for smooth height transitions (3D Pixar feel).
 * Optimized with React.memo to prevent unnecessary re-renders.
 */
export const StepCard: React.FC<StepCardProps> = React.memo(({ step, index, isFirstExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(isFirstExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus management: when expanded, focus the first heading or the region itself for screen readers
  useEffect(() => {
    if (isExpanded && !isFirstExpanded && contentRef.current) {
      // Small timeout to allow animation to start before focusing
      setTimeout(() => {
         contentRef.current?.focus();
      }, 100);
    }
  }, [isExpanded, isFirstExpanded]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isExpanded) {
      setIsExpanded(false);
      buttonRef.current?.focus();
    }
  };

  // RULE 3 - OUTPUT SANITIZATION: Sanitize content before rendering
  const safeContent = sanitizeHtml(step.content);

  return (
    <article 
      className="relative pl-8 sm:pl-12 py-4 group"
      onKeyDown={handleKeyDown}
    >
      {/* Vertical Timeline Line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-election-blue-100 group-last:bottom-auto group-last:h-full"></div>
      
      {/* Timeline Node / Circle */}
      <div className={`absolute left-0 top-6 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${isExpanded ? 'bg-election-amber-500' : 'bg-election-blue-500'}`}></div>

      {/* 3D Elevated Card */}
      <div className="
        bg-white rounded-2xl p-6
        shadow-[0_4px_16px_rgba(21,101,192,0.08)]
        border border-election-blue-50
        hover:shadow-[0_8px_24px_rgba(21,101,192,0.12)]
        transition-all duration-300 ease-out
      ">
        <button
          ref={buttonRef}
          onClick={toggleExpand}
          className="w-full text-left flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-election-blue-500 rounded-lg"
          aria-expanded={isExpanded}
          aria-controls={`step-content-${step.id}`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-election-blue-500">
                Step {index + 1}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                step.status === 'Completed' ? 'bg-green-100 text-green-700' :
                step.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {step.status}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {step.title}
            </h2>
            <p className="text-gray-600 mt-1">
              {step.description}
            </p>
          </div>
          
          {/* Expand/Collapse Indicator */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-election-blue-50 text-election-blue-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
          </div>
        </button>

        {/* Expandable Content Area */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id={`step-content-${step.id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div 
                ref={contentRef}
                tabIndex={-1} // Programmably focusable
                role="region"
                aria-label={`Details for ${step.title}`}
                className="pt-6 mt-4 border-t border-gray-100 prose prose-blue max-w-none text-gray-700"
              >
                <div dangerouslySetInnerHTML={{ __html: safeContent }} />
                
                {step.pollingAddress && (
                  <div className="not-prose mt-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Verified Polling Location
                    </h3>
                    <PollingMap address={step.pollingAddress} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
});

StepCard.displayName = 'StepCard';
