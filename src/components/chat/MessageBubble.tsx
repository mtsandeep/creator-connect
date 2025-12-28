// ============================================
// MESSAGE BUBBLE COMPONENT
// ============================================

import { formatDistanceToNow } from 'date-fns';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  otherUserName?: string;
}

export default function MessageBubble({ message, isOwn, otherUserName }: MessageBubbleProps) {
  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`flex max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}
      >
        {/* Avatar placeholder */}
        {!isOwn && (
          <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-400">
              {otherUserName?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}

        {/* Message content */}
        <div
          className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${
            isOwn ? 'message-sent' : 'message-received'
          }`}
        >
          {/* Message bubble */}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwn
                ? 'bg-[#B8FF00] text-gray-900 rounded-br-md'
                : 'bg-white/10 text-white rounded-bl-md'
            }`}
          >
            {/* Text message */}
            {message.type === 'text' && message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {/* Image message */}
            {message.type === 'image' && message.attachmentUrl && (
              <div className="space-y-2">
                <img
                  src={message.attachmentUrl}
                  alt="Sent image"
                  className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(message.attachmentUrl, '_blank')}
                />
                {message.content && <p className="text-sm">{message.content}</p>}
              </div>
            )}

            {/* File message */}
            {message.type === 'file' && message.attachmentUrl && (
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <svg className="w-8 h-8 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{message.attachmentName}</p>
                  <p className="text-xs text-gray-400">Click to download</p>
                </div>
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            )}
          </div>

          {/* Timestamp and read status */}
          <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}>
            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
            {isOwn && (
              <span className={`text-xs ${message.read ? 'text-[#B8FF00]' : 'text-gray-500'}`}>
                {message.read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
