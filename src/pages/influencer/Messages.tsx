// ============================================
// INFLUENCER MESSAGES PAGE
// ============================================

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useChatStore } from '../../stores/chatStore';
import { useConversations } from '../../hooks/useChat';
import { HiUserGroup } from 'react-icons/hi2';
import PromoterList from '../../components/chat/PromoterList';
import ChatWindow from '../../components/chat/ChatWindow';

export default function InfluencerMessages() {
  const { promoterId } = useParams();
  const { user } = useAuthStore();
  const reset = useChatStore((s) => s.reset);
  const setActivePromoter = useChatStore((s) => s.setActivePromoter);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load conversations
  useConversations('influencer');

  // Reset state when unmounting
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const activePromoterId = useChatStore((s) => s.activePromoterId);
  const promoterGroups = useChatStore((s) => s.promoterGroups);
  const activePromoterGroup = useChatStore((s) => s.promoterGroups.find(g => g.promoterId === activePromoterId));

  const visiblePromoterGroups = useMemo(() => {
    return promoterGroups.filter((g) => {
      if (g.lastMessageTime) return true;

      // Always show direct chats even if they don't have a lastMessage yet
      if (g.conversations.some((c) => !c.proposalId)) return true;

      return g.conversations.some((c) => !!c.lastMessage);
    });
  }, [promoterGroups]);

  // Handle URL params to set active promoter and tab
  useEffect(() => {
    if (!promoterId) return;

    if (activePromoterId !== promoterId) {
      setActivePromoter(promoterId);
    }
  }, [promoterId, setActivePromoter, activePromoterId]);

  if (!user) return null;

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
          promoterGroupsOverride={visiblePromoterGroups}
        />
      </div>

      {/* Right - Chat Window */}
      <div className="flex-1 w-full">
        {activePromoterGroup ? (
          <ChatWindow
            promoterId={activePromoterGroup.promoterId}
            otherUserId={activePromoterGroup.promoterId}
            otherUserName={
              (activePromoterGroup.promoter.promoterProfile && activePromoterGroup.promoter.influencerProfile)
                ? `${activePromoterGroup.promoter.promoterProfile.name} (${activePromoterGroup.promoter.influencerProfile.displayName})`
                : (activePromoterGroup.promoter.promoterProfile?.name || 
                   activePromoterGroup.promoter.influencerProfile?.displayName ||
                   activePromoterGroup.promoter.email)
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
