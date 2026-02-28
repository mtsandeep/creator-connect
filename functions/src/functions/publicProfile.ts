import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { admin } from '../db';

// ============================================
// PUBLIC PROFILE FUNCTION
// ============================================

interface GetPublicProfileData {
  userId: string;
}

interface GetPublicProfilesData {
  userIds: string[];
}

interface SearchPublicProfilesData {
  username: string;
}

interface GetProfileByUsernameData {
  username: string;
}

function sanitizeForJson(value: any): any {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForJson);
  }

  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeForJson(v);
    }
    return out;
  }

  return value;
}

// ============================================
// HELPER FUNCTION
// ============================================

/**
 * Process user data and return public-safe profile
 * This helper function is used by all public profile functions to avoid code duplication
 */
function processPublicProfile(userData: any, uid: string): any {
  // Calculate startingFrom from rates (but don't expose the rates themselves)
  const rates = userData.influencerProfile?.pricing?.rates || [];
  const positiveRates = rates
    .map((r: any) => r?.price)
    .filter((price: any) => typeof price === 'number' && Number.isFinite(price) && price > 0) as number[];
  const startingFromRaw = positiveRates.length > 0 ? Math.min(...positiveRates) : undefined;
  const startingFrom = typeof startingFromRaw === 'number' && Number.isFinite(startingFromRaw) ? startingFromRaw : undefined;
  
  // Check if price should be hidden
  const hidePrice = userData.influencerProfile?.linkInBio?.priceOnRequest || false;
  
  // Return public-safe fields
  return {
    uid: uid,
    influencerProfile: {
      displayName: userData.influencerProfile?.displayName || null,
      username: userData.influencerProfile?.username || null,
      profileImage: userData.influencerProfile?.profileImage || null,
      categories: userData.influencerProfile?.categories || [],
      bio: userData.influencerProfile?.bio || null,
      linkInBio: userData.influencerProfile?.linkInBio || null,
      socialMediaLinks: userData.influencerProfile?.socialMediaLinks || [],
      pricing: hidePrice ? {
        startingFrom: undefined,
        advancePercentage: 0,
        rates: []
      } : {
        startingFrom: startingFrom,
        advancePercentage: userData.influencerProfile?.pricing?.advancePercentage || 0,
        rates: []
      },
      mediaKit: userData.influencerProfile?.mediaKit || null,
    },
    verificationBadges: {
      influencerVerified: userData.verificationBadges?.influencerVerified || false,
      influencerTrusted: userData.verificationBadges?.influencerTrusted || false,
    },
    avgRating: userData.avgRating || 0,
    totalReviews: userData.totalReviews || 0,
    isInfluencer: !!(userData.influencerProfile?.username),
  };
}

// ============================================
// PUBLIC PROFILE FUNCTIONS
// ============================================
export const getPublicProfile = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<GetPublicProfileData>) => {
    const { userId } = request.data;

    // Input validation
    if (!userId) {
      throw new HttpsError(
        'invalid-argument',
        'userId is required'
      );
    }

    try {
      // Get user document
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new HttpsError(
          'not-found',
          'User not found'
        );
      }

      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError(
          'not-found',
          'User data not found'
        );
      }

      // Use the shared helper function
      const publicProfile = sanitizeForJson(processPublicProfile(userData, userId));

      return sanitizeForJson({
        success: true,
        profile: publicProfile
      });

    } catch (error) {
      logger.error('Error getting public profile:', (error as any)?.message);
      throw new HttpsError(
        'internal',
        'Failed to get public profile'
      );
    }
  }
);

/**
 * Get multiple public profiles (for admin or batch operations)
 * Only returns safe, public fields
 */
export const getPublicProfiles = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<GetPublicProfilesData>) => {
    const { userIds } = request.data;

    // Input validation
    if (!userIds || !Array.isArray(userIds)) {
      throw new HttpsError(
        'invalid-argument',
        'userIds array is required'
      );
    }

    // Limit batch size to prevent abuse
    if (userIds.length > 50) {
      throw new HttpsError(
        'invalid-argument',
        'Maximum 50 profiles per request'
      );
    }

    try {
      const profiles: any[] = [];

      // Batch get all user documents
      const userDocs = await admin.firestore()
        .collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', userIds)
        .get();

      for (const doc of userDocs.docs) {
        const userData = doc.data();
        
        if (!userData) continue;
        
        // Use the shared helper function
        const publicProfile = sanitizeForJson(processPublicProfile(userData, doc.id));
        profiles.push(publicProfile);
      }

      return sanitizeForJson({ success: true, profiles });

    } catch (error) {
      logger.error('Error getting public profiles:', (error as any)?.message);
      throw new HttpsError(
        'internal',
        'Failed to get public profiles'
      );
    }
  }
);

/**
 * Get a single profile by exact username
 * Used for /link/:username routes where exact match is required
 */
export const getProfileByUsername = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<GetProfileByUsernameData>) => {
    const { username } = request.data;

    logger.info('getProfileByUsername called with username:', username);

    // Input validation
    if (!username || typeof username !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'Valid username is required'
      );
    }

    // Normalize username to lowercase for consistent matching
    const normalizedUsername = username.toLowerCase().trim();

    if (normalizedUsername.length < 2) {
      throw new HttpsError(
        'invalid-argument',
        'Valid username (min 2 chars) is required'
      );
    }

    try {
      // EXACT match query - not prefix search
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('influencerProfile.username', '==', normalizedUsername)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        throw new HttpsError(
          'not-found',
          'User not found'
        );
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError(
          'not-found',
          'User data not found'
        );
      }

      // Use the shared helper function
      const publicProfile = sanitizeForJson(processPublicProfile(userData, userDoc.id));

      return sanitizeForJson({ success: true, profile: publicProfile });

    } catch (error) {
      logger.error('Error getting profile by username:', (error as any)?.message);

      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        'Failed to get profile',
        { message: (error as any)?.message }
      );
    }
  }
);

/**
 * Search public profiles by username
 * Only returns safe, public fields
 */
export const searchPublicProfiles = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<SearchPublicProfilesData>) => {
    const { username } = request.data;

    logger.info('searchPublicProfiles called with username:', username);

    // Input validation
    if (!username || typeof username !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'Valid username (min 2 chars) is required'
      );
    }

    if (username.length < 2) {
      throw new HttpsError(
        'invalid-argument',
        'Valid username (min 2 chars) is required'
      );
    }

    try {
      // Search for users with matching username
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('influencerProfile.username', '>=', username)
        .where('influencerProfile.username', '<=', username + '\uf8ff')
        .limit(10) // Limit results
        .get();

      logger.info('Found', usersSnapshot.docs.length, 'users');

      const profiles: any[] = [];

      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        
        if (!userData) continue;
        
        // Use the shared helper function
        const publicProfile = sanitizeForJson(processPublicProfile(userData, doc.id));
        profiles.push(publicProfile);
      }

      return sanitizeForJson({ success: true, profiles });

    } catch (error) {
      logger.error('Error searching public profiles:', (error as any)?.message);
      throw new HttpsError(
        'internal',
        'Failed to search public profiles',
        { message: (error as any)?.message }
      );
    }
  }
);
