// ============================================
// VERIFICATION PAGE (Root Route)
// ============================================

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { updateDoc, doc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useVerificationPayment } from '../hooks/useVerificationPayment';

interface VerificationContext {
  username?: string;
  action?: 'chat' | 'proposal';
}

export default function Verification() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { payVerificationFee, loading: paymentLoading, error: paymentError } = useVerificationPayment();

  const [context, setContext] = useState<VerificationContext | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [influencerName, setInfluencerName] = useState<string>('');
  const [fetchingInfluencer, setFetchingInfluencer] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // If user is already verified, redirect to dashboard
    if (user.verificationBadges?.promoterVerified) {
      navigate('/promoter/dashboard', { replace: true });
      return;
    }

    // Read context from sessionStorage
    const storedContext = sessionStorage.getItem('verificationContext');
    if (storedContext) {
      const ctx = JSON.parse(storedContext);
      const normalizedCtx = {
        ...ctx,
        username: ctx.username ? String(ctx.username).replace(/^@+/, '') : undefined,
      };
      setContext(normalizedCtx);

      // Fetch influencer name
      if (normalizedCtx.username) {
        const fetchInfluencer = async () => {
          try {
            const usersRef = collection(db, 'users');
            const q = query(
              usersRef,
              where('influencerProfile.username', '==', normalizedCtx.username),
              where('roles', 'array-contains', 'influencer'),
              limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              setInfluencerName(userData.influencerProfile?.displayName || 'This Influencer');
            }
          } catch (err) {
            console.error('Error fetching influencer:', err);
          } finally {
            setFetchingInfluencer(false);
          }
        };

        fetchInfluencer();
      } else {
        setFetchingInfluencer(false);
      }
    } else {
      // No context, not fetching anything
      setFetchingInfluencer(false);
    }
  }, [user, navigate]);

  const handleVerification = async () => {
    // Clear any existing errors
    setError(null);
    
    try {
      const result = await payVerificationFee();
      if (result.success) {
        // Payment successful, user is now verified
        setIsVerified(true);
      } else {
        console.error('Verification payment failed:', result.message);
        // Error is already set by the hook
      }
    } catch (error) {
      console.error('Error during verification payment:', error);
      // Show user-friendly error message
      setError('Something went wrong. Please try again later.');
    }
  };

  const handleDevSkipVerification = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        verifiedAt: serverTimestamp(),
        'verificationBadges.promoterVerified': true,
        'verificationBadges.promoterVerifiedAt': serverTimestamp(),
        'verificationBadges.promoterVerifiedBy': 'system',
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

      setIsVerified(true);
    } catch (error) {
      console.error('Error marking as verified:', error);
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Clear the verification context from sessionStorage
    sessionStorage.removeItem('verificationContext');

    if (context?.action === 'chat' && context.username) {
      navigate(`/link/${context.username}/chat`);
    } else if (context?.action === 'proposal' && context.username) {
      navigate(`/link/${context.username}/proposal`);
    } else {
      navigate('/promoter/dashboard');
    }
  };

  if (!user || fetchingInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8FF00]"></div>
      </div>
    );
  }

  const displayName = influencerName || 'verified influencers';

  // Success state after verification
  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
          <div className="w-20 h-20 bg-[#B8FF00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#B8FF00]" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Verification Complete!</h2>
          <p className="text-gray-400 mb-8">
            {context?.action === 'chat'
              ? `You can now chat with ${displayName}`
              : context?.action === 'proposal'
              ? `You can now send proposals to ${displayName}`
              : `You now have access to all verified features${influencerName ? ` and can contact ${influencerName}` : ''}`}
          </p>

          <button
            onClick={handleContinue}
            className="w-full bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {context?.action === 'chat' ? 'Continue to Chat' : context?.action === 'proposal' ? 'Continue to Proposal' : 'Go to Dashboard'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Verification form state
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
        <div className="w-16 h-16 bg-[#B8FF00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">Verification Required</h2>
        <p className="text-gray-400 mb-6">
          Complete the one-time verification process to access all features.
        </p>

        <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
          <h3 className="text-white font-medium mb-3">What you get:</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Access to influencer database</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Send collaboration proposals</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Contact verified-only influencers</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Prevent spam & ensure quality</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>₹1,000 converted to ColLoved credits (valid for 1 year)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>20% discount when using credits to pay platform fees</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleVerification}
          disabled={paymentLoading}
          className="w-full bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {paymentLoading ? 'Processing...' : 'Pay ₹1,000 + GST'}
        </button>
        {paymentError && (
          <p className="text-red-400 text-xs mt-2">{paymentError}</p>
        )}
        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}
        <p className="text-gray-500 text-xs mt-4">
          Secure payment via Razorpay • Credits valid for 1 year
        </p>

        {/* Development: Skip verification button */}
        {import.meta.env.DEV && (
          <button
            onClick={handleDevSkipVerification}
            disabled={isLoading}
            className="w-full mt-4 bg-white/10 hover:bg-white/20 text-gray-400 font-medium py-2 rounded-xl transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'DEV: Skip Verification'}
          </button>
        )}
      </div>
    </div>
  );
}
