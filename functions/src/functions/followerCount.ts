// ============================================
// FOLLOWER COUNT FUNCTIONS
// ============================================

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { fetchFollowerCount, FollowerData } from '../apifyClient';
import { checkRateLimit, incrementRateLimit, getRateLimitStatus } from '../rateLimiter';
import { ERRORS } from '../config';
import { checkCache, storeCache } from './shared';

interface FetchFollowerCountData {
  platform: string;
  username: string;
}

interface FetchMultipleData {
  requests: Array<{ platform: string; username: string }>;
}

/**
 * Fetch follower count for a single social media profile
 *
 * @param {object} data - Function input
 * @param {string} data.platform - Platform name (instagram, youtube, facebook)
 * @param {string} data.username - Username/handle to fetch
 * @returns {object} Follower data
 */
export const fetchFollowerCountFunction = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<FetchFollowerCountData>) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = request.auth.uid;
    const { platform, username } = request.data as FetchFollowerCountData;

    // Validate inputs
    if (!platform || !username) {
      throw new HttpsError(
        'invalid-argument',
        'Platform and username are required'
      );
    }

    const validPlatforms = ['instagram', 'youtube', 'facebook'];
    if (!validPlatforms.includes(platform)) {
      throw new HttpsError(
        'invalid-argument',
        ERRORS.INVALID_PLATFORM
      );
    }

    try {
      // Check rate limit (doesn't increment)
      await checkRateLimit(userId, platform);

      // Check cache first
      const cached = await checkCache(platform, username);
      if (cached) {
        logger.info(`Cache hit for ${platform}/${username}`);
        return cached;
      }

      // Fetch from Apify
      logger.info(`Fetching ${platform}/${username} from Apify`);
      const result = await fetchFollowerCount(platform, username);

      // Increment rate limit ONLY after successful API call
      await incrementRateLimit(userId, platform);

      // Store in cache
      await storeCache(result);

      return result;
    } catch (error: any) {
      logger.error(`Error fetching follower count:`, error);

      if (error.message === ERRORS.RATE_LIMIT_EXCEEDED || error.message.includes('exceeded')) {
        throw new HttpsError(
          'resource-exhausted',
          error.message
        );
      }

      if (error.message === ERRORS.NOT_FOUND) {
        throw new HttpsError(
          'not-found',
          `Profile not found: ${username} on ${platform}`
        );
      }

      throw new HttpsError(
        'internal',
        ERRORS.APIFY_ERROR
      );
    }
  }
);

/**
 * Fetch follower counts for multiple profiles in batch
 *
 * @param {object} data - Function input
 * @param {Array<{platform: string, username: string}>} data.requests - Array of fetch requests
 * @returns {object[]} Array of follower data
 */
export const fetchMultipleFollowerCountsFunction = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<FetchMultipleData>) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = request.auth.uid;
    const { requests } = request.data as FetchMultipleData;

    // Validate inputs
    if (!Array.isArray(requests) || requests.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'Requests must be a non-empty array'
      );
    }

    if (requests.length > 10) {
      throw new HttpsError(
        'invalid-argument',
        'Maximum 10 requests per batch'
      );
    }

    // Validate each request
    const validPlatforms = ['instagram', 'youtube', 'facebook'];
    for (const req of requests) {
      if (!req.platform || !req.username) {
        throw new HttpsError(
          'invalid-argument',
          'Each request must have platform and username'
        );
      }
      if (!validPlatforms.includes(req.platform)) {
        throw new HttpsError(
          'invalid-argument',
          ERRORS.INVALID_PLATFORM
        );
      }
    }

    try {
      const results: FollowerData[] = [];

      // Check rate limits for each platform
      const platformCounts = requests.reduce((acc, req) => {
        acc[req.platform] = (acc[req.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      for (const [platform, count] of Object.entries(platformCounts)) {
        for (let i = 0; i < count; i++) {
          await checkRateLimit(userId, platform);
        }
      }

      // Process requests
      for (const req of requests) {
        try {
          // Check cache first
          const cached = await checkCache(req.platform, req.username);
          if (cached) {
            results.push(cached);
            continue;
          }

          // Fetch from Apify
          const result = await fetchFollowerCount(req.platform, req.username);

          // Increment rate limit ONLY after successful API call
          await incrementRateLimit(userId, req.platform);

          // Store in cache
          await storeCache(result);

          results.push(result);
        } catch (error: any) {
          logger.error(
            `Error fetching ${req.platform}/${req.username}:`,
            error
          );
          // Add error result but continue with others
          results.push({
            platform: req.platform,
            username: req.username,
            followerCount: 0,
            error: error.message,
          } as FollowerData & { error: string });
        }
      }

      return results;
    } catch (error: any) {
      logger.error(`Error in batch fetch:`, error);

      if (error.message === ERRORS.RATE_LIMIT_EXCEEDED || error.message.includes('exceeded')) {
        throw new HttpsError(
          'resource-exhausted',
          error.message
        );
      }

      throw new HttpsError(
        'internal',
        ERRORS.APIFY_ERROR
      );
    }
  }
);

/**
 * Get rate limit status for current user
 *
 * @param {object} data - Function input
 * @param {string} data.platform - Platform to check (optional)
 * @returns {object} Rate limit status
 */
export const getRateLimitStatusFunction = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<{ platform?: string }>) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = request.auth.uid;
    const { platform } = request.data as { platform?: string };

    try {
      if (platform) {
        return {
          [platform]: await getRateLimitStatus(userId, platform),
        };
      }

      // Get status for all platforms
      const platforms = ['instagram', 'youtube', 'facebook'];
      const status: Record<string, { remaining: number; resetAt: number }> = {};

      for (const p of platforms) {
        status[p] = await getRateLimitStatus(userId, p);
      }

      return status;
    } catch (error: any) {
      logger.error(`Error getting rate limit status:`, error);
      throw new HttpsError(
        'internal',
        'Failed to get rate limit status'
      );
    }
  }
);
