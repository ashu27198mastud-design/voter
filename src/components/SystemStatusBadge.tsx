'use client';

import React, { useEffect, useState } from 'react';

interface SystemStatus {
  geminiConfigured: boolean;
  civicConfigured: boolean;
  mapsConfigured: boolean;
  searchConfigured: boolean;
  firebaseConfigured: boolean;
}

export const SystemStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  if (!status) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase font-bold tracking-wider">
      <StatusItem label="Gemini" active={status.geminiConfigured} fallback="Local Guidance" />
      <StatusItem label="Maps" active={status.mapsConfigured} fallback="Local Resolution" />
      <StatusItem label="Search" active={status.searchConfigured} />
      <StatusItem label="Firebase" active={status.firebaseConfigured} />
    </div>
  );
};

const StatusItem: React.FC<{ label: string; active: boolean; fallback?: string }> = ({ label, active, fallback }) => (
  <div className={`px-2 py-0.5 rounded-full border transition-colors ${
    active 
      ? 'bg-green-50 text-green-600 border-green-100' 
      : 'bg-amber-50 text-amber-600 border-amber-100'
  }`}>
    {label}: {active ? 'Connected' : (fallback || 'Not Configured')}
  </div>
);
