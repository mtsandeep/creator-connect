// ============================================
// DEMO: Brand Discover Flow - Step 4: Send Proposal
// ============================================

import * as Popover from '@radix-ui/react-popover';
import DemoLayout from '../../../components/demo/DemoLayout';
import DemoProposalCard from '../../../components/demo/DemoProposalCard';

const infoItems = [
  {
    icon: '1',
    title: 'Formal Proposal',
    description: 'After discussing collaboration details, the brand sends a formal proposal with deliverables, timeline, and payment terms.',
  },
  {
    icon: '2',
    title: 'Binding Agreement',
    description: 'Once accepted, this creates a clear agreement between both parties with documented expectations.',
  },
];

export default function BrandDiscoverProposal() {
  return (
    <DemoLayout
      currentStep={4}
      totalSteps={4}
      prevPath="/demo/brand-discover/chat"
      prevLabel="Back to Chat"
      perspective="brand"
    >
      {/* Slim Info Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70 font-medium">Brands send you formal proposals</span>
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

      {/* Proposal Card */}
      <DemoProposalCard accentColor="#B8FF00" />
    </DemoLayout>
  );
}
