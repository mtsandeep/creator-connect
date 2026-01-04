import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import type { PromoterType } from '../types';
import { Building2, CheckCircle2, MessageCircle } from 'lucide-react';

interface RedirectAfterAuth {
  path: string;
  action: 'start_chat' | 'send_proposal';
  influencerId: string;
  influencerName: string;
}

export default function SignupFromLink() {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'individual' as PromoterType,
  });

  const [redirectInfo, setRedirectInfo] = useState<RedirectAfterAuth | null>(null);

  useEffect(() => {
    // Get redirect info from sessionStorage
    const storedRedirect = sessionStorage.getItem('redirectAfterAuth');
    if (storedRedirect) {
      setRedirectInfo(JSON.parse(storedRedirect));
    } else {
      // No redirect info, go to role selection
      navigate('/role-selection');
    }

    // If user is already authenticated and has a promoter profile, redirect
    if (user?.roles.includes('promoter') && user.promoterProfile) {
      handleRedirect();
    }
  }, [user]);

  const handleRedirect = () => {
    // Use state-based redirectInfo instead of sessionStorage
    if (redirectInfo) {
      sessionStorage.removeItem('redirectAfterAuth');

      if (redirectInfo.action === 'start_chat') {
        navigate(`/promoter/messages/${redirectInfo.influencerId}`);
      } else if (redirectInfo.action === 'send_proposal') {
        navigate(`/promoter/browse?influencer=${redirectInfo.influencerId}`);
      }
    } else {
      navigate('/promoter/profile');
    }
  };

  const handleContinueToChat = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Get existing allowed influencer IDs or initialize with current one
      const existingAllowed = user.allowedInfluencerIds || [];
      const newAllowedIds = redirectInfo?.influencerId
        ? [...new Set([...existingAllowed, redirectInfo.influencerId])]
        : existingAllowed;

      // Create minimal promoter profile with name only
      await setDoc(
        doc(db, 'users', user.uid),
        {
          roles: ['promoter'],
          activeRole: 'promoter',
          profileComplete: false,
          promoterProfile: {
            name: formData.name.trim() || 'Brand',
            type: 'individual',
            categories: [],
            website: '',
            logo: '',
            description: '',
            location: '',
          },
          allowedInfluencerIds: newAllowedIds,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Update local user state
      updateUserProfile({
        roles: ['promoter'],
        activeRole: 'promoter',
        profileComplete: false,
        promoterProfile: {
          name: formData.name.trim() || 'Brand',
          type: 'individual',
          categories: [],
          website: '',
          logo: '',
          description: '',
          location: '',
        },
        allowedInfluencerIds: newAllowedIds,
      } as any);

      // Redirect to chat/proposal
      handleRedirect();
    } catch (error) {
      console.error('Error creating promoter profile:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = () => {
    // Store the name and redirect info for later use in full signup
    sessionStorage.setItem('promoterSignupName', formData.name);
    sessionStorage.setItem('redirectAfterSignup', JSON.stringify({
      action: redirectInfo?.action || 'start_chat',
      influencerId: redirectInfo?.influencerId || '',
      influencerName: redirectInfo?.influencerName || ''
    }));
    // Navigate to full promoter signup
    navigate('/signup/promoter');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  // If user already has promoter profile, redirect
  if (user.roles.includes('promoter') && user.promoterProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#00A8CC] rounded-full mb-4">
            <Building2 className="w-8 h-8 text-[#0F172A]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome! Setting up your brand account
          </h1>
          <p className="text-gray-400">
            You're almost ready to contact{' '}
            {redirectInfo?.influencerName || 'this influencer'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 bg-[#00D9FF] rounded-full text-[#0F172A] font-semibold">
            1
          </div>
          <div className="w-16 h-1 bg-[#00D9FF] rounded"></div>
          <div className="flex items-center justify-center w-8 h-8 bg-[#00FF94] rounded-full text-[#0F172A]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#1E293B] rounded-2xl p-8 border border-[#00D9FF]/20 space-y-6">
          {/* Brand/Company Name */}
          <div>
            <label className="block text-white font-medium mb-2">
              Brand/Company/Display Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Acme Brands"
              required
              className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF] transition-colors"
            />
            <p className="text-gray-400 text-sm mt-2">
              The influencer will be seeing this name when you chat.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Continue to Chat Button */}
            <button
              onClick={handleContinueToChat}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00D9FF] to-[#00A8CC] text-[#0F172A] font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0F172A]"></div>
                  Setting up...
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  Continue to Chat
                </>
              )}
            </button>

            {/* Complete Profile Button */}
            <button
              onClick={handleCompleteProfile}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Complete Profile First
            </button>
          </div>

          {/* Info Text */}
          <p className="text-center text-gray-400 text-sm">
            Start chatting immediately or complete your profile to send proposals
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-[#0F172A] rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm text-center">
            💡 <span className="text-white font-medium">Tip:</span> Complete your profile to send
            proposals. You can chat immediately without completing it.
          </p>
        </div>
      </div>
    </div>
  );
}
