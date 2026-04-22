import { useState, useCallback } from 'react';
import { UserLocation } from '../types';
import { fetchVoterInfo, fetchRepresentativesInfo, VoterInfoResponse, RepresentativesResponse } from '../lib/civic-info';

interface UseElectionDataReturn {
  location: UserLocation | null;
  setLocation: (location: UserLocation | null) => void;
  voterInfo: VoterInfoResponse | null;
  repsInfo: RepresentativesResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchDataForLocation: (loc: UserLocation) => Promise<void>;
}

export function useElectionData(): UseElectionDataReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [voterInfo, setVoterInfo] = useState<VoterInfoResponse | null>(null);
  const [repsInfo, setRepsInfo] = useState<RepresentativesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataForLocation = useCallback(async (loc: UserLocation) => {
    setIsLoading(true);
    setError(null);
    setLocation(loc);

    if (!loc.formattedAddress) {
      // If no formatted address, construct a basic one. The Places API usually provides one.
      loc.formattedAddress = `${loc.city}, ${loc.state}, ${loc.country}`;
    }

    try {
      // Fetch both APIs in parallel
      const [voterData, repsData] = await Promise.all([
        fetchVoterInfo(loc.formattedAddress),
        fetchRepresentativesInfo(loc.formattedAddress)
      ]);

      setVoterInfo(voterData);
      setRepsInfo(repsData);

      // Only show error if BOTH fail AND it wasn't a missing key situation
      // (non-US addresses legitimately return no data from the US Civic API)
      if (!voterData && !repsData) {
        // Don't block the UI — we'll show generic timeline steps instead
        setError(null); // clear any previous error
      }

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
