// ============================================
// DEMO: Link-in-Bio Flow - Step 4: Send Proposal
// ============================================

import { Calendar, FileText, CheckCircle, IndianRupee } from 'lucide-react';
import DemoLayout from '../../../components/demo/DemoLayout';
import { demoInfluencer, demoProposal } from '../../../data/demoData';

export default function LinkBioProposal() {
  const influencer = demoInfluencer;
  const proposal = demoProposal;

  return (
    <DemoLayout
      flowId="linkbio"
      flowTitle="Link-in-Bio Discovery"
      currentStep={4}
      totalSteps={4}
      nextLabel="View Full Proposal"
      prevPath="/demo/linkbio/chat"
      prevLabel="Back to Chat"
      perspective="brand"
    >
      <div className="space-y-5 max-w-lg mx-auto">
        {/* Context */}
        <div className="bg-gradient-to-r from-[#B8FF00]/10 to-transparent rounded-xl p-5 border border-[#B8FF00]/20">
          <h2 className="text-lg font-bold text-white mb-1">
            Brand sends a proposal
          </h2>
          <p className="text-gray-400 text-sm">
            After discussing collaboration details, the brand sends a formal proposal with deliverables, timeline, and payment terms. This creates a legally binding agreement.
          </p>
        </div>

        {/* Proposal Card */}
        <div data-tour="proposal-header" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
            <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-400 text-sm">
                To: <span className="text-[#00D9FF] font-medium">{influencer.displayName}</span>
              </p>
              <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">
                Awaiting Response
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#00D9FF]" />
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</h4>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{proposal.description}</p>
            </div>

            {/* Deliverables */}
            <div data-tour="deliverables">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-[#B8FF00]" />
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deliverables</h4>
              </div>
              <ul className="space-y-2">
                {proposal.deliverables?.map((deliverable, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-300 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-[#B8FF00]/10 border border-[#B8FF00]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-[#B8FF00] font-bold">{index + 1}</span>
                    </div>
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>

            {/* Budget */}
            <div data-tour="payment-terms" className="bg-gradient-to-br from-[#00D9FF]/10 to-transparent rounded-xl p-4 border border-[#00D9FF]/20">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="w-4 h-4 text-[#00D9FF]" />
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Budget & Payment</h4>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Proposed Budget</span>
                  <span className="text-white font-bold text-lg">₹{proposal.proposedBudget?.toLocaleString()}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Advance ({proposal.advancePercentage}%)</span>
                  <span className="text-[#00D9FF] font-semibold">₹{proposal.advanceAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">On Completion</span>
                  <span className="text-white font-semibold">₹{proposal.remainingAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deadline */}
            {proposal.deadline && (
              <div data-tour="deadline" className="flex items-center gap-3 text-gray-400 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                <Calendar className="w-4 h-4 text-[#00D9FF]" />
                <span className="text-sm">Deadline: <span className="text-white font-medium">{new Date(proposal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
              </div>
            )}

            {/* Accept Button */}
            <button className="w-full py-3.5 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all cursor-pointer">
              Accept Proposal
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <p className="text-sm text-gray-300">
              This is the final step of the demo! In a real scenario, the influencer would review and respond to this proposal.
            </p>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
