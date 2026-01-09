// ============================================
// INSTAGRAM ANALYTICS FETCH HOOK
// ============================================

import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type { InstagramAnalytics, InstagramAnalyticsAlt } from '../types';

export interface InstagramAnalyticsResult {
  success: boolean;
  data?: (InstagramAnalytics | InstagramAnalyticsAlt) & { fromCache?: boolean };
  error?: string;
}

export function useInstagramAnalytics() {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch detailed Instagram analytics for a username
   * Returns data from either the primary or alternative source
   */
  const fetchAnalytics = useCallback(
    async (username: string): Promise<InstagramAnalyticsResult> => {
      if (!username || username.trim().length === 0) {
        return { success: false, error: 'Username is required' };
      }

      setIsFetching(true);
      setError(null);

      try {
        const fetchFunction = httpsCallable(functions, 'fetchInstagramAnalyticsFunction');
        const result = await fetchFunction({ username });

        // The result can be either InstagramAnalytics or InstagramAnalyticsAlt
        // We use a type guard to determine which one it is
        const data = result.data as InstagramAnalytics | InstagramAnalyticsAlt;

        return {
          success: true,
          data: {
            ...data,
            fromCache: (result.data as any).fromCache || false,
          } as (InstagramAnalytics | InstagramAnalyticsAlt) & { fromCache?: boolean },
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch Instagram analytics';
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
            error: 'Instagram profile not found. Please check the username.',
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

  return {
    fetchAnalytics,
    isFetching,
    error,
  };
}
