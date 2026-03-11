// ============================================
// DEMO: Link-in-Bio Flow - Step 3: Chat Conversation
// ============================================

import DemoLayout from '../../../components/demo/DemoLayout';
import { demoInfluencer, demoChatMessages } from '../../../data/demoData';

export default function LinkBioChat() {
  return (
    <DemoLayout
      flowId="linkbio"
      flowTitle="Link-in-Bio Discovery"
      currentStep={3}
      totalSteps={4}
      nextPath="/demo/linkbio/proposal"
      nextLabel="Send Proposal"
      prevPath="/demo/linkbio/profile"
      prevLabel="Back"
      perspective="brand"
    >
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Context */}
        <div className="bg-gradient-to-r from-[#00D9FF]/10 to-transparent rounded-xl p-5 border border-[#00D9FF]/20">
          <h2 className="text-lg font-bold text-white mb-1">
            Brand starts a conversation
          </h2>
          <p className="text-gray-400 text-sm">
            The brand was impressed by your profile. They click "Start Chat" to begin the conversation. This is where collaboration begins.
          </p>
        </div>

        {/* Chat Window */}
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
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {demoChatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.senderId === 'demo-brand-001' ? '' : 'flex-row-reverse'
                }`}
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
                    message.senderId === 'demo-brand-001'
                      ? 'bg-white/10 text-white'
                      : 'bg-[#00D9FF] text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-[10px] mt-1 ${
                    message.senderId === 'demo-brand-001' ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
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
              <button className="p-2 text-[#00D9FF]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-[#B8FF00]/10 border border-[#B8FF00]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">💡</span>
            <p className="text-sm text-gray-300">
              This is a demo - messages are simulated. In a real conversation, you would send proposals to share pricing details.
            </p>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
