import type { Proposal } from '../../types';

interface ProposalStatusBadgeProps {
  proposal: Proposal;
  className?: string;
}

export default function ProposalStatusBadge({ proposal, className }: ProposalStatusBadgeProps) {
  const statusKey = proposal.workStatus === 'approved' ? 'approved' : proposal.workStatus;

  const badgeClass =
    proposal.proposalStatus === 'created'
      ? 'bg-yellow-500/20 text-yellow-400'
      : proposal.proposalStatus === 'discussing'
        ? 'bg-blue-500/20 text-blue-400'
        : proposal.proposalStatus === 'changes_requested'
          ? 'bg-orange-500/20 text-orange-400'
          : proposal.proposalStatus === 'agreed'
            ? 'bg-purple-500/20 text-purple-400'
            : proposal.proposalStatus === 'cancelled'
              ? 'bg-gray-500/20 text-gray-400'
              : statusKey === 'in_progress'
                ? 'bg-[#B8FF00]/20 text-[#B8FF00]'
                : statusKey === 'submitted'
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                  : statusKey === 'approved'
                    ? 'bg-green-500/20 text-green-400'
                    : statusKey === 'disputed'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-gray-500/20 text-gray-400';

  const label = statusKey === 'approved' ? 'Completed' : statusKey.replace('_', ' ');

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}${className ? ` ${className}` : ''}`}>
      {label}
    </span>
  );
}
