// ============================================
// SHARED CHAT VIEW PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import { useChatStore } from '../stores/chatStore';
import { useConversations, type ChatRole } from '../hooks/useChat';
import ChatWindow from '../components/chat/ChatWindow';
import ChatList from '../components/chat/ChatList';
import type { User } from '../types';

export default function ChatView() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loadingOtherUser, setLoadingOtherUser] = useState(true);

  // Determine role from current route, not from user roles
  // This ensures users with both roles see the correct data
  const chatRole: ChatRole = location.pathname.startsWith('/influencer') ? 'influencer' : 'promoter';

  // Load conversations with the determined role
  useConversations(chatRole);

  // Set active conversation
  useEffect(() => {
    if (proposalId) {
      setActiveConversation(proposalId);
    }
  }, [proposalId, setActiveConversation]);

  // Fetch other user's data for this proposal
  useEffect(() => {
    if (!proposalId || !user?.uid) {
      setOtherUser(null);
      setLoadingOtherUser(false);
      return;
    }

    const fetchOtherUser = async () => {
      try {
        const proposalDoc = await getDoc(doc(db, 'proposals', proposalId));

        if (!proposalDoc.exists()) {
          setLoadingOtherUser(false);
          return;
        }

        const proposalData = proposalDoc.data();

        // Get the other user's ID
        const otherUserId =
          user.uid === proposalData.promoterId
            ? proposalData.influencerId
            : proposalData.promoterId;

        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));

        if (!otherUserDoc.exists()) {
          setLoadingOtherUser(false);
          return;
        }

        const otherUserData = otherUserDoc.data();

        setOtherUser({
          uid: otherUserDoc.id,
          email: otherUserData.email || '',
          roles: otherUserData.roles || [],
          activeRole: otherUserData.activeRole || null,
          createdAt: otherUserData.createdAt || 0,
          profileComplete: otherUserData.profileComplete || false,
          influencerProfile: otherUserData.influencerProfile,
          promoterProfile: otherUserData.promoterProfile,
          avgRating: otherUserData.avgRating || 0,
          totalReviews: otherUserData.totalReviews || 0,
          isBanned: otherUserData.isBanned || false,
          verificationBadges: otherUserData.verificationBadges || { verified: false, trusted: false },
        });

        setLoadingOtherUser(false);
      } catch (error) {
        console.error('Error fetching other user:', error);
        setLoadingOtherUser(false);
      }
    };

    fetchOtherUser();
  }, [proposalId, user?.uid]);

  // Get other user's name
  const getOtherUserName = () => {
    if (!otherUser) return 'Unknown';
    if (otherUser.influencerProfile) {
      return otherUser.influencerProfile.displayName;
    }
    if (otherUser.promoterProfile) {
      return otherUser.promoterProfile.name;
    }
    return otherUser.email;
  };

  const handleBack = () => {
    // Use the current route to determine where to go back
    const basePath = chatRole === 'influencer' ? '/influencer/messages' : '/promoter/messages';
    navigate(basePath);
  };

  if (!proposalId) {
    // Show chat list if no proposal selected
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="w-full max-w-6xl px-4">
          <ChatList />
        </div>
      </div>
    );
  }

  if (loadingOtherUser) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8FF00]"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Conversation Not Found</h2>
          <button
            onClick={handleBack}
            className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] w-[200px]">
      <ChatWindow
        promoterId={otherUser.uid}
        otherUserId={otherUser.uid}
        otherUserName={getOtherUserName()}
      />
    </div>
  );
}
