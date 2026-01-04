// ============================================
// PROMOTER VERIFICATION PAGE
// ============================================

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useEffect, useState } from 'react';

export default function PromoterVerification() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Parse URL params
  const [context, setContext] = useState<'browse' | 'link_in_bio'>('browse');
  const [influencerId, setInfluencerId] = useState<string | null>(null);
  const [influencerName, setInfluencerName] = useState<string>('');

  useEffect(() => {
    const contextParam = searchParams.get('context') as 'browse' | 'link_in_bio' | null;
    setContext(contextParam || 'browse');
    setInfluencerId(searchParams.get('influencer'));
    setInfluencerName(decodeURIComponent(searchParams.get('name') || ''));
  }, [searchParams]);

  const handleVerification = async () => {
    // TODO: Integrate payment gateway (Razorpay)
    console.log('Deposit button clicked - payment integration coming soon');
  };

  const handleDevSkipVerification = async () => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isPromoterVerified: true,
        verifiedAt: serverTimestamp(),
      });

      // Update local store immediately so UI reflects the change
      const { updateUserProfile } = useAuthStore.getState();
      updateUserProfile({ isPromoterVerified: true });

      // Clear the verification intent from sessionStorage
      sessionStorage.removeItem('verificationIntent');

      // Redirect back to where user came from
      if (context === 'browse') {
        navigate('/promoter/browse');
      } else if (context === 'link_in_bio') {
        // Store the action we were trying to take
        sessionStorage.setItem('verificationComplete', JSON.stringify({
          action: 'link_in_bio',
          influencerId,
          influencerName,
        }));
        // Go back to the link-in-bio page after verification
        navigate(-1);
      }
    } catch (error) {
      console.error('Error marking as verified:', error);
    }
  };

  const getTitle = () => {
    if (context === 'link_in_bio') {
      return `Verification Required to Contact ${influencerName || 'This Influencer'}`;
    }
    return 'Verify Your Account';
  };

  const getDescription = () => {
    if (context === 'link_in_bio') {
      return `This influencer only accepts messages from verified brands. Verify your promoter account with a one-time deposit of ₹1,000 to start collaborating.`;
    }
    return 'To browse and connect with influencers, you need to verify your promoter account with a one-time deposit of ₹1,000.';
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
        <div className="w-16 h-16 bg-[#B8FF00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">{getTitle()}</h2>
        <p className="text-gray-400 mb-6">{getDescription()}</p>

        <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
          <h3 className="text-white font-medium mb-3">Why verify?</h3>
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
              <span>Deposit is refundable</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleVerification}
          className="w-full bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
        >
          Pay ₹1,000 to Verify
        </button>
        <p className="text-gray-500 text-xs mt-4">
          Secure payment via Razorpay • Refundable deposit
        </p>

        {/* Development: Skip verification button */}
        {import.meta.env.DEV && (
          <button
            onClick={handleDevSkipVerification}
            className="w-full mt-4 bg-white/10 hover:bg-white/20 text-gray-400 font-medium py-2 rounded-xl transition-colors text-xs"
          >
            DEV: Skip Verification
          </button>
        )}

        {/* Back button */}
        {context === 'browse' && (
          <button
            onClick={() => navigate(-1)}
            className="w-full mt-4 text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Go Back
          </button>
        )}
      </div>
    </div>
  );
}
