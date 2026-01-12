// ============================================
// MESSAGE BUBBLE COMPONENT
// ============================================

import { formatDistanceToNow } from 'date-fns';
import { LuDownload, LuFile } from 'react-icons/lu';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  otherUserName?: string;
  otherUserAvatarUrl?: string | null;
  myAvatarUrl?: string | null;
}

export default function MessageBubble({ message, isOwn, otherUserName, otherUserAvatarUrl, myAvatarUrl }: MessageBubbleProps) {
  const formatTime = (timestamp: number) => {
    // Ensure timestamp is a valid number, fallback to current time if not
    const validTimestamp = timestamp && typeof timestamp === 'number' && timestamp > 0 ? timestamp : Date.now();
    return formatDistanceToNow(new Date(validTimestamp), { addSuffix: true });
  };

  const getDicebearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || 'User')}`;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className="flex max-w-[80%] flex-row items-end gap-2"
      >
        {!isOwn ? (
          otherUserAvatarUrl ? (
            <img
              src={otherUserAvatarUrl}
              alt="User"
              className="flex-shrink-0 w-8 h-8 rounded-full object-cover bg-white/10 border border-white/10"
              onError={(e) => {
                e.currentTarget.src = getDicebearAvatar(otherUserName || 'User');
              }}
            />
          ) : (
            <div className="flex-shrink-0 w-8 h-8 bg-white/10 border border-white/10 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-400">{otherUserName?.[0]?.toUpperCase() || '?'}</span>
            </div>
          )
        ) : null}

        {/* Message content */}
        <div
          className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${
            isOwn ? 'message-sent' : 'message-received'
          }`}
        >
          {/* Message bubble */}
          <div
            className={`px-4 py-2 rounded-xl ${
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
                <LuFile className="w-8 h-8 text-gray-400 flex-shrink-0" />
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
                  <LuDownload className="w-5 h-5 text-gray-400" />
                </a>
              </div>
            )}
          </div>

          {/* Timestamp and read status */}
          <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}>
            <span
              className="text-xs text-gray-500 cursor-default"
              title={new Date(message.timestamp && message.timestamp > 0 ? message.timestamp : Date.now()).toLocaleString()}
            >
              {formatTime(message.timestamp)}
            </span>
            {isOwn && (
              <span className={`text-xs ${message.read ? 'text-[#B8FF00]' : 'text-gray-500'}`}>
                {message.read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>

        {isOwn ? (
          myAvatarUrl ? (
            <img
              src={myAvatarUrl}
              alt="You"
              className="flex-shrink-0 w-8 h-8 rounded-full object-cover bg-[#B8FF00] border border-[#B8FF00]/30"
              onError={(e) => {
                e.currentTarget.src = getDicebearAvatar('You');
              }}
            />
          ) : (
            <div className="flex-shrink-0 w-8 h-8 bg-[#B8FF00] border border-[#B8FF00]/30 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-900">Y</span>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
