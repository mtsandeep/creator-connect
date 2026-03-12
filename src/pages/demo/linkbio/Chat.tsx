// ============================================
// DEMO: Link-in-Bio Flow - Step 3: Chat Conversation
// ============================================

import * as Popover from '@radix-ui/react-popover';
import DemoLayout from '../../../components/demo/DemoLayout';
import { demoInfluencer, demoChatMessages } from '../../../data/demoData';

const infoItems = [
  {
    icon: '1',
    title: 'Brand Starts a Conversation',
    description: 'The brand was impressed by your profile. They click "Start Chat" to begin the conversation. This is where collaboration begins.',
  },
  {
    icon: '2',
    title: 'Messages Are Saved',
    description: 'No pressure to respond instantly. Messages are saved so you can reply when convenient.',
  },
];

export default function LinkBioChat() {
  return (
    <DemoLayout
      currentStep={3}
      totalSteps={4}
      nextPath="/demo/linkbio/proposal"
      nextLabel="Send Proposal"
      prevPath="/demo/linkbio/profile"
      prevLabel="Back"
      perspective="brand"
    >
      {/* Slim Info Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70 font-medium">Brands can chat with you directly</span>
          <div className="flex items-center gap-1">
            {infoItems.map((item, index) => (
              <Popover.Root key={index}>
                <Popover.Trigger asChild>
                  <button className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 text-[11px] font-semibold leading-none text-white transition-all data-[state=open]:bg-white/30 data-[state=open]:border-white/40 cursor-pointer">
                    {item.icon}
                  </button>
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Content
                    className="w-72 p-3 bg-gray-800 rounded-xl border border-white/10 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={8}
                    side="bottom"
                  >
                    <Popover.Arrow className="fill-gray-800" width={12} height={8} />
                    <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            ))}
          </div>
        </div>
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
    </DemoLayout>
  );
}
