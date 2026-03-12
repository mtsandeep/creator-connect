// ============================================
// DEMO: Brand Discover Flow - Step 3: Chat
// ============================================

import * as Popover from '@radix-ui/react-popover';
import DemoLayout from '../../../components/demo/DemoLayout';
import DemoChatWindow from '../../../components/demo/DemoChatWindow';

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

export default function BrandDiscoverChat() {
  return (
    <DemoLayout
      currentStep={3}
      totalSteps={4}
      nextPath="/demo/brand-discover/proposal"
      nextLabel="Send Proposal"
      prevPath="/demo/brand-discover/profile"
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
      <DemoChatWindow brandColor="#B8FF00" />
    </DemoLayout>
  );
}
