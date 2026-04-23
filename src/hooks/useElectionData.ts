import { useState, useCallback } from 'react';
import { UserLocation } from '../types';
import { fetchVoterInfo, VoterInfoResponse } from '@/services/civic';

interface UseElectionDataReturn {
  location: UserLocation | null;
  setLocation: (location: UserLocation | null) => void;
  voterInfo: VoterInfoResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchDataForLocation: (loc: UserLocation) => Promise<void>;
}

/**
 * Hook to manage localized election data fetching and state.
 */
export function useElectionData(): UseElectionDataReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [voterInfo, setVoterInfo] = useState<VoterInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataForLocation = useCallback(async (loc: UserLocation) => {
    setIsLoading(true);
    setError(null);
    setLocation(loc);

    const address = loc.formattedAddress || `${loc.city}, ${loc.state}, ${loc.country}`;

    try {
      const voterData = await fetchVoterInfo(address);

      if (!voterData) {
        setError('Unable to fetch verified election data for this location right now.');
        setVoterInfo(null);
      } else {
        setVoterInfo(voterData);
      }
    } catch (err) {
      console.error('Error fetching civic data:', err);
      setError('An error occurred while fetching verified election data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    setLocation,
    voterInfo,
    isLoading,
    error,
    fetchDataForLocation,
  };
}
