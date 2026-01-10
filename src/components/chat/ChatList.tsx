// ============================================
// CHAT LIST COMPONENT
// ============================================

import { useNavigate } from 'react-router-dom';
import { useChatStore, selectFilteredConversations } from '../../stores/chatStore';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  activeProposalId?: string;
}

export default function ChatList({ activeProposalId }: ChatListProps) {
  const navigate = useNavigate();
  const conversations = useChatStore(selectFilteredConversations);
  const isLoading = useChatStore((s) => s.isLoading);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);

  const handleConversationClick = (proposalId: string) => {
    navigate(`/messages/${proposalId}`);
  };

  const getUserName = (conversation: any) => {
    const { otherUser } = conversation;
    if (otherUser.influencerProfile) {
      return otherUser.influencerProfile.displayName;
    }
    if (otherUser.promoterProfile) {
      return otherUser.promoterProfile.name;
    }
    return otherUser.email;
  };

  const getUserAvatar = (conversation: any) => {
    const { otherUser } = conversation;
    if (otherUser.influencerProfile) {
      return otherUser.influencerProfile.profileImage;
    }
    if (otherUser.promoterProfile) {
      return otherUser.promoterProfile.logo;
    }
    return `https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(conversation)}`;
  };

  const formatLastMessage = (message: any) => {
    if (message.type === 'image') return '📷 Image';
    if (message.type === 'file') return `📎 ${message.attachmentName}`;
    return message.content;
  };

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
            placeholder="Search conversations..."
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
        ) : conversations.length === 0 ? (
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
          <div className="divide-y divide-white/5">
            {conversations.map((conversation) => (
              <button
                key={conversation.proposalId}
                onClick={() => conversation.proposalId && handleConversationClick(conversation.proposalId)}
                className={`w-full px-6 py-4 flex items-start gap-4 hover:bg-white/5 transition-colors ${
                  activeProposalId === conversation.proposalId ? 'bg-white/5' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 relative">
                  <img
                    src={getUserAvatar(conversation)}
                    alt={getUserName(conversation)}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(conversation)}`;
                    }}
                  />
                  {conversation.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B8FF00] text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  {/* Name and time */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-medium truncate">{getUserName(conversation)}</h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatDistanceToNow(
                          new Date(conversation.lastMessage.timestamp),
                          { addSuffix: true }
                        )}
                      </span>
                    )}
                  </div>

                  {/* Proposal title */}
                  <p className="text-sm text-gray-400 truncate mb-1">
                    {conversation.proposal?.title}
                  </p>

                  {/* Last message */}
                  {conversation.lastMessage ? (
                    <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                      {formatLastMessage(conversation.lastMessage)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">No messages yet</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
