import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import type { PromoterType, User } from '../types';
import { Building2, CheckCircle2, MessageCircle, Shield } from 'lucide-react';

interface RedirectAfterAuth {
  path: string;
  action: 'start_chat' | 'send_proposal';
  username?: string;
}

export default function SignupFromLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUserProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetchingInfluencer, setFetchingInfluencer] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [influencerId, setInfluencerId] = useState<string | null>(null);
  const [influencerName, setInfluencerName] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'individual' as PromoterType,
  });

  const [redirectInfo, setRedirectInfo] = useState<RedirectAfterAuth | null>(null);

  useEffect(() => {
    // Get redirect info from query params
    const redirect = searchParams.get('redirect');
    const action = searchParams.get('action');
    const username = (searchParams.get('username') || '').replace(/^@+/, '');

    if (redirect && action && username) {
      setRedirectInfo({ path: redirect, action: action as 'start_chat' | 'send_proposal', username });

      // If user is already authenticated and has a promoter profile, redirect immediately
      if (user?.roles.includes('promoter') && user.promoterProfile) {
        if (action === 'start_chat') {
          navigate(`/link/${username}/chat`, { replace: true });
        } else if (action === 'send_proposal') {
          navigate(`/link/${username}/proposal`, { replace: true });
        } else {
          navigate('/promoter/profile', { replace: true });
        }
      }
    } else {
      // No redirect info, go to role selection
      navigate('/role-selection', { replace: true });
    }
  }, [user, searchParams, navigate]);

  // Fetch influencer to check if verification is required
  useEffect(() => {
    const fetchInfluencer = async () => {
      if (!redirectInfo?.username) return;

      const normalizedUsername = redirectInfo.username.replace(/^@+/, '');

      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('influencerProfile.username', '==', normalizedUsername),
          where('roles', 'array-contains', 'influencer'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = { ...userDoc.data(), uid: userDoc.id } as User;
          setInfluencerId(userData.uid);
          setInfluencerName(userData.influencerProfile?.displayName || '');

          // Check if verification is required
          const requiresVerification = userData.influencerProfile?.linkInBio?.contactPreference === 'verified_only';
          setNeedsVerification(requiresVerification);
        }
      } catch (err) {
        console.error('Error fetching influencer:', err);
      } finally {
        setFetchingInfluencer(false);
      }
    };

    fetchInfluencer();
  }, [redirectInfo?.username]);

  const handleRedirect = () => {
    // Use redirectInfo state from query params
    if (redirectInfo?.action && redirectInfo?.username) {
      if (redirectInfo.action === 'start_chat') {
        navigate(`/link/${redirectInfo.username}/chat`);
      } else if (redirectInfo.action === 'send_proposal') {
        navigate(`/link/${redirectInfo.username}/proposal`);
      }
    } else {
      // No redirect info - shouldn't happen, but fallback to dashboard
      navigate('/promoter/dashboard');
    }
  };

  const handleContinueToChat = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
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
      } as any);

      // If verification is required, redirect to verification page
      if (needsVerification && influencerId && redirectInfo?.username) {
        sessionStorage.setItem('verificationContext', JSON.stringify({
          username: redirectInfo.username,
          action: redirectInfo.action,
          influencerId,
          influencerName,
        }));
        navigate('/verification');
        return;
      }

      // Otherwise redirect to chat/proposal directly
      handleRedirect();
    } catch (error) {
      console.error('Error creating promoter profile:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = () => {
    // Store the name for later use in full signup
    sessionStorage.setItem('promoterSignupName', formData.name);
    // Store redirect info for after full signup
    if (redirectInfo?.username && redirectInfo?.action) {
      sessionStorage.setItem('redirectAfterSignup', JSON.stringify({
        username: redirectInfo.username,
        action: redirectInfo.action,
      }));
    }
    // Navigate to full promoter signup
    navigate('/signup/promoter');
  };

  if (!user || fetchingInfluencer) {
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
            You're almost ready to contact {influencerName || 'this influencer'}
            {needsVerification && (
              <span className="flex items-center justify-center gap-1.5 mt-2 text-amber-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Verification required</span>
              </span>
            )}
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
            {/* Continue to Chat/Verification Button */}
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
                  {needsVerification ? (
                    <>
                      <Shield className="w-5 h-5" />
                      Verify & Continue
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      Continue to Chat
                    </>
                  )}
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
            {needsVerification
              ? 'Verification required to contact this influencer. Complete your profile to send proposals.'
              : 'Start chatting immediately or complete your profile to send proposals'}
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-[#0F172A] rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm text-center">
            💡 <span className="text-white font-medium">Tip:</span> {needsVerification
              ? 'This influencer only accepts messages from verified brands. A one-time deposit is required.'
              : 'Complete your profile to send proposals. You can chat immediately without completing it.'}
          </p>
        </div>
      </div>
    </div>
  );
}
