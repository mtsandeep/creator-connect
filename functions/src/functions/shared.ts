// ============================================
// SHARED UTILITIES FOR FIREBASE FUNCTIONS
// ============================================

import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../db';
import { COLLECTIONS, APIFY_CONFIG } from '../config';
import { FollowerData } from '../apifyClient';

/**
 * Check cache before making API call
 */
export async function checkCache(
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
export async function storeCache(data: FollowerData): Promise<void> {
  const cacheKey = `${data.platform}_${data.username}`;
  const cacheRef = db.collection(COLLECTIONS.API_CACHE).doc(cacheKey);

  const cleanData = Object.fromEntries(
    Object.entries({
      ...data,
      cachedAt: Date.now(),
    }).filter(([, value]) => value !== undefined)
  );

  await cacheRef.set(cleanData);
}

/**
 * Get platform fee components
 */
export function getPlatformFeeComponents(params: { 
  payerRole: 'influencer' | 'promoter';
  useCredits?: boolean;
}) {
  const { payerRole, useCredits } = params;

  const platformFeeInfluencer = 49;
  const platformFeePromoter = 49;

  // Apply 20% discount when using credits
  const discountedFee = 39; // 20% discount on ₹49
  
  const transactionAmount = useCredits 
    ? discountedFee 
    : (payerRole === 'influencer' ? platformFeeInfluencer : platformFeePromoter);
    
  const transactionGst = useCredits ? 0 : Math.round(transactionAmount * 0.18 * 100) / 100;
  const transactionTotal = useCredits ? transactionAmount : Math.round((transactionAmount + transactionGst) * 100) / 100;

  return {
    platformFeeInfluencer,
    platformFeePromoter,
    transactionAmount,
    transactionGst,
    transactionTotal,
  };
}

/**
 * Verify Razorpay signature for payment verification
 */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new HttpsError('failed-precondition', 'Razorpay key secret is not configured');
  }

  const body = `${orderId}|${paymentId}`;
  const expected = require('crypto').createHmac('sha256', keySecret).update(body).digest('hex');
  return expected === signature;
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyRazorpayWebhookSignature(payload: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new HttpsError('failed-precondition', 'Razorpay webhook secret is not configured');
  }

  const expected = require('crypto').createHmac('sha256', secret).update(payload).digest('hex');
  return expected === signature;
}

/**
 * Get Razorpay client instance
 */
export function getRazorpayClient() {
  const Razorpay = require('razorpay');
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new HttpsError('failed-precondition', 'Razorpay keys are not configured');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}
