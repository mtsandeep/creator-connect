// ============================================
// // CHAT WINDOW COMPONENT (with tabs)
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useChatStore, type ConversationTab } from '../../stores/chatStore';
import { useMessages, useSendMessage, useMarkAsRead, useDirectConversation } from '../../hooks/useChat';
import { HiUserGroup, HiXMark } from 'react-icons/hi2';
import MessageBubble from './MessageBubble';
import FileUpload from './FileUpload';
import Modal from '../common/Modal';
import type { Proposal } from '../../types';

interface ChatWindowProps {
  promoterId: string;
  otherUserId: string;
  otherUserName?: string;
  conversationId?: string; // For direct chat - the conversation ID
  directConversationId?: string; // Alias for conversationId for clarity
  onToggleSidebar?: () => void; // Callback to toggle sidebar on mobile
  isMobileSidebarOpen?: boolean;
}

export default function ChatWindow({
  promoterId,
  otherUserId,
  otherUserName,
  conversationId: propConversationId,
  directConversationId: propDirectConversationId,
  onToggleSidebar,
  isMobileSidebarOpen = false,
}: ChatWindowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Use a single selector to get all needed state at once
  const activePromoterId = useChatStore((s) => s.activePromoterId);
  const promoterGroups = useChatStore((s) => s.promoterGroups);
  const activeTab = useChatStore((s) => s.activeTab);
  const setActiveTab = useChatStore((s) => s.setActiveTab);

  const currentMessages = useChatStore((s) => s.currentMessages);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const isTyping = useChatStore((s) => s.isTyping);

  // State for direct conversation
  const [directConversationId, setDirectConversationId] = useState<string | null>(propDirectConversationId || null);
  const { getOrCreateDirectConversation } = useDirectConversation();

  // Update state when prop changes
  useEffect(() => {
    if (propDirectConversationId) {
      setDirectConversationId(propDirectConversationId);
    }
  }, [propDirectConversationId]);

  // Reset direct conversation ID when otherUserId changes (switching users)
  useEffect(() => {
    if (!propDirectConversationId) {
      setDirectConversationId(null);
    }
  }, [otherUserId, propDirectConversationId]);

  // Get conversationId from state (propConversationId is userId from profile, not a conversationId)
  const activeConversationId = activeTab?.conversationId || directConversationId;

  // For proposal chats, we need both proposalId AND conversationId
  // For direct chats, we only need conversationId
  const proposalIdForMessages = activeTab?.type === 'proposal' ? (activeTab?.proposalId ?? null) : null;
  const conversationIdForMessages = activeTab?.conversationId || directConversationId || null;

  const { messagesEndRef } = useMessages(proposalIdForMessages, conversationIdForMessages);
  const { sendTextMessage, sendImageMessage, sendFileMessage } = useSendMessage();
  const { markConversationAsRead } = useMarkAsRead();

  const [messageInput, setMessageInput] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });

  const showErrorModal = (title: string, message: string) => {
    setErrorModal({ open: true, title, message });
  };

  // Derive activePromoterGroup from state
  const activePromoterGroup = promoterGroups.find((g) => g.promoterId === activePromoterId);

  // Memoize conversationTabs to prevent infinite re-renders
  const conversationTabs: ConversationTab[] = useMemo(() => {
    if (!activePromoterGroup) return [];

    const tabs: ConversationTab[] = [
      { id: 'direct', type: 'direct', title: 'Direct Chat' },
    ];

    // Add proposal tabs
    activePromoterGroup.conversations.forEach((conv) => {
      if (conv.proposalId && conv.proposal) {
        tabs.push({
          id: conv.proposalId,
          type: 'proposal',
          title: conv.proposal.title,
          proposalId: conv.proposalId,
          conversationId: conv.conversationId, // Include conversationId for fetching messages
        });
      }
    });

    return tabs;
    // Only depend on activePromoterGroup, not on the whole array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePromoterId, activePromoterGroup?.conversations]);

  // Auto-create direct conversation when:
  // 1. Direct tab is selected, OR
  // 2. propConversationId is provided (direct chat from profile)
  useEffect(() => {
    const shouldCreateDirect =
      (activeTab?.type === 'direct' || (propConversationId && !activeTab)) &&
      !directConversationId &&
      otherUserId;

    if (shouldCreateDirect) {
      getOrCreateDirectConversation(otherUserId)
        .then((convId) => {
          setDirectConversationId(convId);
        })
        .catch((err) => {
          console.error('Failed to create direct conversation:', err);
        });
    }
  }, [activeTab, propConversationId, otherUserId, directConversationId, getOrCreateDirectConversation]);

  // Default to first proposal tab if available, otherwise direct chat
  useEffect(() => {
    if (!activeTab && conversationTabs.length > 0) {
      // Prefer proposal tabs over direct chat
      const firstProposalTab = conversationTabs.find(t => t.type === 'proposal');
      const defaultTab = firstProposalTab || conversationTabs[0];
      setActiveTab(defaultTab);
    }
  }, [activeTab, conversationTabs.length, setActiveTab]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    const conversationId = activeTab?.conversationId || directConversationId;
    if (conversationId && activeTab) {
      markConversationAsRead(conversationId, activeTab.type === 'proposal');
    }
  }, [activeTab, directConversationId, markConversationAsRead]);

  // Get current proposal for the Related Proposal box
  const currentProposal = activePromoterGroup?.conversations.find(
    (c) => c.proposalId === activeTab?.proposalId
  )?.proposal;

  const getProposalStatusColor = (proposal: Proposal) => {
    if (proposal.workStatus === 'approved') return 'text-green-400';
    if (proposal.workStatus === 'submitted') return 'text-[#00D9FF]';
    if (proposal.workStatus === 'in_progress') return 'text-[#B8FF00]';
    if (proposal.workStatus === 'disputed') return 'text-orange-400';
    if (proposal.proposalStatus === 'created') return 'text-yellow-400';
    if (proposal.proposalStatus === 'discussing') return 'text-blue-400';
    if (proposal.proposalStatus === 'changes_requested') return 'text-orange-400';
    if (proposal.proposalStatus === 'agreed') return 'text-purple-400';
    if (proposal.proposalStatus === 'cancelled') return 'text-gray-400';
    return 'text-slate-400';
  };

  const getProposalStatusLabel = (proposal: Proposal) => {
    if (proposal.workStatus === 'approved') return 'completed';
    if (proposal.workStatus === 'submitted') return 'submitted';
    if (proposal.workStatus === 'in_progress') return 'in progress';
    if (proposal.workStatus === 'disputed') return 'disputed';
    return proposal.proposalStatus.replace('_', ' ');
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending || !user?.uid) return;

    setIsSending(true);
    try {
      const isProposalChat = activeTab?.type === 'proposal';
      const proposalId = activeTab?.proposalId;

      let targetConversationId = activeTab?.conversationId || activeConversationId;

      // For direct chats, create conversation if it doesn't exist
      if (activeTab?.type === 'direct' && !targetConversationId) {
        const convId = await getOrCreateDirectConversation(otherUserId);
        setDirectConversationId(convId);
        targetConversationId = convId;
      }

      if (targetConversationId) {
        await sendTextMessage(
          targetConversationId,
          otherUserId,
          messageInput.trim(),
          isProposalChat,
          proposalId
        );
      }

      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorModal('Message failed', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showErrorModal('Invalid file', 'Please select an image file.');
      return;
    }

    setIsSending(true);
    try {
      const isProposalChat = activeTab?.type === 'proposal';
      const proposalId = activeTab?.proposalId;

      let targetConversationId = activeTab?.conversationId || activeConversationId;

      // For direct chats, create conversation if it doesn't exist
      if (activeTab?.type === 'direct' && !targetConversationId) {
        const convId = await getOrCreateDirectConversation(otherUserId);
        setDirectConversationId(convId);
        targetConversationId = convId;
      }

      if (targetConversationId) {
        await sendImageMessage(
          targetConversationId,
          otherUserId,
          file,
          isProposalChat, // true for proposal chats, false for direct chats
          proposalId // proposalId for proposal chats
        );
      }
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error sending image:', error);
      showErrorModal('Upload failed', 'Failed to send image. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsSending(true);
    try {
      const isProposalChat = activeTab?.type === 'proposal';
      const proposalId = activeTab?.proposalId;

      let targetConversationId = activeTab?.conversationId || activeConversationId;

      // For direct chats, create conversation if it doesn't exist
      if (activeTab?.type === 'direct' && !targetConversationId) {
        const convId = await getOrCreateDirectConversation(otherUserId);
        setDirectConversationId(convId);
        targetConversationId = convId;
      }

      if (targetConversationId) {
        await sendFileMessage(
          targetConversationId,
          otherUserId,
          file,
          isProposalChat, // true for proposal chats, false for direct chats
          proposalId // proposalId for proposal chats
        );
      }
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error sending file:', error);
      showErrorModal('Upload failed', 'Failed to send file. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-[100vh]">
      <Modal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, title: '', message: '' })}
        title={errorModal.title}
        footer={
          <button
            onClick={() => setErrorModal({ open: false, title: '', message: '' })}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        }
      >
        <p className="text-gray-400 text-sm">{errorModal.message}</p>
      </Modal>

      {/* Header with promoter info and tabs */}
      <div className="bg-[#0a0a0a] border-b border-white/5">
        {/* Promoter info row */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle button - badge style */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden -ml-6 pl-3 pr-3 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 rounded-r-lg border-l-0 transition-all flex items-center gap-2"
              title="Toggle conversations"
            >
              {isMobileSidebarOpen ? (
                <HiXMark className="w-4 h-4" />
              ) : (
                <HiUserGroup className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">Chats</span>
            </button>
            <div>
              <h2 className="text-white font-semibold">{otherUserName || 'Conversation'}</h2>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Use current route to determine where to go
              const basePath = location.pathname.startsWith('/influencer')
                ? `/influencer/proposals`
                : `/promoter/proposals`;
              navigate(basePath);
            }}
            className="text-sm text-[#00D9FF] hover:text-[#00D9FF]/80 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Proposals
          </button>
        </div>

        {/* Conversation tabs */}
        <div className="px-6 flex gap-2 border-t border-white/5">
          {conversationTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                // Only update URL - the URL effect in Messages.tsx will handle setting the active tab
                // This prevents race conditions and double state updates
                const basePath = location.pathname.startsWith('/influencer')
                  ? `/influencer/messages/${promoterId}`
                  : `/promoter/messages/${promoterId}`;
                const url = tab.type === 'proposal' && tab.proposalId
                  ? `${basePath}/${tab.proposalId}`
                  : basePath;
                navigate(url);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
                activeTab?.id === tab.id
                  ? tab.type === 'direct'
                    ? 'bg-white/5 text-white border border-white/10'
                    : 'bg-[#00D9FF]/20 text-[#00D9FF] border-t-2 border-[#00D9FF]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.type === 'direct' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
              {tab.title}
            </button>
          ))}
        </div>
      </div>

      {/* Related Proposal Box (only show for proposal tabs) */}
      {activeTab?.type === 'proposal' && currentProposal && (
        <div className="mx-6 mt-4 bg-gradient-to-r from-[#00D9FF]/10 to-[#B8FF00]/10 border border-[#00D9FF]/20 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#00D9FF]/20 rounded-lg">
                <svg className="w-5 h-5 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{currentProposal.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">
                    Status:{' '}
                    <span className={getProposalStatusColor(currentProposal)}>
                      {getProposalStatusLabel(currentProposal)}
                    </span>
                  </span>
                  {currentProposal.deadline && (
                    <span className="text-xs text-slate-400">
                      Due: {new Date(currentProposal.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                const basePath = location.pathname.startsWith('/influencer')
                  ? `/influencer/proposals/${activeTab.proposalId}`
                  : `/promoter/proposals/${activeTab.proposalId}`;
                navigate(basePath);
              }}
              className="px-3 py-1.5 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black text-xs font-semibold rounded-lg transition"
            >
              View Proposal
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8FF00]"></div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-400">No messages yet</p>
              <p className="text-gray-500 text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {currentMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user.uid}
                otherUserName={otherUserName}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
          </>
        )}
      </div>

      {/* File upload area */}
      {showFileUpload && (
        <div className="px-6 pb-2">
          <FileUpload
            onFileSelect={(file) => {
              if (file.type.startsWith('image/')) {
                handleImageSelect(file);
              } else {
                handleFileSelect(file);
              }
            }}
            accept="image/*,.pdf,.doc,.docx,.txt"
            disabled={isSending}
          />
        </div>
      )}

      {/* Input area */}
      <div className="bg-white/5 border-t border-white/10 px-6 py-4">
        <div className="flex items-end gap-3">
          {/* Attachment button */}
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
              showFileUpload ? 'bg-[#B8FF00] text-gray-900' : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Message input */}
          <div className="flex flex-1 relative">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#B8FF00] max-h-32"
              disabled={isSending}
              style={{ minHeight: '40px' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isSending}
            className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
              messageInput.trim() && !isSending
                ? 'bg-[#B8FF00] text-gray-900'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
            title="Send message"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
