// ============================================
// FIREBASE FUNCTIONS - SOCIAL MEDIA FOLLOWER COUNT
// ============================================

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { fetchFollowerCount, FollowerData } from './apifyClient';
import { checkRateLimit, getRateLimitStatus } from './rateLimiter';
import { APIFY_CONFIG, COLLECTIONS, ERRORS } from './config';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check cache before making API call
 */
async function checkCache(
  platform: string,
  username: string
): Promise<FollowerData | null> {
  const cacheKey = `${platform}_${username}`;
  const cacheRef = db.collection(COLLECTIONS.API_CACHE).doc(cacheKey);

  const doc = await cacheRef.get();

  if (!doc.exists) {
    return null;
  }

  const cachedData = doc.data() as FollowerData & { cachedAt: number };

  // Check if cache is still valid
  const cacheAge = Date.now() - cachedData.cachedAt;
  if (cacheAge > APIFY_CONFIG.CACHE_DURATION * 1000) {
    await cacheRef.delete();
    return null;
  }

  return {
    platform: cachedData.platform,
    username: cachedData.username,
    followerCount: cachedData.followerCount,
    profileUrl: cachedData.profileUrl,
    displayName: cachedData.displayName,
    verified: cachedData.verified,
  };
}

/**
 * Store data in cache
 */
async function storeCache(data: FollowerData): Promise<void> {
  const cacheKey = `${data.platform}_${data.username}`;
  const cacheRef = db.collection(COLLECTIONS.API_CACHE).doc(cacheKey);

  await cacheRef.set({
    ...data,
    cachedAt: Date.now(),
  });
}

// ============================================
// CLOUD FUNCTIONS
// ============================================

/**
 * Fetch follower count for a single social media profile
 *
 * @param {object} data - Function input
 * @param {string} data.platform - Platform name (instagram, youtube, facebook)
 * @param {string} data.username - Username/handle to fetch
 * @returns {object} Follower data
 */
export const fetchFollowerCountFunction = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { platform, username } = data as { platform: string; username: string };

    // Validate inputs
    if (!platform || !username) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Platform and username are required'
      );
    }

    const validPlatforms = ['instagram', 'youtube', 'facebook'];
    if (!validPlatforms.includes(platform)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        ERRORS.INVALID_PLATFORM
      );
    }

    try {
      // Check rate limit
      await checkRateLimit(userId, platform);

      // Check cache first
      const cached = await checkCache(platform, username);
      if (cached) {
        functions.logger.info(`Cache hit for ${platform}/${username}`);
        return cached;
      }

      // Fetch from Apify
      functions.logger.info(`Fetching ${platform}/${username} from Apify`);
      const result = await fetchFollowerCount(platform, username);

      // Store in cache
      await storeCache(result);

      return result;
    } catch (error: any) {
      functions.logger.error(`Error fetching follower count:`, error);

      if (error.message === ERRORS.RATE_LIMIT_EXCEEDED || error.message.includes('exceeded')) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          error.message
        );
      }

      if (error.message === ERRORS.NOT_FOUND) {
        throw new functions.https.HttpsError(
          'not-found',
          `Profile not found: ${username} on ${platform}`
        );
      }

      throw new functions.https.HttpsError(
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
export const fetchMultipleFollowerCountsFunction = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { requests } = data as {
      requests: Array<{ platform: string; username: string }>;
    };

    // Validate inputs
    if (!Array.isArray(requests) || requests.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Requests must be a non-empty array'
      );
    }

    if (requests.length > 10) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Maximum 10 requests per batch'
      );
    }

    // Validate each request
    const validPlatforms = ['instagram', 'youtube', 'facebook'];
    for (const req of requests) {
      if (!req.platform || !req.username) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Each request must have platform and username'
        );
      }
      if (!validPlatforms.includes(req.platform)) {
        throw new functions.https.HttpsError(
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

          // Store in cache
          await storeCache(result);

          results.push(result);
        } catch (error: any) {
          functions.logger.error(
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
      functions.logger.error(`Error in batch fetch:`, error);

      if (error.message === ERRORS.RATE_LIMIT_EXCEEDED || error.message.includes('exceeded')) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          error.message
        );
      }

      throw new functions.https.HttpsError(
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
export const getRateLimitStatusFunction = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { platform } = data as { platform?: string };

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
      functions.logger.error(`Error getting rate limit status:`, error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get rate limit status'
      );
    }
  }
);
