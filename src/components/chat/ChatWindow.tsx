// ============================================
// // CHAT WINDOW COMPONENT (with tabs)
// ============================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../../stores';
import { useChatStore } from '../../stores/chatStore';
import { useMessages, useSendMessage, useMarkAsRead, useDirectConversation } from '../../hooks/useChat';
import { useMessagePermissions } from '../../hooks/useMessagePermissions';
import { HiUserGroup, HiXMark } from 'react-icons/hi2';
import { LuEye, LuFileText, LuInfo, LuMessageCircle, LuPaperclip, LuSend } from 'react-icons/lu';
import MessageBubble from './MessageBubble';
import FileUpload from './FileUpload';
import Modal from '../common/Modal';
import { db } from '../../lib/firebase';

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
  promoterId: _promoterId,
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

  const [otherUserAvatarUrl, setOtherUserAvatarUrl] = useState<string | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);

  const composerRef = useRef<HTMLTextAreaElement | null>(null);

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

  const proposalIdForMessages = null;
  const conversationIdForMessages = directConversationId || null;

  const { messagesEndRef } = useMessages(proposalIdForMessages, conversationIdForMessages);
  const { sendTextMessage, sendImageMessage, sendFileMessage } = useSendMessage();
  const { markConversationAsRead } = useMarkAsRead();
  const { canSendMessage } = useMessagePermissions();

  const [messageInput, setMessageInput] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    if (!user?.uid || !otherUserId) return;

    const loadAvatars = async () => {
      try {
        const [otherSnap, mySnap] = await Promise.all([
          getDoc(doc(db, 'users', otherUserId)),
          getDoc(doc(db, 'users', user.uid)),
        ]);

        const otherData: any = otherSnap.exists() ? otherSnap.data() : null;
        const myData: any = mySnap.exists() ? mySnap.data() : null;

        const otherAvatar =
          (typeof otherData?.influencerProfile?.profileImage === 'string' && otherData.influencerProfile.profileImage) ||
          (typeof otherData?.promoterProfile?.logo === 'string' && otherData.promoterProfile.logo) ||
          null;

        const mineAvatar =
          (typeof myData?.influencerProfile?.profileImage === 'string' && myData.influencerProfile.profileImage) ||
          (typeof myData?.promoterProfile?.logo === 'string' && myData.promoterProfile.logo) ||
          null;

        setOtherUserAvatarUrl(otherAvatar);
        setMyAvatarUrl(mineAvatar);
      } catch (err) {
        setOtherUserAvatarUrl(null);
        setMyAvatarUrl(null);
      }
    };

    void loadAvatars();
  }, [otherUserId, user?.uid]);

  const showErrorModal = (title: string, message: string) => {
    setErrorModal({ open: true, title, message });
  };

  // Derive activePromoterGroup from state
  const activePromoterGroup = promoterGroups.find((g) => g.promoterId === activePromoterId);

  const existingDirectConversationId = useMemo(() => {
    if (!activePromoterGroup) return null;
    const directConv = activePromoterGroup.conversations.find((c) => !c.proposalId);
    return directConv?.conversationId || null;
  }, [activePromoterGroup]);

  const hasProposals = useMemo(() => {
    return !!activePromoterGroup?.conversations.some((c) => !!c.proposalId);
  }, [activePromoterGroup]);

  // Prefer an existing direct conversation from store instead of creating a new one
  useEffect(() => {
    if (!directConversationId && existingDirectConversationId) {
      setDirectConversationId(existingDirectConversationId);
    }
  }, [directConversationId, existingDirectConversationId]);

  // Auto-create direct conversation when:
  // 1. Direct tab is selected, OR
  // 2. propConversationId is provided (direct chat from profile)
  useEffect(() => {
    const shouldCreateDirect =
      (activeTab?.type === 'direct' || (propConversationId && !activeTab)) &&
      !directConversationId &&
      otherUserId;

    if (shouldCreateDirect) {
      // Only promoters should create direct conversations
      if (location.pathname.startsWith('/promoter') && user?.roles?.includes('promoter')) {
        getOrCreateDirectConversation(otherUserId)
          .then((convId) => {
            setDirectConversationId(convId);
          })
          .catch((err) => {
            console.error('Failed to create direct conversation:', err);
          });
      }
    }
  }, [activeTab, propConversationId, otherUserId, directConversationId, getOrCreateDirectConversation, location.pathname, user?.roles]);

  useEffect(() => {
    if (!activePromoterGroup) return;
    if (activeTab?.type === 'direct') return;
    setActiveTab({ id: 'direct', type: 'direct', title: 'Direct Chat' });
  }, [activePromoterGroup, setActiveTab, activeTab?.type]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    const conversationId = activeTab?.conversationId || directConversationId;
    if (conversationId && activeTab) {
      markConversationAsRead(conversationId, false);
    }
  }, [activeTab, directConversationId, markConversationAsRead]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending || !user?.uid) return;

    // Prevent sending messages to oneself
    if (user.uid === otherUserId) {
      showErrorModal('Cannot Send Message', 'You cannot send messages to yourself');
      return;
    }

    setIsSending(true);
    try {
      // Check permissions for direct messages
      if (activeTab?.type === 'direct') {
        const permission = await canSendMessage(otherUserId);
        if (!permission.can) {
          showErrorModal('Permission Denied', permission.reason || 'You cannot send a message to this user');
          return;
        }
      }

      let targetConversationId = activeTab?.conversationId || activeConversationId;

      // For direct chats, create conversation if it doesn't exist
      if (activeTab?.type === 'direct' && !targetConversationId) {
        if (!location.pathname.startsWith('/promoter') || !user?.roles?.includes('promoter')) {
          showErrorModal('Cannot Start Conversation', 'Only promoters can start new direct conversations.');
          return;
        }
        const convId = await getOrCreateDirectConversation(otherUserId);
        setDirectConversationId(convId);
        targetConversationId = convId;
      }

      if (targetConversationId) {
        await sendTextMessage(
          targetConversationId,
          otherUserId,
          messageInput.trim(),
          false,
          undefined
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;

    el.style.height = 'auto';

    const maxPx = 160;
    const next = Math.min(el.scrollHeight, maxPx);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxPx ? 'auto' : 'hidden';
  }, [messageInput]);

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showErrorModal('Invalid file', 'Please select an image file.');
      return;
    }

    // Prevent sending files to oneself
    if (user?.uid === otherUserId) {
      showErrorModal('Cannot Send Message', 'You cannot send messages to yourself');
      return;
    }

    setIsSending(true);
    try {
      // Check permissions for direct messages
      if (activeTab?.type === 'direct') {
        const permission = await canSendMessage(otherUserId);
        if (!permission.can) {
          showErrorModal('Permission Denied', permission.reason || 'You cannot send a message to this user');
          return;
        }
      }

      let targetConversationId = activeTab?.conversationId || activeConversationId;

      // For direct chats, create conversation if it doesn't exist
      if (activeTab?.type === 'direct' && !targetConversationId) {
        if (!location.pathname.startsWith('/promoter') || !user?.roles?.includes('promoter')) {
          showErrorModal('Cannot Start Conversation', 'Only promoters can start new direct conversations.');
          return;
        }
        const convId = await getOrCreateDirectConversation(otherUserId);
        setDirectConversationId(convId);
        targetConversationId = convId;
      }

      if (targetConversationId) {
        await sendImageMessage(
          targetConversationId,
          otherUserId,
          file,
          false,
          undefined
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
      // Check permissions for direct messages
      if (activeTab?.type === 'direct') {
        const permission = await canSendMessage(otherUserId);
        if (!permission.can) {
          showErrorModal('Permission Denied', permission.reason || 'You cannot send a message to this user');
          return;
        }
      }

      let targetConversationId = activeTab?.conversationId || activeConversationId;

      // For direct chats, create conversation if it doesn't exist
      if (activeTab?.type === 'direct' && !targetConversationId) {
        if (!location.pathname.startsWith('/promoter') || !user?.roles?.includes('promoter')) {
          showErrorModal('Cannot Start Conversation', 'Only promoters can start new direct conversations.');
          return;
        }
        const convId = await getOrCreateDirectConversation(otherUserId);
        setDirectConversationId(convId);
        targetConversationId = convId;
      }

      if (targetConversationId) {
        await sendFileMessage(
          targetConversationId,
          otherUserId,
          file,
          false,
          undefined
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
          <div className="flex justify-end gap-3">
            {hasProposals ? (
              <button
                onClick={() => {
                  // Use current route to determine where to go
                  const basePath = location.pathname.startsWith('/influencer')
                    ? `/influencer/proposals`
                    : `/promoter/proposals`;
                  navigate(basePath);
                }}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                <LuEye className="w-4 h-4" />
                View Proposals
              </button>
            ) : null}
            {location.pathname.startsWith('/promoter') && (
              <button
                onClick={() => {
                  // Navigate to create new proposal (only for promoters)
                  navigate('/promoter/proposals/create');
                }}
                className="flex items-center gap-2 text-sm text-[#B8FF00] hover:text-[#B8FF00]/80 transition-colors"
              >
                <LuFileText className="w-4 h-4" />
                Send New Proposal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8FF00]"></div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <LuMessageCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
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
                otherUserAvatarUrl={otherUserAvatarUrl}
                myAvatarUrl={myAvatarUrl}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-white/10 px-4 py-3 rounded-xl rounded-bl-md">
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

      {/* Info bar when proposals exist - only for direct chat */}
      {activeTab?.type === 'direct' && activePromoterGroup && activePromoterGroup.conversations.filter(c => c.proposalId).length > 0 && (
        <div className="mx-6 mb-2 px-4 py-3 bg-[#B8FF00]/10 border border-[#B8FF00]/20 rounded-xl flex items-start gap-3">
          <LuInfo className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-white text-sm">
              You have {activePromoterGroup.conversations.filter(c => c.proposalId).length} active proposal{activePromoterGroup.conversations.filter(c => c.proposalId).length > 1 ? 's' : ''} with {otherUserName || 'this influencer'}. Use{' '}
              <button
                onClick={() => {
                  const basePath = location.pathname.startsWith('/influencer')
                    ? `/influencer/proposals`
                    : `/promoter/proposals`;
                  navigate(basePath);
                }}
                className="text-[#B8FF00] hover:text-[#B8FF00]/80 font-medium underline"
              >
                proposal chat
              </button>
              {' '}to keep conversations organized.
            </p>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white/5 border-t border-white/10 p-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          {/* Attachment button */}
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${showFileUpload ? 'bg-[#B8FF00] text-gray-900' : 'text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer'
              }`}
            title="Attach file"
          >
            <LuPaperclip className="w-5 h-5" />
          </button>

          {/* Message input */}
          <textarea
            ref={composerRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="w-full bg-transparent border-0 px-2 py-2 text-white placeholder-gray-500 resize-none focus:outline-none overflow-y-auto"
            disabled={isSending}
            style={{ minHeight: '40px' }}
          />

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isSending}
            className={`p-2 rounded-lg cursor-pointer transition-colors flex-shrink-0 ${messageInput.trim() && !isSending
                ? 'bg-[#B8FF00] text-gray-900'
                : 'text-gray-500 cursor-not-allowed'
              }`}
            title="Send message"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            ) : (
              <LuSend className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto] gap-2 mt-1">
          <p className="text-[11px] text-gray-500 pl-2">Press Enter to send, Shift + Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
