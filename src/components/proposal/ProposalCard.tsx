// ============================================
// PROPOSAL CARD COMPONENT
// ============================================

import { formatDistanceToNow } from 'date-fns';
import { HiCurrencyDollar, HiClock } from 'react-icons/hi2';
import type { Proposal } from '../../types';

interface ProposalCardProps {
  proposal: Proposal;
  otherUserName?: string;
  otherUserAvatar?: string;
  onClick?: () => void;
  isPromoter?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  created: { label: 'Awaiting Response', color: 'bg-yellow-500/20 text-yellow-500' },
  discussing: { label: 'Discussing', color: 'bg-blue-500/20 text-blue-500' },
  changes_requested: { label: 'Changes Requested', color: 'bg-orange-500/20 text-orange-500' },
  agreed: { label: 'Agreed', color: 'bg-purple-500/20 text-purple-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-500' },
  in_progress: { label: 'In Progress', color: 'bg-[#B8FF00]/20 text-[#B8FF00]' },
  revision_requested: { label: 'Revision Requested', color: 'bg-orange-500/20 text-orange-500' },
  submitted: { label: 'Submitted', color: 'bg-[#00D9FF]/20 text-[#00D9FF]' },
  approved: { label: 'Completed', color: 'bg-green-500/20 text-green-500' },
  disputed: { label: 'Disputed', color: 'bg-orange-500/20 text-orange-500' },
};

export default function ProposalCard({
  proposal,
  otherUserName,
  otherUserAvatar,
  onClick,
  isPromoter = false,
}: ProposalCardProps) {
  const statusKey = proposal.workStatus === 'approved' ? 'approved' : proposal.workStatus;
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG[proposal.proposalStatus];

  const formatBudget = (amount?: number) => {
    if (!amount) return 'Undiscussed';
    return `₹${amount.toLocaleString()}`;
  };

  const formatDeadline = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#B8FF00]/50 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={otherUserAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUserName}`}
            alt={otherUserName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="text-white font-semibold">{otherUserName || 'Unknown'}</h3>
            <p className="text-gray-500 text-sm">{isPromoter ? 'Influencer' : 'Brand'}</p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-lg font-medium text-white mb-2 group-hover:text-[#B8FF00] transition-colors">
        {proposal.title}
      </h4>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {proposal.description}
      </p>

      {/* Deliverables */}
      {proposal.deliverables && proposal.deliverables.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {proposal.deliverables.slice(0, 3).map((deliverable, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-md"
            >
              {deliverable}
            </span>
          ))}
          {proposal.deliverables.length > 3 && (
            <span className="text-gray-500 text-xs px-2">
              +{proposal.deliverables.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4 text-sm">
          {/* Budget */}
          <div className="flex items-center gap-1 text-gray-400">
            <HiCurrencyDollar className="w-4 h-4" />
            <span>{formatBudget(proposal.finalAmount || proposal.proposedBudget)}</span>
          </div>

          {/* Deadline */}
          {proposal.deadline && (
            <div className={`flex items-center gap-1 ${
              new Date(proposal.deadline) < new Date() ? 'text-red-400' : 'text-gray-400'
            }`}>
              <HiClock className="w-4 h-4" />
              <span>{formatDeadline(proposal.deadline)}</span>
            </div>
          )}
        </div>

        {/* Time */}
        <span className="text-gray-500 text-xs">
          {formatDistanceToNow(new Date(proposal.updatedAt), { addSuffix: true })}
        </span>
      </div>

      {/* Completion progress for in_progress */}
      {proposal.workStatus === 'in_progress' && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm text-white font-medium">{proposal.completionPercentage}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-[#B8FF00] h-2 rounded-full transition-all"
              style={{ width: `${proposal.completionPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
