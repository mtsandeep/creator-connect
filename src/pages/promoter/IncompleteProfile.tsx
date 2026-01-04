// ============================================
// PROMOTER INCOMPLETE PROFILE PAGE
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { Building2, ShieldCheck, FileEdit, CreditCard } from 'lucide-react';

export default function PromoterIncompleteProfile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read verification intent from sessionStorage (persists across navigation) or URL params
  const [verificationIntent, setVerificationIntent] = useState<{
    required: boolean;
    influencerId?: string;
    influencerName?: string;
  } | null>(null);

  useEffect(() => {
    // Check URL params first
    const urlVerification = searchParams.get('verification') === 'required';
    const urlInfluencer = searchParams.get('influencer');
    const urlName = searchParams.get('name');

    // Fall back to sessionStorage
    const storedIntent = sessionStorage.getItem('verificationIntent');

    if (urlVerification || urlInfluencer || urlName) {
      // Use URL params and update sessionStorage
      const intent = {
        required: urlVerification,
        influencerId: urlInfluencer || undefined,
        influencerName: urlName ? decodeURIComponent(urlName) : undefined
      };
      setVerificationIntent(intent);
      if (urlVerification || urlInfluencer || urlName) {
        sessionStorage.setItem('verificationIntent', JSON.stringify(intent));
      }
    } else if (storedIntent) {
      // Use stored intent
      setVerificationIntent(JSON.parse(storedIntent));
    }
  }, [searchParams]);

  const needsVerification = verificationIntent?.required || false;
  const fromInfluencer = verificationIntent?.influencerId;
  const influencerName = verificationIntent?.influencerName || 'this influencer';

  const handleCompleteProfile = () => {
    // Navigate to profile with edit mode - we'll need to add this functionality
    navigate('/promoter/profile?edit=true');
  };

  const handleVerify = () => {
    // Navigate to verification with context
    const params = new URLSearchParams();
    params.set('context', 'link_in_bio');
    if (fromInfluencer) params.set('influencer', fromInfluencer);
    if (verificationIntent?.influencerName) params.set('name', encodeURIComponent(verificationIntent.influencerName));

    navigate(`/promoter/verification?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Almost There!</h1>
          <p className="text-gray-400">
            {needsVerification
              ? `Complete a few more steps to contact ${influencerName}`
              : 'Complete your profile to connect with influencers'}
          </p>
        </div>

        {/* Profile Completion Section */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-white/10 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-[#00D9FF]/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#00D9FF]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Complete Your Profile</h2>
              <p className="text-gray-400 text-sm">
                {needsVerification
                  ? 'Before you can verify your account, you need to complete your brand profile. This helps influencers understand who they\'re collaborating with.'
                  : 'Influencers prefer to work with brands that have complete profiles. Fill in your details to start sending proposals and connecting with creators.'}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-[#00D9FF]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-[#00D9FF]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Add your brand name and logo</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-[#00D9FF]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-[#00D9FF]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Select relevant categories</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-[#00D9FF]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-[#00D9FF]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Write a description of your brand</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-[#00D9FF]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-[#00D9FF]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Add your location</span>
            </div>
          </div>

          <button
            onClick={handleCompleteProfile}
            className="w-full bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <FileEdit className="w-5 h-5" />
            Complete Profile
          </button>
        </div>

        {/* Verification Section - Only show if needed */}
        {needsVerification && (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-white/10">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[#B8FF00]/20 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#B8FF00]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Verify Your Account</h2>
                <p className="text-gray-400 text-sm">
                  {influencerName} only accepts messages from verified brands. Complete a one-time verification to start collaborating.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-5 h-5 bg-[#B8FF00]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#B8FF00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Access to influencer database</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-5 h-5 bg-[#B8FF00]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#B8FF00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Send collaboration proposals</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-5 h-5 bg-[#B8FF00]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#B8FF00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Contact verified-only influencers</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-5 h-5 bg-[#B8FF00]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#B8FF00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>One-time ₹1,000 deposit (refundable)</span>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={!user?.profileComplete}
              className={`w-full font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                user?.profileComplete
                  ? 'bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              {user?.profileComplete ? 'Verify Account' : 'Complete Profile First'}
            </button>

            {!user?.profileComplete && (
              <p className="text-gray-500 text-xs mt-3 text-center">
                Complete your profile above to enable verification
              </p>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-[#0a0a0a] rounded-xl p-4 border border-white/5">
          <p className="text-gray-400 text-sm text-center">
            💡 <span className="text-white font-medium">Tip:</span> You can always complete these steps later from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
