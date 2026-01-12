// ============================================
// RATE LIMITING SERVICE
// ============================================

import { db, FieldValue } from './db';
import { APIFY_CONFIG, COLLECTIONS, ERRORS } from './config';

interface RateLimitDoc {
  userId: string;
  platform: string;
  count: number;
  resetAt: number;
  lastCallAt: number;
}

/**
 * Check rate limit for a user and platform (does NOT increment)
 * @param userId - Firebase Auth UID
 * @param platform - Social media platform (instagram, youtube, facebook)
 * @returns true if allowed, throws error if limit exceeded
 */
export async function checkRateLimit(
  userId: string,
  platform: string
): Promise<void> {
  const docId = `${userId}_${platform}`;
  const docRef = db.collection(COLLECTIONS.RATE_LIMITS).doc(docId);

  const doc = await docRef.get();

  if (!doc.exists) {
    // First call - no limit yet
    return;
  }

  const data = doc.data() as RateLimitDoc;

  // Check if reset time has passed (24 hour window)
  if (Date.now() >= data.resetAt) {
    // Reset has passed - allow the call
    return;
  }

  // Check if limit exceeded
  if (data.count >= APIFY_CONFIG.MAX_CALLS_PER_PLATFORM) {
    const hoursUntilReset = Math.ceil((data.resetAt - Date.now()) / (60 * 60 * 1000));
    throw new Error(
      `${ERRORS.RATE_LIMIT_EXCEEDED}. Try again in ${hoursUntilReset} hours.`
    );
  }

  // Limit not exceeded, allowed to proceed
  // Caller must call incrementRateLimit after successful API call
}

/**
 * Increment rate limit counter after successful API call
 * Call this ONLY after a successful Apify API call (not on cache hits)
 * @param userId - Firebase Auth UID
 * @param platform - Social media platform (instagram, youtube, facebook)
 */
export async function incrementRateLimit(
  userId: string,
  platform: string
): Promise<void> {
  const docId = `${userId}_${platform}`;
  const docRef = db.collection(COLLECTIONS.RATE_LIMITS).doc(docId);

  const doc = await docRef.get();

  if (!doc.exists) {
    // First call - create rate limit document
    await docRef.set({
      userId,
      platform,
      count: 1,
      resetAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      lastCallAt: Date.now(),
    });
    return;
  }

  const data = doc.data() as RateLimitDoc;

  // Check if reset time has passed (24 hour window)
  if (Date.now() >= data.resetAt) {
    // Reset the counter and increment
    await docRef.update({
      count: 1,
      resetAt: Date.now() + 24 * 60 * 60 * 1000,
      lastCallAt: Date.now(),
    });
    return;
  }

  // Increment counter
  await docRef.update({
    count: FieldValue.increment(1),
    lastCallAt: Date.now(),
  });
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(
  userId: string,
  platform: string
): Promise<{ remaining: number; resetAt: number }> {
  const docId = `${userId}_${platform}`;
  const docRef = db.collection(COLLECTIONS.RATE_LIMITS).doc(docId);

  const doc = await docRef.get();

  if (!doc.exists) {
    return {
      remaining: APIFY_CONFIG.MAX_CALLS_PER_PLATFORM,
      resetAt: 0,
    };
  }

  const data = doc.data() as RateLimitDoc;

  // Check if reset time has passed
  if (Date.now() >= data.resetAt) {
    return {
      remaining: APIFY_CONFIG.MAX_CALLS_PER_PLATFORM,
      resetAt: 0,
    };
  }

  return {
    remaining: APIFY_CONFIG.MAX_CALLS_PER_PLATFORM - data.count,
    resetAt: data.resetAt,
  };
}

/**
 * Reset rate limit for a user (admin only)
 */
export async function resetRateLimit(
  userId: string,
  platform: string
): Promise<void> {
  const docId = `${userId}_${platform}`;
  const docRef = db.collection(COLLECTIONS.RATE_LIMITS).doc(docId);

  await docRef.delete();
}
