import * as crypto from 'crypto';
import { describe, expect, it } from '@jest/globals';

function signWebhook(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

describe('razorpayWebhookFunction (logic)', () => {
  it(
    'verifies signature and applies payment.captured idempotently',
    async () => {
      process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'creator-connect-c19ba';
      process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';

      const { db } = await import('../db');
      const { verifyRazorpayWebhookSignature, applyPlatformFeeWebhookCaptured } = await import('../index');

      const razorpayOrderId = `order_${Date.now()}`;
      const razorpayPaymentId = `pay_${Date.now()}`;
      const proposalId = `proposal_${Date.now()}`;
      const payerId = 'test_user_1';

      // Seed Firestore with a proposal and a created payment order
      const proposalRef = db.collection('proposals').doc(proposalId);
      const orderRef = db.collection('paymentOrders').doc(razorpayOrderId);

      await proposalRef.set({
        influencerId: payerId,
        promoterId: 'test_promoter_1',
        fees: { paidBy: { influencer: false, promoter: false } },
      });

      await orderRef.set({
        orderId: razorpayOrderId,
        proposalId,
        payerRole: 'influencer',
        payerId,
        amount: 57.82,
        amountPaise: 5782,
        currency: 'INR',
        status: 'created',
      });

      // Minimal Razorpay-like payload
      const payload = {
        event: 'payment.captured',
        id: `evt_${Date.now()}`,
        payload: {
          payment: {
            entity: {
              id: razorpayPaymentId,
              order_id: razorpayOrderId,
            },
          },
        },
      };

      const payloadString = JSON.stringify(payload);
      const signature = signWebhook(payloadString, process.env.RAZORPAY_WEBHOOK_SECRET as string);

      expect(verifyRazorpayWebhookSignature(payloadString, signature)).toBe(true);
      expect(verifyRazorpayWebhookSignature(payloadString, 'bad_signature')).toBe(false);

      // Apply twice: should be idempotent
      const first = await applyPlatformFeeWebhookCaptured({
        razorpayOrderId,
        razorpayPaymentId,
        eventId: payload.id,
      });
      const second = await applyPlatformFeeWebhookCaptured({
        razorpayOrderId,
        razorpayPaymentId,
        eventId: payload.id,
      });

      expect((first as any).success || (first as any).ignored).toBeTruthy();
      expect((second as any).success || (second as any).ignored).toBeTruthy();

      const txQuery = await db
        .collection('transactions')
        .where('proposalId', '==', proposalId)
        .where('type', '==', 'platform_fee')
        .get();

      expect(txQuery.size).toBe(1);

      const orderSnap = await orderRef.get();
      expect(orderSnap.data()?.status).toBe('paid');
      expect(orderSnap.data()?.razorpayPaymentId).toBe(razorpayPaymentId);

      const proposalSnap = await proposalRef.get();
      expect(proposalSnap.data()?.fees?.paidBy?.influencer).toBe(true);

      await Promise.all([
        proposalRef.delete(),
        orderRef.delete(),
        ...txQuery.docs.map((d) => d.ref.delete()),
      ]);
    },
    20000
  );
});
