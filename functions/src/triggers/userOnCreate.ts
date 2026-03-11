/**
 * User onCreate Trigger
 *
 * Automatically grants signup credits when a new influencer profile is created.
 * This runs server-side for security - cannot be tampered with by clients.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { db } from '../db';
import { COLLECTIONS } from '../config';
import { PRICING } from '../config/pricing';

export const grantInfluencerSignupCredits = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const documentSnapshot = event.data;
    const userId = event.params.userId;

    if (!documentSnapshot) {
      logger.info('No document data, skipping signup credits', { userId });
      return;
    }

    const userData = documentSnapshot.data();

    // Only grant credits if this is a new influencer profile
    if (!userData?.influencerProfile) {
      logger.info('No influencer profile found, skipping signup credits', { userId });
      return;
    }

    // Check if credits already exist (prevent duplicate credits on retry)
    if (userData.influencerProfile?.credits && userData.influencerProfile.credits.length > 0) {
      logger.info('Influencer already has credits, skipping signup credits', { userId });
      return;
    }

    // Grant signup credits from server-side config
    const now = Date.now();
    const creditAmount = PRICING.influencerSignupCredits.amount;
    const signupCredits = {
      amount: creditAmount,
      remainingAmount: creditAmount,
      expiryDate: now + (PRICING.influencerSignupCredits.validityDays * 24 * 60 * 60 * 1000),
      purchaseDate: now,
      source: 'signup' as const,
    };

    try {
      // Update the user document with signup credits
      await db.collection(COLLECTIONS.USERS).doc(userId).update({
        'influencerProfile.credits': [signupCredits],
      });

      logger.info('Granted signup credits to new influencer', {
        userId,
        amount: PRICING.influencerSignupCredits.amount,
      });
    } catch (error) {
      logger.error('Error granting signup credits', {
        userId,
        error,
      });
      // Don't throw - we don't want to fail the entire profile creation
    }
  }
);
