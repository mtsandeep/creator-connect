import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { useState, useCallback } from 'react';

interface PublicProfile {
  uid: string;
  influencerProfile: {
    displayName: string | null;
    username: string | null;
    profileImage: string | null;
    categories: string[];
    linkInBio: string | null;
    bio: string | null;
    socialMediaLinks: any[];
    pricing: any;
  };
  verificationBadges: {
    influencerVerified: boolean;
    influencerTrusted: boolean;
  };
  avgRating: number;
  totalReviews: number;
  isInfluencer: boolean;
}

interface PublicProfileResult {
  success: boolean;
  profile?: PublicProfile;
  error?: string;
}

interface PublicProfilesResult {
  success: boolean;
  profiles?: PublicProfile[];
  error?: string;
}

export function usePublicProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const functions = getFunctions();

  const getPublicProfile = useCallback(async (userId: string): Promise<PublicProfileResult> => {
    setLoading(true);
    setError(null);

    try {
      const getPublicProfileFn = httpsCallable(functions, 'getPublicProfile');
      const result = await getPublicProfileFn({ userId });

      return result.data as PublicProfileResult;
    } catch (err: any) {
      const errorMessage = err.details || err.message || 'Failed to get public profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [functions]);

  const getPublicProfiles = useCallback(async (userIds: string[]): Promise<PublicProfilesResult> => {
    setLoading(true);
    setError(null);

    try {
      const getPublicProfilesFn = httpsCallable(functions, 'getPublicProfiles');
      const result = await getPublicProfilesFn({ userIds });

      return result.data as PublicProfilesResult;
    } catch (err: any) {
      const errorMessage = err.details || err.message || 'Failed to get public profiles';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [functions]);

  const searchPublicProfiles = useCallback(async (username: string): Promise<PublicProfilesResult> => {
    setLoading(true);
    setError(null);

    try {
      const searchPublicProfilesFn = httpsCallable(functions, 'searchPublicProfiles');
      const result = await searchPublicProfilesFn({ username });

      return result.data as PublicProfilesResult;
    } catch (err: any) {
      const errorMessage = err.details || err.message || 'Failed to search public profiles';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [functions]);

  return {
    getPublicProfile,
    getPublicProfiles,
    searchPublicProfiles,
    loading,
    error
  };
}
