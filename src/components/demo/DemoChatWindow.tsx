// ============================================
// DEMO CHAT WINDOW COMPONENT
// Reusable chat UI for demo flows
// ============================================

import { demoInfluencer, demoBrand, demoChatMessages } from '../../data/demoData';

interface DemoChatWindowProps {
  /** Which side the brand messages appear on. Default: left */
  brandPosition?: 'left' | 'right';
  /** Accent color for brand messages */
  brandColor?: string;
  /** Height of the messages area */
  height?: string;
}

export default function DemoChatWindow({
  brandPosition = 'left',
  brandColor = '#00D9FF',
  height = '400px',
}: DemoChatWindowProps) {
  const brandOnLeft = brandPosition === 'left';

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="w-10" />
        <div className="flex items-center gap-3">
          <img
            src={demoInfluencer.profileImage}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="text-white font-semibold text-sm">
              {demoInfluencer.displayName}
            </h3>
            <p className="text-gray-500 text-xs">@{demoInfluencer.username}</p>
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* Messages */}
      <div className={`h-[${height}] overflow-y-auto p-4 space-y-4`} style={{ height }}>
        {demoChatMessages.map((message) => {
          const isBrand = message.senderId === 'demo-brand-001';
          const showOnLeft = isBrand ? brandOnLeft : !brandOnLeft;

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${showOnLeft ? '' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <img
                src={message.senderAvatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />

              {/* Message Bubble */}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  isBrand
                    ? brandOnLeft
                      ? 'bg-white/10 text-white'
                      : `text-gray-900`
                    : brandOnLeft
                      ? `text-gray-900`
                      : 'bg-white/10 text-white'
                }`}
                style={isBrand ? (!brandOnLeft ? { backgroundColor: brandColor } : {}) : (brandOnLeft ? { backgroundColor: brandColor } : {})}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-[10px] mt-1 ${
                  (isBrand && brandOnLeft) || (!isBrand && !brandOnLeft)
                    ? 'text-gray-400'
                    : 'text-gray-700'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
            disabled
          />
          <button className="p-2" style={{ color: brandColor }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
