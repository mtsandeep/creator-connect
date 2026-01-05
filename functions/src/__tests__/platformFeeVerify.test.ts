import * as crypto from 'crypto';
import { describe, expect, it } from '@jest/globals';

function makeSignature(params: { orderId: string; paymentId: string; secret: string }) {
  const body = `${params.orderId}|${params.paymentId}`;
  return crypto.createHmac('sha256', params.secret).update(body).digest('hex');
}

describe('verifyPlatformFeePaymentCore', () => {
  it('is idempotent: calling twice does not create duplicate transactions', async () => {
    process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'creator-connect-c19ba';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';

    const { db } = await import('../db');
    const { verifyPlatformFeePaymentCore } = await import('../index');

    const userId = 'test_user_1';
    const proposalId = `test_proposal_${Date.now()}`;
    const razorpayOrderId = `order_${Date.now()}`;
    const razorpayPaymentId = `pay_${Date.now()}`;

    const signature = makeSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      secret: process.env.RAZORPAY_KEY_SECRET as string,
    });

    const proposalRef = db.collection('proposals').doc(proposalId);
    const orderRef = db.collection('paymentOrders').doc(razorpayOrderId);

    await proposalRef.set({
      influencerId: userId,
      promoterId: 'test_promoter_1',
      fees: { paidBy: { influencer: false, promoter: false } },
    });

    await orderRef.set({
      orderId: razorpayOrderId,
      proposalId,
      payerRole: 'influencer',
      payerId: userId,
      amount: 57.82,
      amountPaise: 5782,
      currency: 'INR',
      status: 'created',
    });

    const first = await verifyPlatformFeePaymentCore({
      userId,
      proposalId,
      payerRole: 'influencer',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: signature,
    });

    expect(first).toEqual({ success: true });

    const second = await verifyPlatformFeePaymentCore({
      userId,
      proposalId,
      payerRole: 'influencer',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: signature,
    });

    expect(second).toEqual({ success: true });

    const txQuery = await db
      .collection('transactions')
      .where('proposalId', '==', proposalId)
      .where('type', '==', 'platform_fee')
      .get();

    expect(txQuery.size).toBe(1);

    const orderSnap = await orderRef.get();
    expect(orderSnap.exists).toBe(true);
    expect(orderSnap.data()?.status).toBe('paid');

    const proposalSnap = await proposalRef.get();
    expect(proposalSnap.exists).toBe(true);
    expect(proposalSnap.data()?.fees?.paidBy?.influencer).toBe(true);

    await Promise.all([
      proposalRef.delete(),
      orderRef.delete(),
      ...txQuery.docs.map((d) => d.ref.delete()),
    ]);
  }, 20000);

  it(
    'rejects when order is already paid with a different razorpayPaymentId',
    async () => {
      process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'creator-connect-c19ba';
      process.env.RAZORPAY_KEY_SECRET = 'test_secret';

      const { db } = await import('../db');
      const { verifyPlatformFeePaymentCore } = await import('../index');

      const userId = 'test_user_paid_mismatch';
      const proposalId = `test_proposal_${Date.now()}`;
      const razorpayOrderId = `order_${Date.now()}`;
      const paidPaymentId = `pay_${Date.now()}`;
      const otherPaymentId = `pay_${Date.now()}_other`;

      const signature = makeSignature({
        orderId: razorpayOrderId,
        paymentId: otherPaymentId,
        secret: process.env.RAZORPAY_KEY_SECRET as string,
      });

      const proposalRef = db.collection('proposals').doc(proposalId);
      const orderRef = db.collection('paymentOrders').doc(razorpayOrderId);

      await proposalRef.set({
        influencerId: userId,
        promoterId: 'test_promoter_1',
        fees: { paidBy: { influencer: true, promoter: false } },
      });

      await orderRef.set({
        orderId: razorpayOrderId,
        proposalId,
        payerRole: 'influencer',
        payerId: userId,
        currency: 'INR',
        status: 'paid',
        razorpayPaymentId: paidPaymentId,
      });

      await expect(
        verifyPlatformFeePaymentCore({
          userId,
          proposalId,
          payerRole: 'influencer',
          razorpayOrderId,
          razorpayPaymentId: otherPaymentId,
          razorpaySignature: signature,
        })
      ).rejects.toBeTruthy();

      await Promise.all([proposalRef.delete(), orderRef.delete()]);
    },
    20000
  );

  it(
    'rejects when proposal is marked paid but matching transaction doc is missing',
    async () => {
      process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'creator-connect-c19ba';
      process.env.RAZORPAY_KEY_SECRET = 'test_secret';

      const { db } = await import('../db');
      const { verifyPlatformFeePaymentCore } = await import('../index');

      const userId = 'test_user_missing_tx';
      const proposalId = `test_proposal_${Date.now()}`;
      const razorpayOrderId = `order_${Date.now()}`;
      const razorpayPaymentId = `pay_${Date.now()}`;

      const signature = makeSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        secret: process.env.RAZORPAY_KEY_SECRET as string,
      });

      const proposalRef = db.collection('proposals').doc(proposalId);
      const orderRef = db.collection('paymentOrders').doc(razorpayOrderId);

      await proposalRef.set({
        influencerId: userId,
        promoterId: 'test_promoter_1',
        fees: { paidBy: { influencer: true, promoter: false } },
      });

      await orderRef.set({
        orderId: razorpayOrderId,
        proposalId,
        payerRole: 'influencer',
        payerId: userId,
        amount: 57.82,
        amountPaise: 5782,
        currency: 'INR',
        status: 'created',
      });

      await expect(
        verifyPlatformFeePaymentCore({
          userId,
          proposalId,
          payerRole: 'influencer',
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature: signature,
        })
      ).rejects.toBeTruthy();

      await Promise.all([proposalRef.delete(), orderRef.delete()]);
    },
    20000
  );
});
