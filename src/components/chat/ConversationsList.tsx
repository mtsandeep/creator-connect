// ============================================
// CONVERSATIONS LIST COMPONENT (Left Sidebar)
// ============================================

import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore, type PromoterGroup } from '../../stores/chatStore';
import { getAvatar } from '../../utils/avatarUtils';

interface ConversationsListProps {
  activeConversationId?: string | null;
  onSelectConversation?: () => void;
  conversationsOverride?: PromoterGroup[];
}

export default function ConversationsList({ activeConversationId, onSelectConversation, conversationsOverride }: ConversationsListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const promoterGroups = useChatStore((s) => s.promoterGroups);
  const groupsToRender = conversationsOverride ?? promoterGroups;
  const searchQuery = useChatStore((s) => s.searchQuery);
  const isLoading = useChatStore((s) => s.isLoading);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const setActivePromoter = useChatStore((s) => s.setActivePromoter);

  // Memoize filtered conversations to prevent infinite re-renders
  const filteredConversations = useMemo(() => {
    if (!searchQuery) {
      return groupsToRender;
    }
    const query = searchQuery.toLowerCase();
    return groupsToRender.filter((group) => {
      const name = group.promoter.influencerProfile?.displayName ||
                   group.promoter.promoterProfile?.name
      return name.toLowerCase().includes(query);
    });
  }, [groupsToRender, searchQuery]);

  const handleConversationClick = (group: PromoterGroup) => {
    setActivePromoter(group.promoterId);
    // Determine base path from current route, not from user roles
    // This keeps promoters on /promoter/messages/* and influencers on /influencer/messages/*
    const basePath = location.pathname.startsWith('/influencer/messages')
      ? `/influencer/messages/${group.promoterId}`
      : `/promoter/messages/${group.promoterId}`;
    navigate(basePath);
    // Close sidebar on mobile after selection
    onSelectConversation?.();
  };

  // Determine route type for avatar and search placeholder
  const isInfluencerRoute = location.pathname.startsWith('/influencer/messages');

  const getConversationName = (group: PromoterGroup) => {
    // On influencer route, show promoter name; on promoter route, show influencer name
    if (isInfluencerRoute) {
      return group.promoter.promoterProfile?.name || group.promoter.email;
    }
    return group.promoter.influencerProfile?.displayName || group.promoter.email;
  };

  const getConversationAvatar = (group: PromoterGroup) => {
    // On promoter route, we chat with influencers; on influencer route, we chat with promoters
    const role = isInfluencerRoute ? 'promoter' : 'influencer';
    return getAvatar(group.promoter, role);
  };

  const searchPlaceholder = isInfluencerRoute ? 'Search brands/agents...' : 'Search influencers...';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 px-6 py-4">
        <h2 className="text-xl font-semibold text-white mb-4">Messages</h2>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
          />
          <svg className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8FF00]"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-64 p-6 text-center">
            <div>
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-white font-semibold mb-1">No conversations yet</h3>
              <p className="text-gray-400 text-sm">
                {searchQuery ? 'Try a different search term' : 'Start collaborating to see messages here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="">
            {filteredConversations.map((group) => (
              <button
                key={group.promoterId}
                onClick={() => handleConversationClick(group)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors ${
                  activeConversationId === group.promoterId ? 'bg-[#00D9FF]/10 border-l-2 border-[#00D9FF]' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 relative">
                  <img
                    src={getConversationAvatar(group)}
                    alt={getConversationName(group)}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {/* Online indicator */}
                  {group.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f1a]"></span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white truncate">{getConversationName(group)}</p>
                </div>
                <p className="text-xs text-slate-400">
                  {group.proposalCount > 0
                    ? `proposals: ${group.proposalCount}`
                    : 'direct chat'
                  }
                </p>
              </div>

                {/* Unread badge */}
                {group.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-[#B8FF00] text-gray-900 text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {group.unreadCount > 9 ? '9+' : group.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
