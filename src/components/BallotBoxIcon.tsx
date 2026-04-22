'use client';

import React from 'react';

interface BallotBoxIconProps {
  className?: string;
}

/**
 * 3D Pixar-style Ballot Box Icon (SVG)
 * Provides visual depth and a gentle floating animation.
 */
export const BallotBoxIcon: React.FC<BallotBoxIconProps> = ({ className = "w-32 h-32" }) => {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1565C0" />
          <stop offset="100%" stopColor="#0D47A1" />
        </linearGradient>
        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* 3D box body with glow filter */}
      <rect x="40" y="60" width="120" height="100" 
            fill="url(#boxGradient)" rx="8" filter="url(#glowEffect)"/>
      
      {/* Slot opening */}
      <rect x="60" y="50" width="80" height="12" fill="#0A367A" opacity="0.8" rx="2"/>
      
      {/* Ballot paper floating */}
      <rect x="70" y="10" width="60" height="45" fill="#FFA726" rx="4">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,-5; 0,0"
          dur="2.5s"
          repeatCount="indefinite"/>
      </rect>
      
      {/* "VOTE" text on ballot */}
      <text x="100" y="35" fontSize="14" fill="white" 
            fontWeight="bold" textAnchor="middle">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,-5; 0,0"
          dur="2.5s"
          repeatCount="indefinite"/>
        VOTE
      </text>

      {/* Decorative stars/particles */}
      <circle cx="160" cy="40" r="4" fill="#E3F2FD">
         <animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="30" cy="80" r="3" fill="#E3F2FD">
         <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};
