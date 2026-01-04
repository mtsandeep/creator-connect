// ============================================
// PROMOTER MESSAGES PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useChatStore, type ConversationTab } from '../../stores/chatStore';
import { useConversations, useDirectConversation } from '../../hooks/useChat';
import { HiUserGroup } from 'react-icons/hi2';
import PromoterList from '../../components/chat/PromoterList';
import ChatWindow from '../../components/chat/ChatWindow';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { User } from '../../types';

export default function PromoterMessages() {
  const { influencerId, proposalId } = useParams();
  const { user } = useAuthStore();
  const reset = useChatStore((s) => s.reset);
  const setActivePromoter = useChatStore((s) => s.setActivePromoter);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getOrCreateDirectConversation } = useDirectConversation();

  // For direct conversations from link-in-bio (no proposal yet)
  const [directConversationId, setDirectConversationId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loadingDirectChat, setLoadingDirectChat] = useState(false);

  // Load conversations
  useConversations('promoter');

  // Reset state when unmounting
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const activePromoterId = useChatStore((s) => s.activePromoterId);
  const promoterGroups = useChatStore((s) => s.promoterGroups);
  const activePromoterGroup = useChatStore((s) => s.promoterGroups.find(g => g.promoterId === activePromoterId));

  // When coming from link-in-bio with influencerId but no proposal,
  // create a direct conversation and fetch the influencer's data
  useEffect(() => {
    const setupDirectChat = async () => {
      if (!influencerId || !user?.uid || proposalId) return;
      // Check if this influencer is in allowed list or user is verified
      const isAllowed = user.isPromoterVerified || (user.allowedInfluencerIds?.includes(influencerId));
      if (!isAllowed) return;

      setLoadingDirectChat(true);
      try {
        // Fetch influencer data
        const influencerDoc = await getDoc(doc(db, 'users', influencerId));
        if (!influencerDoc.exists()) return;

        const influencerData = influencerDoc.data();
        const fetchedUser: User = {
          uid: influencerDoc.id,
          email: influencerData.email || '',
          roles: influencerData.roles || [],
          activeRole: influencerData.activeRole || null,
          createdAt: influencerData.createdAt || 0,
          profileComplete: influencerData.profileComplete || false,
          influencerProfile: influencerData.influencerProfile,
          promoterProfile: influencerData.promoterProfile,
          avgRating: influencerData.avgRating || 0,
          totalReviews: influencerData.totalReviews || 0,
          isBanned: influencerData.isBanned || false,
          verificationBadges: influencerData.verificationBadges || { verified: false, trusted: false },
        };

        setOtherUser(fetchedUser);

        // Create or get direct conversation
        const convId = await getOrCreateDirectConversation(influencerId);
        setDirectConversationId(convId);

        // Set active promoter with direct chat tab
        setActivePromoter(influencerId, {
          id: 'direct',
          type: 'direct',
          title: 'Direct Chat',
          conversationId: convId,
        });
      } catch (error) {
        console.error('Error setting up direct chat:', error);
      } finally {
        setLoadingDirectChat(false);
      }
    };

    setupDirectChat();
  }, [influencerId, proposalId, user]);

  // Handle URL params to set active promoter and tab
  useEffect(() => {
    if (influencerId && !directConversationId) {
      const promoterGroup = promoterGroups.find(g => g.promoterId === influencerId);

      let tab: ConversationTab | undefined;

      if (proposalId && promoterGroup) {
        const conversation = promoterGroup.conversations.find(c => c.proposalId === proposalId);

        if (conversation && conversation.proposal) {
          tab = {
            id: proposalId,
            type: 'proposal',
            title: conversation.proposal.title,
            proposalId: proposalId,
            conversationId: conversation.conversationId,
          };
        }
      }

      setActivePromoter(influencerId, tab);
    }
  }, [influencerId, proposalId, promoterGroups, setActivePromoter, directConversationId]);

  if (!user) return null;

  // Show loading when setting up direct chat from link-in-bio
  if (loadingDirectChat && influencerId && !proposalId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8FF00]"></div>
      </div>
    );
  }

  // For direct chat from link-in-bio, show the chat window with other user data
  if (directConversationId && otherUser && influencerId) {
    return (
      <div className="flex h-[100vh] relative">
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar - Promoter List */}
        <div className={`
          fixed lg:relative w-80 h-full bg-[#0a0a0f] border-r border-white/10 flex-shrink-0 z-40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <PromoterList
            activePromoterId={influencerId}
            onSelectPromoter={() => setSidebarOpen(false)}
          />
        </div>

        {/* Right - Chat Window */}
        <div className="flex-1 w-full">
          <ChatWindow
            promoterId={influencerId}
            otherUserId={influencerId}
            otherUserName={
              otherUser.influencerProfile?.displayName ||
              otherUser.promoterProfile?.name ||
              otherUser.email
            }
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isMobileSidebarOpen={sidebarOpen}
            directConversationId={directConversationId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100vh] relative">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Promoter List */}
      <div className={`
        fixed lg:relative w-80 h-full bg-[#0a0a0f] border-r border-white/10 flex-shrink-0 z-40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <PromoterList
          activePromoterId={activePromoterId}
          onSelectPromoter={() => setSidebarOpen(false)}
        />
      </div>

      {/* Right - Chat Window */}
      <div className="flex-1 w-full">
        {activePromoterGroup ? (
          <ChatWindow
            promoterId={activePromoterGroup.promoterId}
            otherUserId={activePromoterGroup.promoterId}
            otherUserName={
              activePromoterGroup.promoter.influencerProfile?.displayName ||
              activePromoterGroup.promoter.promoterProfile?.name ||
              activePromoterGroup.promoter.email
            }
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isMobileSidebarOpen={sidebarOpen}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-400 mb-6">Select a conversation to start messaging</p>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden inline-flex bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors items-center gap-2"
              >
                <HiUserGroup className="w-5 h-5" />
                Show all chats
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
