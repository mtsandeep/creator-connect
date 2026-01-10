// ============================================
// LINK-IN-BIO DEDICATED PROPOSAL PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import { useInfluencerProposals } from '../hooks/useInfluencerProposals';
import CreateProposalForm from '../components/proposal/CreateProposalForm';
import type { User } from '../types';
import { LuArrowLeft, LuMessageCircle, LuFileText, LuEye } from 'react-icons/lu';

export default function LinkInBioProposal() {
  const { username } = useParams<{ username: string }>();
  const normalizedUsername = (username || '').replace(/^@+/, '');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [influencer, setInfluencer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Call hooks before any conditional returns
  // Pass null initially if influencer not loaded yet
  const { hasProposals } = useInfluencerProposals(influencer?.uid || null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/link/${normalizedUsername}/proposal`)}&action=send_proposal&username=${normalizedUsername}`);
    }
  }, [isAuthenticated, normalizedUsername, navigate]);

  // Redirect if profile is incomplete
  useEffect(() => {
    if (isAuthenticated && user?.roles.includes('promoter') && !user.profileComplete) {
      sessionStorage.setItem('incompleteProfileContext', JSON.stringify({
        username: normalizedUsername,
        action: 'proposal',
      }));
      navigate('/incomplete-profile');
    }
  }, [isAuthenticated, user, normalizedUsername, navigate]);

  // Fetch influencer data
  useEffect(() => {
    const fetchInfluencer = async () => {
      if (!normalizedUsername || !isAuthenticated) return;

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
          setInfluencer(userData);

          // Check if verification is required
          const needsVerification = userData.influencerProfile?.linkInBio?.contactPreference === 'verified_only';
          if (needsVerification) {
            const isAllowed = user?.isPromoterVerified || (user?.allowedInfluencerIds?.includes(userData.uid));
            if (!isAllowed) {
              sessionStorage.setItem('verificationContext', JSON.stringify({
                username: normalizedUsername,
                action: 'proposal',
              }));
              navigate('/verification');
            }
          }
        } else {
          setError('Influencer not found');
        }
      } catch (err) {
        console.error('Error fetching influencer:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencer();
  }, [normalizedUsername, isAuthenticated, user, navigate]);

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505] flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <h1 className="text-2xl font-bold mb-2">Unable to Send Proposal</h1>
          <p className="text-gray-400 mb-6">{error || 'This link may be invalid'}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const profile = influencer.influencerProfile!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505]">
      {/* Header */}
      <div className="max-w-3xl mx-auto bg-[#0a0a0a] border-b border-white/10">
        {/* Top row: back, profile info, icon */}
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(`/link/${normalizedUsername}`)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <LuArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 flex-1">
            <img
              src={profile.profileImage || '/default-avatar.png'}
              alt={profile.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{profile.displayName}</p>
              <p className="text-gray-500 text-sm truncate">{normalizedUsername}</p>
            </div>
          </div>

          <LuFileText className="w-5 h-5 text-[#B8FF00]" />
        </div>

        {/* Action row */}
        <div className="px-4 pb-3 flex justify-end gap-3">
          {hasProposals && (
            <button
              onClick={() => navigate('/promoter/proposals')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-medium"
            >
              <LuEye className="w-4 h-4" />
              View Proposals
            </button>
          )}
          <button
            onClick={() => navigate(`/link/${normalizedUsername}/chat`)}
            className="flex items-center gap-2 text-sm text-[#00D9FF] hover:text-[#00D9FF]/80 transition-colors font-medium"
          >
            <LuMessageCircle className="w-4 h-4" />
            Back to Chat
          </button>
        </div>
      </div>

      {/* Proposal Form */}
      <div className="p-4 max-w-3xl mx-auto">
        <CreateProposalForm
          influencerId={influencer.uid}
          influencerName={profile.displayName}
          onCancel={() => navigate(`/link/${normalizedUsername}`)}
        />
      </div>
    </div>
  );
}
