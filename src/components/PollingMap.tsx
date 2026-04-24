'use client';

import React from 'react';
import Image from 'next/image';

interface PollingMapProps {
  address: {
    line1: string;
    city: string;
    state: string;
  };
}

export const PollingMap: React.FC<PollingMapProps> = ({ address }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) return null;

  const fullAddress = `${address.line1}, ${address.city}, ${address.state}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  
  // Use Static Maps API for performance and simplicity
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${encodedAddress}&key=${apiKey}`;

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 aspect-video relative">
      <Image 
        src={mapUrl} 
        alt={`Map showing polling location at ${fullAddress}`}
        width={600}
        height={300}
        className="w-full h-full object-cover"
        loading="lazy"
        unoptimized // Static Maps API URLs are already optimized/transformed
      />
      <div className="absolute bottom-3 right-3">
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white px-3 py-1.5 rounded-lg shadow-md text-xs font-bold text-blue-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in Maps
        </a>
      </div>
    </div>
  );
};
