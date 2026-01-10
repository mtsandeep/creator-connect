// ============================================
// LINK-IN-BIO CHAT WINDOW (Simplified Header)
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useChatStore, type ConversationTab } from '../../stores/chatStore';
import { useMessages, useSendMessage, useMarkAsRead } from '../../hooks/useChat';
import { useInfluencerProposals } from '../../hooks/useInfluencerProposals';
import { LuArrowLeft, LuMessageCircle, LuFileText, LuEye, LuInfo } from 'react-icons/lu';
import MessageBubble from './MessageBubble';
import FileUpload from './FileUpload';
import Modal from '../common/Modal';

interface LinkInBioChatWindowProps {
  username: string;
  influencerId: string;
  influencerName: string;
  influencerImage?: string;
  onBack: () => void;
  conversationId: string;
}

export default function LinkInBioChatWindow({
  username,
  influencerId,
  influencerName,
  influencerImage,
  onBack,
  conversationId,
}: LinkInBioChatWindowProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const setActiveTab = useChatStore((s) => s.setActiveTab);

  const currentMessages = useChatStore((s) => s.currentMessages);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const isTyping = useChatStore((s) => s.isTyping);

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

  const { hasProposals, proposals } = useInfluencerProposals(influencerId);

  // Set up direct chat tab
  useEffect(() => {
    const directTab: ConversationTab = {
      id: 'direct',
      type: 'direct',
      title: 'Direct Chat',
      conversationId,
    };
    setActiveTab(directTab);
    // Set active promoter to this influencer
    useChatStore.getState().setActivePromoter(influencerId, directTab);
  }, [influencerId, conversationId, setActiveTab]);

  const { messagesEndRef } = useMessages(null, conversationId);
  const { sendTextMessage, sendImageMessage, sendFileMessage } = useSendMessage();
  const { markConversationAsRead } = useMarkAsRead();

  // Mark messages as read
  useEffect(() => {
    if (conversationId) {
      markConversationAsRead(conversationId, false);
    }
  }, [conversationId, markConversationAsRead]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending || !user?.uid) return;

    setIsSending(true);
    try {
      await sendTextMessage(
        conversationId,
        influencerId,
        messageInput.trim(),
        false, // not a proposal chat
        undefined // no proposalId
      );
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
      await sendImageMessage(
        conversationId,
        influencerId,
        file,
        false,
        undefined
      );
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
      await sendFileMessage(
        conversationId,
        influencerId,
        file,
        false,
        undefined
      );
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
    <div className="flex flex-col h-[100vh] max-w-3xl mx-auto w-full bg-[#0a0a0a]">
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

      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-white/10">
        {/* Top row: back, profile info, icon */}
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <LuArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 flex-1">
            <img
              src={influencerImage || '/default-avatar.png'}
              alt={influencerName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{influencerName}</p>
              <p className="text-gray-500 text-sm truncate">{username}</p>
            </div>
          </div>

          <LuMessageCircle className="w-5 h-5 text-[#00D9FF]" />
        </div>

        {/* Action row */}
        <div className="px-4 pb-3 flex justify-end gap-3">
          {hasProposals && (
            <button
              onClick={() => navigate('/promoter/proposals')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors font-medium"
            >
              <LuEye className="w-4 h-4" />
              View Proposals
            </button>
          )}
          <button
            onClick={() => navigate(`/link/${username}/proposal`)}
            className="flex items-center gap-2 text-sm text-[#B8FF00] hover:text-[#B8FF00]/80 transition-colors font-medium"
            >
              <LuFileText className="w-4 h-4" />
              Send New Proposal
            </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
                otherUserName={influencerName}
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
        <div className="px-4 pb-2">
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

      {/* Info bar when proposals exist */}
      {hasProposals && (
        <div className="my-2 px-4 py-3 bg-[#B8FF00]/10 border border-[#B8FF00]/20 rounded-xl flex items-start gap-3">
          <LuInfo className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-white text-sm">
              You have {proposals.length} active proposal{proposals.length > 1 ? 's' : ''} with {influencerName}. Use{' '}
              <button
                onClick={() => navigate('/promoter/proposals')}
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
      <div className="bg-white/5 border-t border-white/10 px-4 py-4">
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
