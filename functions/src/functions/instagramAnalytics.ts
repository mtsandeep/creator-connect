// ============================================
// INSTAGRAM ANALYTICS FUNCTION
// ============================================

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import {
  fetchInstagramAnalytics,
  fetchInstagramAnalyticsAlt,
  fetchInstagramPostsAnalytics,
  InsufficientDataError,
} from '../apifyClient';
import { checkRateLimit, incrementRateLimit } from '../rateLimiter';
import { COLLECTIONS, ERRORS } from '../config';
import { db } from '../db';

interface FetchInstagramAnalyticsData {
  username: string;
}

/**
 * Fetch detailed Instagram analytics and store in Firestore
 *
 * This function implements a dual-track parallel fetching strategy:
 * Track 1: Posts analytics (always fetched - engagement rate calculation)
 * Track 2: Analytics (either primary OR alt - fake followers check)
 * Both tracks run in parallel and are independent
 *
 * @param {object} data - Function input
 * @param {string} data.username - Instagram username to fetch analytics for
 * @returns {object} Combined Instagram analytics data
 */
export const fetchInstagramAnalyticsFunction = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<FetchInstagramAnalyticsData>) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = request.auth.uid;
    const { username } = request.data as FetchInstagramAnalyticsData;

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

      // Helper function to check cache for a specific collection
      const checkCache = async (collectionName: string) => {
        const analyticsRef = db.collection(collectionName).doc(cleanUsername);
        const analyticsDoc = await analyticsRef.get();

        if (analyticsDoc.exists) {
          const cachedData = analyticsDoc.data() as any & { cachedAt: number };
          const cacheAge = Date.now() - cachedData.cachedAt;

          // Cache is valid for 7 days (604800 seconds)
          if (cacheAge < 604800000) {
            logger.info(`Cache hit for ${collectionName}: ${cleanUsername}`);
            return {
              ...cachedData,
              fromCache: true,
            };
          }
        }
        return null;
      };

      // Helper function to store data in cache
      const storeCache = async (collectionName: string, data: any) => {
        const analyticsRef = db.collection(collectionName).doc(cleanUsername);

        // Fields to exclude from Firestore (large arrays/nested structures)
        const excludedFields = [
          'engagementForRecentPosts',
          'followersOverTime',
          'likesOverTime',
          'mostUsedMentions',
          'mostUsedHashtags',
          'popularPosts',
          'posts',
        ];

        // Filter out excluded fields and undefined values
        const filteredData = Object.fromEntries(
          Object.entries(data).filter(([key, value]) =>
            value !== undefined && !excludedFields.includes(key)
          )
        );

        await analyticsRef.set({
          ...filteredData,
          cachedAt: Date.now(),
        });
      };

      // ============================================
      // PARALLEL FETCH: Start both tracks simultaneously
      // ============================================
      logger.info(`Starting parallel fetch for ${cleanUsername}`);

      // Track if any API call was made (for rate limit)
      let apiCallMade = false;

      // Track which analytics collection was used (for profile pic update)
      let analyticsCollectionUsed: string | null = null;

      const fetchRegularAnalytics = async (): Promise<any> => {
        // Check primary cache first
        const cachedPrimary = await checkCache(COLLECTIONS.INSTAGRAM_ANALYTICS);
        if (cachedPrimary) {
          if (
            (cachedPrimary.engagementRate === 0 && cachedPrimary.averageLikes === 0) ||
            cachedPrimary.audienceCredibility === 0
          ) {
            logger.warn(`Cached primary analytics returned zero engagement/credibility for ${cleanUsername}, trying alt`);
          } else {
            logger.info(`Using cached primary analytics for ${cleanUsername}`);
            analyticsCollectionUsed = COLLECTIONS.INSTAGRAM_ANALYTICS;
            return cachedPrimary;
          }
        }

        // Check alt cache
        const cachedAlt = await checkCache(COLLECTIONS.INSTAGRAM_ANALYTICS_ALT);
        if (cachedAlt) {
          logger.info(`Using cached alt analytics for ${cleanUsername}`);
          analyticsCollectionUsed = COLLECTIONS.INSTAGRAM_ANALYTICS_ALT;
          return cachedAlt;
        }

        // Both caches missed - try primary then alt
        logger.info(`Fetching primary analytics from API for ${cleanUsername}`);
        try {
          const result = await fetchInstagramAnalytics(cleanUsername);

          // Mark that API call was made
          apiCallMade = true;

          // Check if engagementRate and averageLikes are exactly 0 (failed)
          if (
            (result.engagementRate === 0 && result.averageLikes === 0) ||
            result.audienceCredibility === 0
          ) {
            logger.warn(`Primary analytics returned zero engagement/credibility for ${cleanUsername}, trying alt`);
            throw new Error('Primary analytics returned zero engagement/credibility');
          }

          await storeCache(COLLECTIONS.INSTAGRAM_ANALYTICS, result);
          analyticsCollectionUsed = COLLECTIONS.INSTAGRAM_ANALYTICS;
          logger.info(`Successfully fetched and cached primary analytics for ${cleanUsername}`);
          return { ...result, fromCache: false };
        } catch (primaryError: any) {
          logger.warn(`Primary analytics failed for ${cleanUsername}: ${primaryError.message}`);

          // Try alt analytics
          logger.info(`Fetching alt analytics from API for ${cleanUsername}`);
          try {
            const altResult = await fetchInstagramAnalyticsAlt(cleanUsername);

            // Mark that API call was made
            apiCallMade = true;

            await storeCache(COLLECTIONS.INSTAGRAM_ANALYTICS_ALT, altResult);
            analyticsCollectionUsed = COLLECTIONS.INSTAGRAM_ANALYTICS_ALT;
            logger.info(`Successfully fetched and cached alt analytics for ${cleanUsername}`);
            return { ...altResult, fromCache: false };
          } catch (altError: any) {
            logger.error(`Both analytics sources failed for ${cleanUsername}`, altError);
            throw new Error('All analytics sources failed');
          }
        }
      };

      // ============================================
      // TRACK 2: Posts Analytics (waits for follower count only when needed)
      // ============================================
      logger.info(`Starting Track 2: Posts analytics for ${cleanUsername}`);

      const fetchPostsAnalytics = async (): Promise<any> => {
        // Check cache first
        const cachedPosts = await checkCache(COLLECTIONS.INSTAGRAM_ANALYTICS_POSTS);
        if (cachedPosts) {
          logger.info(`Using cached posts analytics for ${cleanUsername}`);
          return cachedPosts;
        }

        // Cache miss - wait for analytics to get follower count
        logger.info(`Waiting for follower count from analytics for ${cleanUsername}`);
        const analyticsData = await fetchRegularAnalytics();
        const followersCountFromAnalytics = analyticsData.followers || analyticsData.followersCount || 0;

        // Cache miss - fetch from API
        if (followersCountFromAnalytics <= 0) {
          throw new Error('Cannot fetch posts analytics without follower count from analytics');
        }

        logger.info(`Fetching posts analytics from API for ${cleanUsername} (using follower count: ${followersCountFromAnalytics})`);
        
        // Mark that API call was made BEFORE the actual API call
        // This ensures rate limit is incremented even if the API call fails
        apiCallMade = true;
        
        const result = await fetchInstagramPostsAnalytics(cleanUsername, followersCountFromAnalytics, 36);

        await storeCache(COLLECTIONS.INSTAGRAM_ANALYTICS_POSTS, result);
        logger.info(`Successfully fetched and cached posts analytics for ${cleanUsername}`);
        return { ...result, fromCache: false };
      };

      // Fetch both tracks in parallel
      const [analyticsResult, postsResult] = await Promise.allSettled([
        fetchRegularAnalytics(),
        fetchPostsAnalytics()
      ]);
      
      const analyticsData = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;
      const postsData = postsResult.status === 'fulfilled' ? postsResult.value : null;

      if (!analyticsData) {
        const error = analyticsResult.status === 'rejected' ? analyticsResult.reason : new Error('Analytics fetch failed');
        logger.error(`Regular analytics failed for ${cleanUsername}:`, error);
        throw new HttpsError(
          'internal',
          'Failed to fetch analytics data. Please try again later.'
        );
      }

      // Increment rate limit ONCE if any API call was made
      if (apiCallMade) {
        await incrementRateLimit(userId, 'instagram');
        logger.info(`Rate limit incremented for ${cleanUsername} (API calls were made)`);
      } else {
        logger.info(`No rate limit increment for ${cleanUsername} (all data from cache)`);
      }

      // Log error if posts failed
      if (postsResult.status === 'rejected') {
        logger.error(`Posts analytics failed for ${cleanUsername}:`, postsResult.reason);
      }

      // PATCHY LOGIC: Update analytics document with profile picture from posts data
      // The primary analytics actor doesn't provide profile picture, so we extract it from posts
      if (postsData && postsData.profilePicBase64 && analyticsCollectionUsed) {
        try {
          const analyticsRef = db.collection(analyticsCollectionUsed).doc(cleanUsername);
          await analyticsRef.update({
            profilePicBase64: postsData.profilePicBase64,
            profilePicUrl: postsData.profilePicUrl,
            postsAnalytics: postsData, // Also store posts analytics nested
          });
          logger.info(`Updated analytics document with profile picture and posts analytics for ${cleanUsername}`);
        } catch (error) {
          // Non-critical error, log but don't fail the request
          logger.warn(`Failed to update analytics document with profile picture: ${error}`);
        }
      }

      // Combine results - nest posts analytics under postsAnalytics property
      const combinedResult: any = {
        // Regular analytics data (always available since we fetch it first)
        ...(analyticsData || {}),

        // Posts analytics nested under postsAnalytics property
        ...(postsData ? { postsAnalytics: postsData } : {}),

        // Include profile picture from posts data in the response
        ...(postsData?.profilePicBase64 ? { profilePicBase64: postsData.profilePicBase64 } : {}),
        ...(postsData?.profilePicUrl ? { profilePicUrl: postsData.profilePicUrl } : {}),

        // Metadata
        fetchedAt: new Date().toISOString(),
        username: cleanUsername,
      };

      // Check if posts failed due to insufficient data
      if (postsResult.status === 'rejected' && postsResult.reason instanceof InsufficientDataError) {
        const insufficientError = postsResult.reason;
        // Add limited data flag to result so frontend can handle it
        (combinedResult as any).limitedDataError = {
          postsFound: insufficientError.postsFound,
          postsRequired: insufficientError.postsRequired,
          reason: insufficientError.reason,
          message: insufficientError.message,
          totalFetched: insufficientError.totalFetched,
          tooOld: insufficientError.tooOld,
          tooRecent: insufficientError.tooRecent,
        };
      }

      // Log which tracks succeeded
      logger.info(`Fetch completed for ${cleanUsername} - Posts: ${postsData ? 'success' : 'failed'}, Analytics: success`);

      return combinedResult;
    } catch (error: any) {
      logger.error(`Error fetching Instagram analytics:`, error);

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
