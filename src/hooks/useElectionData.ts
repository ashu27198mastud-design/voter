import { useState, useCallback } from 'react';
import { UserLocation } from '../types';
import { fetchVoterInfo, fetchRepresentatives, VoterInfoResponse } from '@/services/civic';

interface UseElectionDataReturn {
  location: UserLocation | null;
  setLocation: (location: UserLocation | null) => void;
  voterInfo: VoterInfoResponse | null;
  repsInfo: any | null;
  isLoading: boolean;
  error: string | null;
  fetchDataForLocation: (loc: UserLocation) => Promise<void>;
}

/**
 * Hook to manage localized election data fetching and state.
 * Optimized with useCallback to prevent unnecessary re-renders in parent components.
 */
export function useElectionData(): UseElectionDataReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [voterInfo, setVoterInfo] = useState<VoterInfoResponse | null>(null);
  const [repsInfo, setRepsInfo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataForLocation = useCallback(async (loc: UserLocation) => {
    setIsLoading(true);
    setError(null);
    setLocation(loc);

    const address = loc.formattedAddress || `${loc.city}, ${loc.state}, ${loc.country}`;

    try {
      // Parallel execution for better performance
      const [voterData, repsData] = await Promise.all([
        fetchVoterInfo(address),
        fetchRepresentatives(address)
      ]);

      setVoterInfo(voterData);
      setRepsInfo(repsData);

    } catch (err) {
      console.error("Error fetching civic data:", err);
      setError("An error occurred while fetching verified election data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    setLocation,
    voterInfo,
    repsInfo,
    isLoading,
    error,
    fetchDataForLocation
  };
}
