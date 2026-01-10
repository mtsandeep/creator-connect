// ============================================
// VERIFICATION PAYMENT HOOK
// ============================================

import { useCallback, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuthStore } from '../stores';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface RecordVerificationPaymentResult {
  success: boolean;
  message?: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function useVerificationPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const payVerificationFee = useCallback(
    async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      setError(null);

      try {
        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

        // Fallback to manual record in dev/emulator (or if key/script missing)
        if (!razorpayKeyId || !window.Razorpay) {
          // Manual verification for development
          await updateDoc(doc(db, 'users', user.uid), {
            verifiedAt: serverTimestamp(),
            'verificationBadges.promoterVerified': true,
            'verificationBadges.promoterVerifiedAt': serverTimestamp(),
            'verificationBadges.promoterVerifiedBy': 'system', // System-verified for payment
          });

          // Update local store immediately so UI reflects the change
          const { updateUserProfile } = useAuthStore.getState();
          const currentBadges = user.verificationBadges || {};
          updateUserProfile({ 
            verificationBadges: { 
              ...currentBadges,
              promoterVerified: true,
              promoterVerifiedAt: Date.now(),
              promoterVerifiedBy: 'system'
            } 
          });

          return { success: true, message: 'Verification completed (manual)' } as RecordVerificationPaymentResult;
        }

        // Create Razorpay order for verification with GST
        const createOrder = httpsCallable(functions, 'createVerificationOrderFunction');
        const createRes = await createOrder({
          userId: user.uid,
        });

        const order = createRes.data as any;
        if (!order?.success || !order?.orderId) {
          throw new Error('Failed to create Razorpay order');
        }

        const verifyPayment = httpsCallable(functions, 'verifyVerificationPaymentFunction');

        const result = await new Promise<RecordVerificationPaymentResult>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: razorpayKeyId,
            amount: order.amountPaise,
            currency: order.currency,
            name: 'ColLoved',
            description: `ColLoved Credits - Base: ₹${order.baseAmount || 1000}, GST(18%): ₹${order.gstAmount || 180}, Total: ₹${order.amount}`,
            order_id: order.orderId,
            prefill: {
              email: user?.email,
              name: user?.promoterProfile?.name || user?.email,
            },
            handler: async (response: any) => {
              try {
                // Verify payment with backend
                const verifyRes = await verifyPayment({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                } as any);

                // Update user verification status
                await updateDoc(doc(db, 'users', user.uid), {
                  verifiedAt: serverTimestamp(),
                  'verificationBadges.promoterVerified': true,
                  'verificationBadges.promoterVerifiedAt': serverTimestamp(),
                  'verificationBadges.promoterVerifiedBy': 'system', // System-verified for payment
                });

                // Update local store immediately so UI reflects the change
                const { updateUserProfile } = useAuthStore.getState();
                const currentBadges = user.verificationBadges || {};
                updateUserProfile({ 
                  verificationBadges: { 
                    ...currentBadges,
                    promoterVerified: true,
                    promoterVerifiedAt: Date.now(),
                    promoterVerifiedBy: 'system'
                  } 
                });

                // Force refresh user data to get updated credits
                const { refreshUserProfile } = useAuthStore.getState();
                if (refreshUserProfile) {
                  await refreshUserProfile();
                }

                resolve(verifyRes.data as RecordVerificationPaymentResult);
              } catch (e) {
                reject(e);
              }
            },
            modal: {
              ondismiss: function() {
                reject(new Error('Payment cancelled'));
              },
              backdropclose: false,
              escape: false,
              handleback: false,
              confirm_close: true,
            },
          });

          rzp.open();
        });

        return result;
      } catch (err: any) {
        console.error('Verification payment error:', err);
        const errorMessage = err?.message || 'Failed to process verification payment';
        // Provide user-friendly error messages
        if (errorMessage.includes('already verified')) {
          setError('You are already verified.');
        } else if (errorMessage.includes('already issued')) {
          setError('Payment link already sent. Please check your email.');
        } else if (errorMessage.includes('Unauthorized')) {
          setError('Authentication error. Please log in again.');
        } else if (errorMessage.includes('Payment cancelled')) {
          setError('Payment was cancelled. You can try again anytime.');
        } else {
          setError('Something went wrong. Please try again later.');
        }
        return { success: false, message: errorMessage } as RecordVerificationPaymentResult;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid, user?.email, user?.promoterProfile?.name]
  );

  return { payVerificationFee, loading, error };
}
