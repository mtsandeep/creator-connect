// ============================================
// USERNAME VALIDATION FUNCTION
// ============================================

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { db } from '../db';

// Restricted usernames list
const RESTRICTED_USERNAMES = [
  // Admin and system names
  'admin', 'administrator', 'root', 'system', 'superadmin', 'moderator',
  'staff', 'support', 'help', 'info', 'contact', 'service', 'team',
  'official', 'verified', 'bot', 'automation', 'api', 'test', 'demo',
  
  // Common generic names
  'user', 'profile', 'account', 'settings', 'dashboard', 'home', 'index',
  'login', 'signup', 'register', 'auth', 'password', 'security', 'privacy',
  
  // Platform-specific names
  'instagram', 'facebook', 'youtube', 'twitter', 'tiktok', 'linkedin',
  'social', 'media', 'influencer', 'creator', 'brand', 'business',
  
  // Inappropriate or offensive words (basic filter)
  'spam', 'scam', 'fake', 'null', 'undefined', 'void', 'error', 'hack',
  
  // Reserved for future use
  'new', 'latest', 'featured', 'popular', 'trending', 'explore', 'discover',
  
  // Common company/brand names
  'google', 'apple', 'microsoft', 'amazon', 'meta', 'tesla', 'netflix'
];

// Function to check if username is restricted
const isUsernameRestricted = (username: string): boolean => {
  const lowerUsername = username.toLowerCase();
  return RESTRICTED_USERNAMES.includes(lowerUsername) ||
         RESTRICTED_USERNAMES.some(restricted => lowerUsername.includes(restricted));
};

interface CheckUsernameData {
  username: string;
}

/**
 * Check username availability with validation
 *
 * @param {object} data - Function input
 * @param {string} data.username - Username to check
 * @returns {object} Availability result with reason
 */
export const checkUsernameAvailabilityFunction = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<CheckUsernameData>) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to check username availability'
      );
    }

    const { username } = request.data;

    // Validate input
    if (!username || typeof username !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'Username is required and must be a string'
      );
    }

    // Normalize username
    const normalizedUsername = username.trim().replace(/^@+/, '');
    
    // Basic validation
    if (normalizedUsername.length < 3) {
      return { 
        available: false, 
        reason: 'Username must be at least 3 characters long' 
      };
    }

    if (normalizedUsername.length > 30) {
      return { 
        available: false, 
        reason: 'Username must be no more than 30 characters long' 
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return { 
        available: false, 
        reason: 'Username can only contain letters, numbers, and underscores' 
      };
    }

    // Check if username is restricted
    if (isUsernameRestricted(normalizedUsername)) {
      return { 
        available: false, 
        reason: 'This username is not allowed. Please choose a different username.' 
      };
    }

    try {
      // Check if username already exists in influencer profiles
      const influencerQuery = db.collection('users')
        .where('influencerProfile.username', '==', normalizedUsername)
        .limit(1);
      
      const influencerSnapshot = await influencerQuery.get();
      if (!influencerSnapshot.empty) {
        return { 
          available: false, 
          reason: 'Username already taken' 
        };
      }

      // Backward compatibility: check for usernames with '@ prefix
      const legacyQuery = db.collection('users')
        .where('influencerProfile.username', '==', `@${normalizedUsername}`)
        .limit(1);
      
      const legacySnapshot = await legacyQuery.get();
      if (!legacySnapshot.empty) {
        return { 
          available: false, 
          reason: 'Username already taken' 
        };
      }

      // Username is available
      return { 
        available: true, 
        reason: 'Username is available' 
      };

    } catch (error) {
      logger.error('Error checking username availability:', error);
      throw new HttpsError(
        'internal',
        'Failed to check username availability'
      );
    }
  }
);
