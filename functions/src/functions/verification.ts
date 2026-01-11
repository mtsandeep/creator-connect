// ============================================
// VERIFICATION PAYMENT FUNCTIONS
// ============================================

import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { db } from '../db';
import { COLLECTIONS } from '../config';
import { getRazorpayClient, verifyRazorpaySignature } from './shared';

interface CreateVerificationOrderData {
  userId: string;
}

interface VerifyVerificationPaymentData {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const createVerificationOrderFunction = onCall(
  async (request: CallableRequest<CreateVerificationOrderData>) => {
    if (!request.auth?.uid) {
      throw new Error('Authentication required');
    }

    const { userId } = request.data;

    // Verify user is requesting their own verification
    if (request.auth.uid !== userId) {
      throw new Error('Unauthorized');
    }

    try {
      // Check if user is already verified
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      const userData = userDoc.data();

      if (userData?.verificationBadges?.promoterVerified) {
        throw new Error('User is already verified');
      }

      // Create Razorpay order for verification (₹1,000 + 18% GST = ₹1,180 = 118,000 paise)
      const baseAmount = 1000; // ₹1,000 base amount
      const gstRate = 0.18; // 18% GST
      const totalAmount = Math.round(baseAmount * (1 + gstRate)); // ₹1,180
      const amountPaise = totalAmount * 100; // 118,000 paise
      
      const razorpay = getRazorpayClient();
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `verif_${userId.slice(-8)}`, // Use last 8 chars of userId to stay under 40 char limit
        notes: {
          userId,
          type: 'verification',
          baseAmount,
          gstAmount: totalAmount - baseAmount,
          totalAmount,
        },
        // Add price breakdown for display in Razorpay modal
        description: `Brand Verification Fee (₹1,000 + 18% GST = ₹${totalAmount})`,
      });

      // Store order in Firestore
      await db.collection(COLLECTIONS.PAYMENT_ORDERS).doc(order.id).set({
        userId,
        type: 'verification',
        baseAmount,
        gstAmount: totalAmount - baseAmount,
        totalAmount,
        amountPaise,
        currency: 'INR',
        status: 'created',
        razorpayOrderId: order.id,
        createdAt: new Date(),
      });

      return {
        success: true,
        orderId: order.id,
        amount: totalAmount,
        amountPaise,
        currency: 'INR',
        baseAmount,
        gstAmount: totalAmount - baseAmount,
      };
    } catch (error: any) {
      logger.error('Error creating verification order:', error);
      throw new Error(error.message || 'Failed to create verification order');
    }
  }
);

export const verifyVerificationPaymentFunction = onCall(
  async (request: CallableRequest<VerifyVerificationPaymentData>) => {
    if (!request.auth?.uid) {
      throw new Error('Authentication required');
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = request.data;

    try {
      // Get order from Firestore
      const orderDoc = await db.collection(COLLECTIONS.PAYMENT_ORDERS).doc(razorpayOrderId).get();
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      if (!orderData) {
        throw new Error('Order data not found');
      }

      // Verify order belongs to the authenticated user
      if (orderData.userId !== request.auth.uid) {
        throw new Error('Unauthorized');
      }

      // Verify Razorpay signature
      const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

      if (!isValid) {
        throw new Error('Invalid payment signature');
      }

      // Skip payment status check for test environment - signature verification is sufficient
      // In production, you might want to add additional payment status checks

      // Update order status
      await db.collection(COLLECTIONS.PAYMENT_ORDERS).doc(razorpayOrderId).update({
        status: 'completed',
        razorpayPaymentId,
        razorpaySignature,
        completedAt: new Date(),
      });

      // Create transaction record
      await db.collection(COLLECTIONS.TRANSACTIONS).doc(`rzp_verification_${razorpayPaymentId}`).set({
        userId: orderData.userId,
        type: 'verification',
        amount: orderData.totalAmount || 1180, // Use totalAmount from order document
        currency: orderData.currency || 'INR',
        razorpayOrderId,
        razorpayPaymentId,
        status: 'completed',
        createdAt: new Date(),
      });

      // Add credits to promoter profile
      const userRef = db.collection(COLLECTIONS.USERS).doc(orderData.userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      
      // Create promoterProfile if it doesn't exist
      if (!userData?.promoterProfile) {
        console.log('Creating promoterProfile for user:', orderData.userId);
        await userRef.update({
          promoterProfile: {
            credits: [{
              amount: orderData.baseAmount || 1000, // Base amount converted to credits
              expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
              purchaseDate: Date.now(),
              source: 'verification' as const,
            }]
          }
        });
      } else {
        const currentCredits = userData.promoterProfile.credits || [];
        const newCreditBatch = {
          amount: orderData.baseAmount || 1000, // Base amount converted to credits
          expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
          purchaseDate: Date.now(),
          source: 'verification' as const,
        };
        
        // Add new credit batch to existing credits
        await userRef.update({
          'promoterProfile.credits': [...currentCredits, newCreditBatch],
        });
      }

      // ✅ SET VERIFICATION FLAG AFTER SUCCESSFUL PAYMENT
      await userRef.update({
        'verificationBadges.promoterVerified': true,
        'verificationBadges.promoterVerifiedAt': new Date(),
        'verificationBadges.promoterVerifiedBy': 'system',
        verifiedAt: new Date(),
      });

      return {
        success: true,
        message: 'Verification payment successful',
      };
    } catch (error: any) {
      logger.error('Error verifying verification payment:', error);
      throw new Error(error.message || 'Failed to verify payment');
    }
  }
);
