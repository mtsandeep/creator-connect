// ============================================
// LINK-IN-BIO DEDICATED CHAT PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import { useDirectConversation } from '../hooks/useChat';
import LinkInBioChatWindow from '../components/chat/LinkInBioChatWindow';
import type { User } from '../types';

export default function LinkInBioChat() {
  const { username } = useParams<{ username: string }>();
  const normalizedUsername = (username || '').replace(/^@+/, '');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [influencer, setInfluencer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getOrCreateDirectConversation } = useDirectConversation();
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/link/${normalizedUsername}/chat`)}&action=start_chat&username=${normalizedUsername}`);
    }
  }, [isAuthenticated, normalizedUsername, navigate]);

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
  }, [normalizedUsername, isAuthenticated]);

  // Check if user can chat and create conversation
  useEffect(() => {
    const setupChat = async () => {
      if (!influencer || !user?.uid) return;

      // Check if influencer requires verification
      const requiresVerification = influencer.influencerProfile?.linkInBio?.contactPreference === 'verified_only';

      // If verification is required, check if user is verified or in allowed list
      if (requiresVerification) {
        const isAllowed = user.isPromoterVerified || (user.allowedInfluencerIds?.includes(influencer.uid));

        if (!isAllowed) {
          // Redirect to verification
          sessionStorage.setItem('verificationContext', JSON.stringify({
            username,
            action: 'chat',
          }));
          navigate('/verification');
          return;
        }
      }

      // Create or get direct conversation
      try {
        const convId = await getOrCreateDirectConversation(influencer.uid);
        setConversationId(convId);
      } catch (err) {
        console.error('Error creating conversation:', err);
        setError('Failed to start chat');
      }
    };

    setupChat();
  }, [influencer, user, username, navigate, getOrCreateDirectConversation]);

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
          <h1 className="text-2xl font-bold mb-2">Unable to Start Chat</h1>
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

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  const profile = influencer.influencerProfile!;

  return (
    <LinkInBioChatWindow
      username={normalizedUsername}
      influencerId={influencer.uid}
      influencerName={profile.displayName}
      influencerImage={profile.profileImage}
      onBack={() => navigate(`/link/${normalizedUsername}`)}
      conversationId={conversationId}
    />
  );
}
