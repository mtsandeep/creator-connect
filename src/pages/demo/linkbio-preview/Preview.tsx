// ============================================
// DEMO: Link-in-Bio Preview - Standalone Profile View
// Shows what brands see when they click your link-in-bio
// ============================================

import { MessageCircle, FileText } from 'lucide-react';
import DemoLayout from '../../../components/demo/DemoLayout';
import DemoProfileCard from '../../../components/demo/DemoProfileCard';

const infoItems = [
  {
    icon: '1',
    title: 'Your Professional Profile',
    description: 'This is exactly what brands see when they click your link-in-bio. A complete showcase of your reach, terms, and pricing.',
  },
  {
    icon: '2',
    title: 'Transparent Pricing',
    description: 'Show your starting price and advance requirements upfront. No awkward negotiations - everything is clear from the start.',
  },
  {
    icon: '3',
    title: 'Direct Contact',
    description: 'Brands can send a proposal or start a chat directly from this page. Both lead to collaborations!',
  },
];

export default function LinkBioPreview() {
  const actionButtons = (
    <>
      <button className="flex items-center justify-center gap-2 py-3 bg-[#00D9FF] text-black text-sm font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all cursor-pointer">
        <FileText className="w-4 h-4" />
        Send Proposal
      </button>
      <button className="flex items-center justify-center gap-2 py-3 bg-white/5 text-white text-sm font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
        <MessageCircle className="w-4 h-4" />
        Start Chat
      </button>
    </>
  );

  return (
    <DemoLayout
      currentStep={1}
      totalSteps={1}
      perspective="influencer"
    >
      <DemoProfileCard
        infoBarText="This is what brands see when they visit your profile"
        infoItems={infoItems}
        actionButtons={actionButtons}
      />
    </DemoLayout>
  );
}
