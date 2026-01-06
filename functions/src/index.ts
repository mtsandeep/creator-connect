// ============================================
// FIREBASE FUNCTIONS - SOCIAL MEDIA FOLLOWER COUNT
// ============================================

import { onCall, onRequest, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { fetchFollowerCount, FollowerData } from './apifyClient';
import { checkRateLimit, getRateLimitStatus } from './rateLimiter';
import { APIFY_CONFIG, COLLECTIONS, ERRORS } from './config';
import { db, FieldValue } from './db';

interface RecordPlatformFeePaymentData {
  proposalId: string;
  payerRole: 'influencer' | 'promoter';
  paymentMethod?: string;
}

interface CreatePlatformFeeOrderData {
  proposalId: string;
  payerRole: 'influencer' | 'promoter';
}

interface VerifyPlatformFeePaymentData {
  proposalId: string;
  payerRole: 'influencer' | 'promoter';
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export function verifyRazorpayWebhookSignature(payload: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new HttpsError('failed-precondition', 'Razorpay webhook secret is not configured');
  }

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return expected === signature;
}

export async function applyPlatformFeeWebhookCaptured(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  eventId?: string;
}) {
  const { razorpayOrderId, razorpayPaymentId } = params;

  const orderRef = db.collection(COLLECTIONS.PAYMENT_ORDERS).doc(razorpayOrderId);
  const transactionRef = db
    .collection(COLLECTIONS.TRANSACTIONS)
    .doc(`rzp_pf_${razorpayPaymentId}`);

  return await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      return { ignored: true, reason: 'order_not_found' };
    }

    const orderData = orderSnap.data() as any;
    if (orderData.status === 'paid') {
      if (orderData.razorpayPaymentId && orderData.razorpayPaymentId !== razorpayPaymentId) {
        return { ignored: true, reason: 'order_paid_with_different_payment' };
      }
      return { success: true };
    }

    const proposalId = orderData.proposalId as string;
    const payerRole = orderData.payerRole as 'influencer' | 'promoter';
    const payerId = orderData.payerId as string;

    if (!proposalId || !payerRole || !payerId) {
      return { ignored: true, reason: 'order_missing_fields' };
    }

    const proposalRef = db.collection(COLLECTIONS.PROPOSALS).doc(proposalId);
    const proposalSnap = await tx.get(proposalRef);
    if (!proposalSnap.exists) {
      return { ignored: true, reason: 'proposal_not_found' };
    }

    const existingTxSnap = await tx.get(transactionRef);

    const proposal = proposalSnap.data() as any;
    const currentFees = (proposal.fees || {}) as any;
    const paidBy = (currentFees.paidBy || { influencer: false, promoter: false }) as {
      influencer: boolean;
      promoter: boolean;
    };

    const alreadyPaidForRole =
      (payerRole === 'influencer' && paidBy.influencer) || (payerRole === 'promoter' && paidBy.promoter);

    const { platformFeeInfluencer, platformFeePromoter, transactionAmount, transactionGst, transactionTotal } =
      getPlatformFeeComponents({ payerRole });

    const nextPaidBy = {
      influencer: paidBy.influencer || payerRole === 'influencer',
      promoter: paidBy.promoter || payerRole === 'promoter',
    };

    const feeBase =
      (nextPaidBy.influencer ? platformFeeInfluencer : 0) +
      (nextPaidBy.promoter ? platformFeePromoter : 0);

    const gstAmount = Math.round(feeBase * 0.18 * 100) / 100;
    const totalPlatformFee = Math.round((feeBase + gstAmount) * 100) / 100;

    if (!alreadyPaidForRole) {
      tx.update(proposalRef, {
        paymentMode: 'platform',
        fees: {
          ...currentFees,
          platformFeeInfluencer,
          platformFeePromoter,
          gstAmount,
          totalPlatformFee,
          paidBy: nextPaidBy,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (!existingTxSnap.exists) {
      tx.set(transactionRef, {
        proposalId,
        payerId,
        receiverId: 'platform',
        amount: transactionTotal,
        type: 'platform_fee',
        status: 'completed',
        paymentMethod: 'razorpay',
        createdAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        razorpayOrderId,
        razorpayPaymentId,
        metadata: {
          feeAmount: transactionAmount,
          gstAmount: transactionGst,
          payerRole,
          source: 'webhook',
        },
      });
    }

    tx.update(orderRef, {
      status: 'paid',
      razorpayPaymentId,
      paidAt: FieldValue.serverTimestamp(),
      transactionId: transactionRef.id,
    });

    return { success: true };
  });
}

export async function verifyPlatformFeePaymentCore(params: {
  userId: string;
  proposalId: string;
  payerRole: 'influencer' | 'promoter';
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { userId, proposalId, payerRole, razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  if (!proposalId || !payerRole || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    throw new HttpsError('permission-denied', 'Invalid Razorpay signature');
  }

  const orderRef = db.collection(COLLECTIONS.PAYMENT_ORDERS).doc(razorpayOrderId);
  const proposalRef = db.collection(COLLECTIONS.PROPOSALS).doc(proposalId);
  const transactionRef = db
    .collection(COLLECTIONS.TRANSACTIONS)
    .doc(`rzp_pf_${razorpayPaymentId}`);

  return await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Payment order not found');
    }

    const orderData = orderSnap.data() as any;
    if (orderData.payerId !== userId) {
      throw new HttpsError('permission-denied', 'Order does not belong to user');
    }
    if (orderData.proposalId !== proposalId || orderData.payerRole !== payerRole) {
      throw new HttpsError('failed-precondition', 'Order does not match proposal or payerRole');
    }

    // If we already marked the order paid earlier, treat this as idempotent success.
    if (orderData.status === 'paid') {
      if (orderData.razorpayPaymentId && orderData.razorpayPaymentId !== razorpayPaymentId) {
        throw new HttpsError('failed-precondition', 'Order already paid with a different Razorpay paymentId');
      }
      return { success: true };
    }

    const proposalSnap = await tx.get(proposalRef);
    if (!proposalSnap.exists) {
      throw new HttpsError('not-found', 'Proposal not found');
    }

    const existingTxSnap = await tx.get(transactionRef);

    const proposal = proposalSnap.data() as any;
    const currentFees = (proposal.fees || {}) as any;
    const paidBy = (currentFees.paidBy || { influencer: false, promoter: false }) as {
      influencer: boolean;
      promoter: boolean;
    };

    // If proposal is already marked paid for this payerRole, just mark the order paid and exit.
    if ((payerRole === 'influencer' && paidBy.influencer) || (payerRole === 'promoter' && paidBy.promoter)) {
      if (!existingTxSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Proposal already marked paid, but matching transaction record not found for this Razorpay payment'
        );
      }
      tx.update(orderRef, {
        status: 'paid',
        razorpayPaymentId,
        razorpaySignature,
        paidAt: FieldValue.serverTimestamp(),
        transactionId: transactionRef.id,
      });
      return { success: true };
    }

    const { platformFeeInfluencer, platformFeePromoter, transactionAmount, transactionGst, transactionTotal } =
      getPlatformFeeComponents({ payerRole });

    const nextPaidBy = {
      influencer: paidBy.influencer || payerRole === 'influencer',
      promoter: paidBy.promoter || payerRole === 'promoter',
    };

    const feeBase =
      (nextPaidBy.influencer ? platformFeeInfluencer : 0) +
      (nextPaidBy.promoter ? platformFeePromoter : 0);

    const gstAmount = Math.round(feeBase * 0.18 * 100) / 100;
    const totalPlatformFee = Math.round((feeBase + gstAmount) * 100) / 100;

    tx.update(proposalRef, {
      paymentMode: 'platform',
      fees: {
        ...currentFees,
        platformFeeInfluencer,
        platformFeePromoter,
        gstAmount,
        totalPlatformFee,
        paidBy: nextPaidBy,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (!existingTxSnap.exists) {
      tx.set(transactionRef, {
        proposalId,
        payerId: userId,
        receiverId: 'platform',
        amount: transactionTotal,
        type: 'platform_fee',
        status: 'completed',
        paymentMethod: 'razorpay',
        createdAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        metadata: {
          feeAmount: transactionAmount,
          gstAmount: transactionGst,
          payerRole,
        },
      });
    }

    tx.update(orderRef, {
      status: 'paid',
      razorpayPaymentId,
      razorpaySignature,
      paidAt: FieldValue.serverTimestamp(),
      transactionId: transactionRef.id,
    });

    return { success: true };
  });
}

function getRazorpayClient() {
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

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new HttpsError('failed-precondition', 'Razorpay key secret is not configured');
  }

  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
  return expected === signature;
}

function getPlatformFeeComponents(params: { payerRole: 'influencer' | 'promoter' }) {
  const { payerRole } = params;

  const platformFeeInfluencer = 49;
  const platformFeePromoter = 49;

  const transactionAmount = payerRole === 'influencer' ? platformFeeInfluencer : platformFeePromoter;
  const transactionGst = Math.round(transactionAmount * 0.18 * 100) / 100;
  const transactionTotal = Math.round((transactionAmount + transactionGst) * 100) / 100;

  return {
    platformFeeInfluencer,
    platformFeePromoter,
    transactionAmount,
    transactionGst,
    transactionTotal,
  };
}

async function applyPlatformFeePayment(params: {
  proposalId: string;
  payerRole: 'influencer' | 'promoter';
  payerId: string;
  paymentMethod: string;
  razorpay?: {
    orderId?: string;
    paymentId?: string;
    signature?: string;
  };
}) {
  const { proposalId, payerRole, payerId, paymentMethod, razorpay } = params;

  const proposalRef = db.collection(COLLECTIONS.PROPOSALS).doc(proposalId);
  const proposalSnap = await proposalRef.get();
  if (!proposalSnap.exists) {
    throw new HttpsError('not-found', 'Proposal not found');
  }

  const proposal = proposalSnap.data() as any;
  const influencerId = proposal.influencerId;
  const promoterId = proposal.promoterId;

  const isInfluencer = payerId === influencerId;
  const isPromoter = payerId === promoterId;

  if (!isInfluencer && !isPromoter) {
    throw new HttpsError('permission-denied', 'User is not a party to this proposal');
  }

  if (payerRole === 'influencer' && !isInfluencer) {
    throw new HttpsError('permission-denied', 'Only the influencer can pay influencer platform fee');
  }

  if (payerRole === 'promoter' && !isPromoter) {
    throw new HttpsError('permission-denied', 'Only the promoter can pay promoter platform fee');
  }

  const currentFees = (proposal.fees || {}) as any;
  const paidBy = (currentFees.paidBy || { influencer: false, promoter: false }) as {
    influencer: boolean;
    promoter: boolean;
  };

  if (payerRole === 'influencer' && paidBy.influencer) {
    throw new HttpsError('failed-precondition', 'Influencer platform fee already paid');
  }
  if (payerRole === 'promoter' && paidBy.promoter) {
    throw new HttpsError('failed-precondition', 'Promoter platform fee already paid');
  }

  const platformFeeInfluencer = 49;
  const platformFeePromoter = 49;

  const nextPaidBy = {
    influencer: paidBy.influencer || payerRole === 'influencer',
    promoter: paidBy.promoter || payerRole === 'promoter',
  };

  const feeBase =
    (nextPaidBy.influencer ? platformFeeInfluencer : 0) +
    (nextPaidBy.promoter ? platformFeePromoter : 0);

  const gstAmount = Math.round(feeBase * 0.18 * 100) / 100;
  const totalPlatformFee = Math.round((feeBase + gstAmount) * 100) / 100;

  const transactionAmount = payerRole === 'influencer' ? platformFeeInfluencer : platformFeePromoter;
  const transactionGst = Math.round(transactionAmount * 0.18 * 100) / 100;
  const transactionTotal = Math.round((transactionAmount + transactionGst) * 100) / 100;

  await proposalRef.update({
    paymentMode: 'platform',
    fees: {
      ...currentFees,
      platformFeeInfluencer,
      platformFeePromoter,
      gstAmount,
      totalPlatformFee,
      paidBy: nextPaidBy,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  const transactionDoc: any = {
    proposalId,
    payerId,
    receiverId: 'platform',
    amount: transactionTotal,
    type: 'platform_fee',
    status: 'completed',
    paymentMethod,
    createdAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
    metadata: {
      feeAmount: transactionAmount,
      gstAmount: transactionGst,
      payerRole,
    },
  };

  if (razorpay?.orderId) transactionDoc.razorpayOrderId = razorpay.orderId;
  if (razorpay?.paymentId) transactionDoc.razorpayPaymentId = razorpay.paymentId;
  if (razorpay?.signature) transactionDoc.razorpaySignature = razorpay.signature;

  await db.collection(COLLECTIONS.TRANSACTIONS).add(transactionDoc);

  return { success: true };
}

export const createPlatformFeeOrderFunction = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<CreatePlatformFeeOrderData>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { proposalId, payerRole } = request.data as CreatePlatformFeeOrderData;

    if (!proposalId || !payerRole) {
      throw new HttpsError('invalid-argument', 'proposalId and payerRole are required');
    }
    if (payerRole !== 'influencer' && payerRole !== 'promoter') {
      throw new HttpsError('invalid-argument', 'Invalid payerRole');
    }

    const proposalRef = db.collection(COLLECTIONS.PROPOSALS).doc(proposalId);
    const proposalSnap = await proposalRef.get();
    if (!proposalSnap.exists) {
      throw new HttpsError('not-found', 'Proposal not found');
    }

    const proposal = proposalSnap.data() as any;
    if (userId !== proposal.influencerId && userId !== proposal.promoterId) {
      throw new HttpsError('permission-denied', 'User is not a party to this proposal');
    }

    if (payerRole === 'influencer' && userId !== proposal.influencerId) {
      throw new HttpsError('permission-denied', 'Only the influencer can pay influencer platform fee');
    }
    if (payerRole === 'promoter' && userId !== proposal.promoterId) {
      throw new HttpsError('permission-denied', 'Only the promoter can pay promoter platform fee');
    }

    const currentFees = (proposal.fees || {}) as any;
    const paidBy = (currentFees.paidBy || { influencer: false, promoter: false }) as {
      influencer: boolean;
      promoter: boolean;
    };

    if (payerRole === 'influencer' && paidBy.influencer) {
      throw new HttpsError('failed-precondition', 'Influencer platform fee already paid');
    }
    if (payerRole === 'promoter' && paidBy.promoter) {
      throw new HttpsError('failed-precondition', 'Promoter platform fee already paid');
    }

    const platformFee = 49;
    const gstAmount = Math.round(platformFee * 0.18 * 100) / 100;
    const total = Math.round((platformFee + gstAmount) * 100) / 100;

    const amountPaise = Math.round(total * 100);

    const razorpay = getRazorpayClient();

    // Generate a short receipt (max 40 chars for Razorpay)
    const timestamp = Date.now().toString(36);
    const receipt = `pf_${proposalId.slice(0, 8)}_${payerRole.slice(0, 3)}_${timestamp}`;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        proposalId,
        payerRole,
        payerId: userId,
      },
    });

    await db.collection(COLLECTIONS.PAYMENT_ORDERS).doc(order.id).set({
      orderId: order.id,
      proposalId,
      payerRole,
      payerId: userId,
      amount: total,
      amountPaise,
      currency: 'INR',
      status: 'created',
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      orderId: order.id,
      amount: total,
      amountPaise,
      currency: 'INR',
    };
  }
);

export const verifyPlatformFeePaymentFunction = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<VerifyPlatformFeePaymentData>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { proposalId, payerRole, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      request.data as VerifyPlatformFeePaymentData;

    return await verifyPlatformFeePaymentCore({
      userId,
      proposalId,
      payerRole,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
  }
);

export const razorpayWebhookFunction = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const signatureHeader = req.header('x-razorpay-signature') || '';
      const rawBody = (req as any).rawBody;
      const payloadString = Buffer.isBuffer(rawBody)
        ? rawBody.toString('utf8')
        : JSON.stringify(req.body || {});

      const valid = verifyRazorpayWebhookSignature(payloadString, signatureHeader);
      if (!valid) {
        logger.warn('Invalid Razorpay webhook signature');
        res.status(401).send('Invalid signature');
        return;
      }

      const event = (req.body as any)?.event as string | undefined;
      const eventId = (req.body as any)?.id as string | undefined;

      if (!event) {
        res.status(400).send('Missing event');
        return;
      }

      // Platform fee: payment captured
      if (event === 'payment.captured') {
        const paymentEntity = (req.body as any)?.payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id as string | undefined;
        const razorpayPaymentId = paymentEntity?.id as string | undefined;

        if (!razorpayOrderId || !razorpayPaymentId) {
          res.status(400).send('Missing payment identifiers');
          return;
        }

        const result = await applyPlatformFeeWebhookCaptured({
          razorpayOrderId,
          razorpayPaymentId,
          eventId,
        });

        res.status(200).json({ ok: true, event, result });
        return;
      }

      // Ignore other events for now
      res.status(200).json({ ok: true, ignored: true, event });
    } catch (err: any) {
      logger.error('Razorpay webhook error', err);
      res.status(500).json({ ok: false, error: err?.message || 'Internal error' });
    }
  }
);

export const recordPlatformFeePaymentFunction = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest<RecordPlatformFeePaymentData>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { proposalId, payerRole, paymentMethod } = request.data as RecordPlatformFeePaymentData;

    if (!proposalId || !payerRole) {
      throw new HttpsError('invalid-argument', 'proposalId and payerRole are required');
    }

    if (payerRole !== 'influencer' && payerRole !== 'promoter') {
      throw new HttpsError('invalid-argument', 'Invalid payerRole');
    }

    return await applyPlatformFeePayment({
      proposalId,
      payerRole,
      payerId: userId,
      paymentMethod: paymentMethod || 'manual',
    });
  }
);

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

  const cleanData = Object.fromEntries(
    Object.entries({
      ...data,
      cachedAt: Date.now(),
    }).filter(([, value]) => value !== undefined)
  );

  await cacheRef.set(cleanData);
}

// ============================================
// CLOUD FUNCTIONS
// ============================================

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
      // Check rate limit
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
