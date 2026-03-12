// ============================================
// DEMO PROPOSAL CARD COMPONENT
// Reusable proposal UI for demo flows
// ============================================

import { Calendar, FileText, CheckCircle, IndianRupee } from 'lucide-react';
import { demoInfluencer, demoProposal, type DemoProposal } from '../../data/demoData';

interface DemoProposalCardProps {
  /** Override proposal data */
  proposal?: DemoProposal;
  /** Override influencer display name */
  influencerName?: string;
  /** Show accept button */
  showAcceptButton?: boolean;
  /** Accent color */
  accentColor?: string;
  /** Status badge text */
  statusText?: string;
}

export default function DemoProposalCard({
  proposal = demoProposal,
  influencerName = demoInfluencer.displayName,
  showAcceptButton = true,
  accentColor = '#00D9FF',
  statusText = 'Awaiting Response',
}: DemoProposalCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-gray-400 text-sm">
            To: <span style={{ color: accentColor }} className="font-medium">{influencerName}</span>
          </p>
          <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">
            {statusText}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4" style={{ color: accentColor }} />
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</h4>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{proposal.description}</p>
        </div>

        {/* Deliverables */}
        <div>
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
        <div
          className="rounded-xl p-4 border"
          style={{
            background: `linear-gradient(to bottom right, ${accentColor}15, transparent)`,
            borderColor: `${accentColor}30`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <IndianRupee className="w-4 h-4" style={{ color: accentColor }} />
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
              <span style={{ color: accentColor }} className="font-semibold">₹{proposal.advanceAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">On Completion</span>
              <span className="text-white font-semibold">₹{proposal.remainingAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Deadline */}
        {proposal.deadline && (
          <div className="flex items-center gap-3 text-gray-400 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
            <Calendar className="w-4 h-4" style={{ color: accentColor }} />
            <span className="text-sm">Deadline: <span className="text-white font-medium">{new Date(proposal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
          </div>
        )}

        {/* Accept Button */}
        {showAcceptButton && (
          <button
            className="w-full py-3.5 font-bold rounded-xl transition-all cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${accentColor}, ${accentColor}CC)`,
              color: '#111',
            }}
          >
            Accept Proposal
          </button>
        )}
      </div>
    </div>
  );
}
