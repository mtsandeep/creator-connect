import { create } from 'zustand';
import type { Message, Conversation } from '../types';

// ============================================
// CHAT STORE
// ============================================

interface ChatState {
  // Data
  conversations: Conversation[];
  currentMessages: Message[];
  activeConversationId: string | null;
  unreadCount: number;

  // UI State
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  isTyping: boolean;
  searchQuery: string;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (proposalId: string) => void;
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
  unreadCount: 0,
  isLoading: false,
  isLoadingMessages: false,
  error: null,
  isTyping: false,
  searchQuery: '',

  setConversations: (conversations) => set({
    conversations,
    unreadCount: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
  }),

  setActiveConversation: (proposalId) => set({
    activeConversationId: proposalId,
    currentMessages: [],
    isLoadingMessages: true,
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
    isLoading: false,
    error: null,
    isTyping: false,
  }),
}));

// ============================================
// SELECTORS
// ============================================

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
    const proposalTitle = conv.proposal.title;

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
