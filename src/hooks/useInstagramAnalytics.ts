// ============================================
// INSTAGRAM ANALYTICS FETCH HOOK
// ============================================

import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type { InstagramAnalytics } from '../types';

export interface InstagramAnalyticsResult {
  success: boolean;
  data?: InstagramAnalytics & { fromCache?: boolean };
  error?: string;
}

export function useInstagramAnalytics() {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch detailed Instagram analytics for a username
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

        const data = result.data as InstagramAnalytics & { fromCache?: boolean };

        return {
          success: true,
          data,
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
