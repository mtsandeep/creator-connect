// ============================================
// CHAT WINDOW COMPONENT
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useChatStore } from '../../stores/chatStore';
import { useMessages, useSendMessage, useMarkAsRead } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import FileUpload from './FileUpload';
import type { Message } from '../../types';

interface ChatWindowProps {
  proposalId: string;
  otherUserId: string;
  otherUserName?: string;
}

export default function ChatWindow({
  proposalId,
  otherUserId,
  otherUserName,
}: ChatWindowProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { messagesEndRef } = useMessages(proposalId);
  const { sendTextMessage, sendImageMessage, sendFileMessage } = useSendMessage();
  const { markConversationAsRead } = useMarkAsRead();

  const currentMessages = useChatStore((s) => s.currentMessages);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const isTyping = useChatStore((s) => s.isTyping);

  const [messageInput, setMessageInput] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (proposalId) {
      markConversationAsRead(proposalId);
    }
  }, [proposalId, markConversationAsRead]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending || !user?.uid) return;

    setIsSending(true);
    try {
      await sendTextMessage(proposalId, otherUserId, messageInput.trim());
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
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
      alert('Please select an image file');
      return;
    }

    setIsSending(true);
    try {
      await sendImageMessage(proposalId, otherUserId, file);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Failed to send image. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsSending(true);
    try {
      await sendFileMessage(proposalId, otherUserId, file);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/5 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Back"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-white font-semibold">{otherUserName || 'Conversation'}</h2>
            <p className="text-sm text-gray-400">Proposal Chat</p>
          </div>
        </div>
        <button
          onClick={() => {
            const basePath = user?.roles.includes('influencer')
              ? `/influencer/proposals/${proposalId}`
              : `/promoter/proposals/${proposalId}`;
            navigate(basePath);
          }}
          className="text-sm text-[#00D9FF] hover:text-[#00D9FF]/80 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Proposal
        </button>
      </div>

      {/* Messages */}
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
            className={`p-3 rounded-xl transition-colors ${
              showFileUpload ? 'bg-[#B8FF00] text-gray-900' : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#B8FF00] max-h-32"
              disabled={isSending}
              style={{ minHeight: '48px' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isSending}
            className={`p-3 rounded-xl transition-colors ${
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
