// ============================================
// PLATFORM FEE PAYMENT HOOK
// ============================================

import { useCallback, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuthStore } from '../stores';

interface RecordPlatformFeePaymentInput {
  proposalId: string;
  payerRole: 'influencer' | 'promoter';
  paymentMethod?: string;
  useCredits?: boolean;
  creditAmount?: number;
}

interface RecordPlatformFeePaymentResult {
  success: boolean;
  message?: string;
}

interface CreatePlatformFeeOrderResult {
  success: boolean;
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
}

interface VerifyPlatformFeePaymentInput {
  proposalId: string;
  payerRole: 'influencer' | 'promoter';
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function usePlatformFeePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const payPlatformFee = useCallback(
    async (input: RecordPlatformFeePaymentInput) => {
      setLoading(true);
      setError(null);

      try {
        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

        // If using credits, bypass Razorpay and use manual record
        if (input.useCredits && input.creditAmount) {
          const fn = httpsCallable(functions, 'recordPlatformFeePaymentFunction');
          const result = await fn({ 
            ...input, 
            paymentMethod: 'credits',
            creditAmount: input.creditAmount 
          });
          return result.data as RecordPlatformFeePaymentResult;
        }

        // Fallback to manual record in dev/emulator (or if key/script missing)
        if (!razorpayKeyId || !window.Razorpay) {
          const fn = httpsCallable(functions, 'recordPlatformFeePaymentFunction');
          const result = await fn({ ...input, paymentMethod: input.paymentMethod || 'manual' });
          return result.data as RecordPlatformFeePaymentResult;
        }

        const createOrder = httpsCallable(functions, 'createPlatformFeeOrderFunction');
        const createRes = await createOrder({
          proposalId: input.proposalId,
          payerRole: input.payerRole,
        });

        const order = createRes.data as CreatePlatformFeeOrderResult;
        if (!order?.success || !order?.orderId) {
          throw new Error('Failed to create Razorpay order');
        }

        const verifyPayment = httpsCallable(functions, 'verifyPlatformFeePaymentFunction');

        const result = await new Promise<RecordPlatformFeePaymentResult>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: razorpayKeyId,
            amount: order.amountPaise,
            currency: order.currency,
            name: 'ColLoved',
            description: 'Platform Fee',
            order_id: order.orderId,
            prefill: {
              email: user?.email,
              name: user?.influencerProfile?.displayName || user?.promoterProfile?.name,
            },
            handler: async (response: any) => {
              try {
                const verifyRes = await verifyPayment({
                  proposalId: input.proposalId,
                  payerRole: input.payerRole,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                } as VerifyPlatformFeePaymentInput);

                resolve(verifyRes.data as RecordPlatformFeePaymentResult);
              } catch (e) {
                reject(e);
              }
            },
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled')),
            },
          });

          rzp.open();
        });

        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to record platform fee payment';
        setError(errorMessage);
        return { success: false, message: errorMessage } as RecordPlatformFeePaymentResult;
      } finally {
        setLoading(false);
      }
    },
    [user?.email, user?.influencerProfile?.displayName, user?.promoterProfile?.name]
  );

  return { payPlatformFee, loading, error };
}
