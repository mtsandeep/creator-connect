// ============================================
// INCOMPLETE PROFILE PAGE (Root Route)
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { Building2, ShieldCheck, FileEdit, MessageCircle } from 'lucide-react';

interface IncompleteProfileContext {
  username?: string;
  action?: 'chat' | 'proposal';
  needsVerification?: boolean;
  influencerId?: string;
  influencerName?: string;
}

export default function IncompleteProfile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [context, setContext] = useState<IncompleteProfileContext | null>(null);

  useEffect(() => {
    // Read context from sessionStorage (set by LinkInBio or other pages)
    const storedContext = sessionStorage.getItem('incompleteProfileContext');
    if (storedContext) {
      setContext(JSON.parse(storedContext));
    }

    // If user is not authenticated, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // If user already has complete profile, redirect based on context
    if (user.profileComplete) {
      const storedContext = sessionStorage.getItem('incompleteProfileContext');
      if (storedContext) {
        const ctx = JSON.parse(storedContext);
        sessionStorage.removeItem('incompleteProfileContext');

        if (ctx.action === 'chat' && ctx.username) {
          navigate(`/link/${ctx.username}/chat`);
        } else if (ctx.action === 'proposal' && ctx.username) {
          navigate(`/link/${ctx.username}/proposal`);
        } else {
          navigate('/promoter/dashboard');
        }
      } else {
        navigate('/promoter/dashboard');
      }
    }
  }, [user, navigate]);

  const handleCompleteProfile = () => {
    // Store context for redirect after signup
    if (context) {
      sessionStorage.setItem('redirectAfterSignup', JSON.stringify({
        username: context.username,
        action: context.action,
        influencerId: context.influencerId,
        influencerName: context.influencerName,
      }));
    }
    // Navigate to full promoter signup
    navigate('/signup/promoter');
  };

  const handleContinueToChat = () => {
    // Only allow continuing to chat, not proposals (proposals need complete profile)
    if (context?.action === 'proposal') {
      // Show message that profile must be completed for proposals
      alert('Please complete your profile to send proposals.');
      return;
    }

    if (context?.username) {
      sessionStorage.removeItem('incompleteProfileContext');
      navigate(`/link/${context.username}/chat`);
    } else {
      // No context - go to dashboard
      navigate('/promoter/dashboard');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  const influencerName = context?.influencerName || 'this influencer';
  const needsVerification = context?.needsVerification || false;
  const isProposalAction = context?.action === 'proposal';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Almost There!</h1>
          <p className="text-gray-400">
            {isProposalAction
              ? `Complete your profile to send a proposal to ${influencerName}`
              : needsVerification
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
                {isProposalAction
                  ? 'Sending proposals requires a complete profile. This helps influencers understand who they\'re collaborating with.'
                  : needsVerification
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

        {/* Continue to Chat Option - Only show for chat action, not proposal */}
        {!isProposalAction && (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-white/10 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[#B8FF00]/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#B8FF00]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Start Chatting Now</h2>
                <p className="text-gray-400 text-sm">
                  You can start chatting immediately without completing your profile. Complete it later to send proposals.
                </p>
              </div>
            </div>

            <button
              onClick={handleContinueToChat}
              className="w-full bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Continue to Chat
            </button>
          </div>
        )}

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
              disabled
              className="w-full bg-white/5 text-gray-500 cursor-not-allowed font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Complete Profile First
            </button>

            <p className="text-gray-500 text-xs mt-3 text-center">
              Complete your profile above to enable verification
            </p>
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
