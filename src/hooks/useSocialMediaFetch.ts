// ============================================
// SOCIAL MEDIA FOLLOWER COUNT FETCH HOOK
// ============================================

import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface FollowerData {
  platform: string;
  username: string;
  followerCount: number;
  profileUrl?: string;
  displayName?: string;
  verified?: boolean;
  error?: string;
}

export interface FetchResult {
  success: boolean;
  data?: FollowerData;
  error?: string;
}

export function useSocialMediaFetch() {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch follower count for a single platform
   */
  const fetchFollowerCount = useCallback(
    async (platform: string, username: string): Promise<FetchResult> => {
      if (!username || username.trim().length === 0) {
        return { success: false, error: 'Username is required' };
      }

      setIsFetching(true);
      setError(null);

      try {
        const fetchFunction = httpsCallable(functions, 'fetchFollowerCountFunction');
        const result = await fetchFunction({ platform, username });

        const data = result.data as FollowerData;

        return {
          success: true,
          data,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch follower count';
        setError(errorMessage);

        // Handle specific errors
        if (err.code === 'resource-exhausted') {
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
          };
        }

        if (err.code === 'not-found') {
          return {
            success: false,
            error: 'Profile not found. Please check the username.',
          };
        }

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  /**
   * Fetch follower counts for multiple platforms in batch
   */
  const fetchMultipleFollowerCounts = useCallback(
    async (requests: Array<{ platform: string; username: string }>): Promise<{
      success: boolean;
      data?: FollowerData[];
      error?: string;
    }> => {
      if (!requests || requests.length === 0) {
        return { success: false, error: 'No requests provided' };
      }

      if (requests.length > 10) {
        return { success: false, error: 'Maximum 10 requests per batch' };
      }

      setIsFetching(true);
      setError(null);

      try {
        const fetchFunction = httpsCallable(functions, 'fetchMultipleFollowerCountsFunction');
        const result = await fetchFunction({ requests });

        const data = result.data as FollowerData[];

        return {
          success: true,
          data,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch follower counts';
        setError(errorMessage);

        if (err.code === 'resource-exhausted') {
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
          };
        }

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  /**
   * Get rate limit status for current user
   */
  const getRateLimitStatus = useCallback(async (platform?: string) => {
    try {
      const statusFunction = httpsCallable(functions, 'getRateLimitStatusFunction');
      const result = await statusFunction(platform ? { platform } : {});

      return result.data;
    } catch (err: any) {
      console.error('Failed to get rate limit status:', err);
      return null;
    }
  }, []);

  return {
    fetchFollowerCount,
    fetchMultipleFollowerCounts,
    getRateLimitStatus,
    isFetching,
    error,
  };
}
