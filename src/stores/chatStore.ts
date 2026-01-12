import { create } from 'zustand';
import type { Message, ChatConversation, User } from '../types';

// ============================================
// // TYPES
// ============================================

export interface PromoterGroup {
  promoterId: string;
  promoter: User;
  proposalCount: number;
  lastMessageTime?: number;
  unreadCount: number;
  conversations: ChatConversation[];
  isOnline?: boolean;
}

export interface ConversationTab {
  id: string; // 'direct' or proposalId or conversationId
  type: 'direct' | 'proposal';
  title: string;
  proposalId?: string;
  conversationId?: string; // For direct conversations AND proposal conversations (for fetching messages)
}

// ============================================
// CHAT STORE
// ============================================

interface ChatState {
  // Data
  conversations: ChatConversation[];
  currentMessages: Message[];
  activeConversationId: string | null;
  activePromoterId: string | null;
  activeTab: ConversationTab | null;
  promoterGroups: PromoterGroup[];
  unreadCount: number;

  // UI State
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  isTyping: boolean;
  searchQuery: string;

  // Actions
  setConversations: (conversations: ChatConversation[]) => void;
  setActiveConversation: (proposalId: string) => void;
  setActivePromoter: (promoterId: string, tab?: ConversationTab) => void;
  setActiveTab: (tab: ConversationTab) => void;
  setCurrentMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  markAsRead: (proposalId: string) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsTyping: (typing: boolean) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentMessages: [],
  activeConversationId: null,
  activePromoterId: null,
  activeTab: null,
  promoterGroups: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMessages: false,
  error: null,
  isTyping: false,
  searchQuery: '',

  setConversations: (conversations) => set(() => {
    // Group conversations by promoter
    const promoterMap = new Map<string, PromoterGroup>();

    conversations.forEach((conv) => {
      const promoterId = conv.otherUser.uid;
      const existing = promoterMap.get(promoterId);

      if (existing) {
        existing.conversations.push(conv);
        // Only count as proposal if it has a proposalId
        if (conv.proposalId) {
          existing.proposalCount += 1;
        }
        existing.unreadCount += conv.unreadCount;
        if (conv.lastMessage?.timestamp) {
          const msgTime = typeof conv.lastMessage.timestamp === 'number' 
            ? conv.lastMessage.timestamp 
            : new Date(conv.lastMessage.timestamp).getTime();
          if (!existing.lastMessageTime || msgTime > existing.lastMessageTime) {
            existing.lastMessageTime = msgTime;
          }
        }
      } else {
        // Determine which user details to show based on profile availability
        let promoterToShow: User;
        
        // Always use the other user's details for display (profile name and picture logic handled in UI)
        promoterToShow = conv.otherUser;

        promoterMap.set(promoterId, {
          promoterId,
          promoter: promoterToShow,
          proposalCount: conv.proposalId ? 1 : 0, // Only count as proposal if it has a proposalId
          lastMessageTime: conv.lastMessage?.timestamp
            ? (typeof conv.lastMessage.timestamp === 'number' 
              ? conv.lastMessage.timestamp 
              : new Date(conv.lastMessage.timestamp).getTime())
            : undefined,
          unreadCount: conv.unreadCount,
          conversations: [conv],
        });
      }
    });

    const promoterGroups = Array.from(promoterMap.values())
      .sort((a, b) => {
        // Sort by last message time (most recent first)
        const aTime = a.lastMessageTime || 0;
        const bTime = b.lastMessageTime || 0;
        return bTime - aTime;
      });

    return {
      conversations,
      promoterGroups,
      unreadCount: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    };
  }),

  setActiveConversation: (proposalId) => set({
    activeConversationId: proposalId,
    currentMessages: [],
  }),

  setActivePromoter: (promoterId, tab) => set((state) => {
    // Default to direct chat if no tab is explicitly provided
    let finalTab = tab;
    if (!finalTab) {
      finalTab = { id: 'direct', type: 'direct' as const, title: 'Direct Chat' };
    }

    // Only clear messages if switching to a different promoter
    const isSamePromoter = state.activePromoterId === promoterId;

    return {
      activePromoterId: promoterId,
      activeTab: finalTab,
      activeConversationId: finalTab.type === 'proposal' ? finalTab.proposalId : null,
      currentMessages: isSamePromoter ? state.currentMessages : [],
    };
  }),

  setActiveTab: (tab) => set({
    activeTab: tab,
    activeConversationId: tab.type === 'proposal' ? tab.proposalId : null,
    currentMessages: [],
  }),

  setCurrentMessages: (messages) => set({
    currentMessages: messages,
    isLoadingMessages: false,
  }),

  addMessage: (message) => set((state) => {
    // Add to current messages if matching conversation
    const newMessages =
      state.activeConversationId === message.proposalId
        ? [...state.currentMessages, message]
        : state.currentMessages;

    // Update conversation last message
    const newConversations = state.conversations.map((conv) => {
      if (conv.proposalId === message.proposalId) {
        return {
          ...conv,
          lastMessage: message,
          unreadCount:
            message.senderId !== 'current' && message.receiverId === 'current'
              ? conv.unreadCount + 1
              : conv.unreadCount,
        };
      }
      return conv;
    });

    return {
      currentMessages: newMessages,
      conversations: newConversations,
      unreadCount: newConversations.reduce((sum, c) => sum + c.unreadCount, 0),
    };
  }),

  updateMessage: (messageId, updates) => set((state) => ({
    currentMessages: state.currentMessages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ),
  })),

  markAsRead: (proposalId) => set((state) => ({
    conversations: state.conversations.map((conv) =>
      conv.proposalId === proposalId
        ? { ...conv, unreadCount: 0 }
        : conv
    ),
    unreadCount: state.conversations.reduce(
      (sum, c) => sum + (c.proposalId === proposalId ? 0 : c.unreadCount),
      0
    ),
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

  setError: (error) => set({ error }),

  setIsTyping: (isTyping) => set({ isTyping }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  reset: () => set({
    currentMessages: [],
    activeConversationId: null,
    activePromoterId: null,
    activeTab: null,
    isLoading: false,
    error: null,
    isTyping: false,
  }),
}));

// ============================================
// SELECTORS
// ============================================

export const selectFilteredPromoterGroups = (state: ChatState) => {
  if (!state.searchQuery) {
    return state.promoterGroups;
  }

  const query = state.searchQuery.toLowerCase();
  return state.promoterGroups.filter((group) => {
    const name = group.promoter.influencerProfile?.displayName ||
                 group.promoter.promoterProfile?.name ||
                 group.promoter.email;
    return name.toLowerCase().includes(query);
  });
};

export const selectActivePromoterGroup = (state: ChatState) => {
  return state.promoterGroups.find((g) => g.promoterId === state.activePromoterId);
};

export const selectConversationTabs = (state: ChatState) => {
  const activeGroup = state.promoterGroups.find((g) => g.promoterId === state.activePromoterId);
  if (!activeGroup) return [];

  const tabs: ConversationTab[] = [
    { id: 'direct', type: 'direct', title: 'Direct Chat' },
    ...activeGroup.conversations
      .filter((conv) => conv.proposalId && conv.proposal) // Only include conversations with proposals
      .map((conv) => ({
        id: conv.proposalId!,
        type: 'proposal' as const,
        title: conv.proposal!.title,
        proposalId: conv.proposalId!,
        conversationId: conv.conversationId, // Include conversationId for fetching messages
      })),
  ];

  return tabs;
};

export const selectFilteredConversations = (state: ChatState) => {
  if (!state.searchQuery) {
    return state.conversations;
  }

  const query = state.searchQuery.toLowerCase();
  return state.conversations.filter((conv) => {
    const name = conv.otherUser.influencerProfile?.displayName ||
                 conv.otherUser.promoterProfile?.name ||
                 conv.otherUser.email;
    const username = conv.otherUser.influencerProfile?.username || '';
    const proposalTitle = conv.proposal?.title || '';

    return (
      name.toLowerCase().includes(query) ||
      username.toLowerCase().includes(query) ||
      proposalTitle.toLowerCase().includes(query)
    );
  });
};

export const selectActiveConversation = (state: ChatState) => {
  return state.conversations.find((c) => c.proposalId === state.activeConversationId);
};

export const selectHasUnreadMessages = (state: ChatState) => state.unreadCount > 0;

// Helper hooks
export const useHasUnreadMessages = () => useChatStore(selectHasUnreadMessages);
export const useActiveConversation = () => useChatStore(selectActiveConversation);
