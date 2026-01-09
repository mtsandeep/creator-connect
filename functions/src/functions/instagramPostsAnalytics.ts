// ============================================
// INSTAGRAM POSTS ANALYTICS FUNCTION
// ============================================

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { fetchInstagramPostsAnalytics, InstagramPostsAnalyticsData, InsufficientDataError } from '../apifyClient';
import { fetchFollowerCount } from '../apifyClient';
import { checkRateLimit, incrementRateLimit } from '../rateLimiter';
import { COLLECTIONS, ERRORS, APIFY_CONFIG } from '../config';
import { db } from '../db';

interface FetchInstagramPostsAnalyticsData {
  username: string;
  followersCount?: number; // Optional: if not provided, will fetch follower count first
}

/**
 * Fetch Instagram posts analytics with engagement rate calculation
 *
 * This function:
 * 1. Fetches up to 36 posts from the user's profile
 * 2. Filters posts by date (24 hours to 60 days old)
 * 3. Removes negative outliers (very low engagement)
 * 4. Calculates two engagement rates:
 *    - General: includes all posts (after negative outlier removal)
 *    - Typical: viral posts capped at 3x median
 *
 * @param {object} data - Function input
 * @param {string} data.username - Instagram username to fetch analytics for
 * @param {number} data.followersCount - (Optional) Follower count for engagement calculation
 * @returns {object} Instagram posts analytics data
 */
export const fetchInstagramPostsAnalyticsFunction = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<FetchInstagramPostsAnalyticsData>) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = request.auth.uid;
    const { username, followersCount: providedFollowersCount } = request.data as FetchInstagramPostsAnalyticsData;

    // Validate inputs
    if (!username || username.trim().length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'Username is required'
      );
    }

    const cleanUsername = username.trim().replace('@', '');

    try {
      // Check rate limit (using instagram platform)
      await checkRateLimit(userId, 'instagram');

      // Step 1: Get follower count if not provided
      let followersCount = providedFollowersCount;

      if (followersCount === undefined || followersCount <= 0) {
        logger.info(`Fetching follower count for ${cleanUsername} first`);
        try {
          const followerData = await fetchFollowerCount('instagram', cleanUsername);
          followersCount = followerData.followerCount;
          // Increment rate limit for follower count API call
          await incrementRateLimit(userId, 'instagram');
        } catch (error: any) {
          logger.error(`Failed to fetch follower count for ${cleanUsername}:`, error);
          throw new HttpsError(
            'not-found',
            `Could not fetch follower count for ${username}. Please verify the username.`
          );
        }
      }

      if (followersCount <= 0) {
        throw new HttpsError(
          'failed-precondition',
          'Invalid follower count. Profile may be private or have no followers.'
        );
      }

      // Step 2: Check cache
      const cacheRef = db.collection(COLLECTIONS.INSTAGRAM_ANALYTICS_POSTS).doc(cleanUsername);
      const cacheDoc = await cacheRef.get();

      if (cacheDoc.exists) {
        const cachedData = cacheDoc.data() as InstagramPostsAnalyticsData & { cachedAt: number };
        const cacheAge = Date.now() - cachedData.cachedAt;

        // Cache is valid for 7 days (from config)
        if (cacheAge < APIFY_CONFIG.CACHE_DURATION * 1000 && cachedData.followers === followersCount) {
          logger.info(`Cache hit for Instagram posts analytics: ${cleanUsername}`);
          return {
            ...cachedData,
            fromCache: true,
          };
        }
      }

      // Step 3: Fetch from Apify
      logger.info(`Fetching Instagram posts analytics for ${cleanUsername} from Apify`);
      const result = await fetchInstagramPostsAnalytics(cleanUsername, followersCount, 36);

      // Increment rate limit ONLY after successful API call
      await incrementRateLimit(userId, 'instagram');

      // Step 4: Store in cache (exclude large arrays from Firestore)
      const excludedFields = ['posts'];
      const filteredData = Object.fromEntries(
        Object.entries(result).filter(([key]) =>
          !excludedFields.includes(key)
        )
      );

      await cacheRef.set({
        ...filteredData,
        cachedAt: Date.now(),
      });

      return {
        ...result,
        fromCache: false,
      };
    } catch (error: any) {
      logger.error(`Error fetching Instagram posts analytics:`, error);

      // Handle insufficient data error specifically
      if (error instanceof InsufficientDataError) {
        throw new HttpsError(
          'failed-precondition',
          error.message,
          {
            postsFound: error.postsFound,
            postsRequired: error.postsRequired,
            reason: error.reason,
            totalFetched: error.totalFetched,
            tooOld: error.tooOld,
            tooRecent: error.tooRecent,
          }
        );
      }

      if (error.message === ERRORS.RATE_LIMIT_EXCEEDED || error.message.includes('exceeded')) {
        throw new HttpsError(
          'resource-exhausted',
          error.message
        );
      }

      if (error.message === ERRORS.NOT_FOUND || error.message.includes('not found')) {
        throw new HttpsError(
          'not-found',
          `Instagram profile not found: ${username}`
        );
      }

      throw new HttpsError(
        'internal',
        ERRORS.APIFY_ERROR
      );
    }
  }
);
