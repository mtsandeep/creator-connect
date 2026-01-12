// ============================================
// PROPOSAL AUDIT LOG COMPONENT
// ============================================

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ProposalHistoryEntry {
  id: string;
  proposalId: string;
  changedBy: string;
  changedByRole: 'influencer' | 'promoter' | 'system';
  changedByName?: string;
  timestamp: number;
  changeType: ChangeType;
  track: 'proposal' | 'payment' | 'work';
  previousStatus?: string;
  newStatus?: string;
  changedFields?: string[];
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
  metadata?: Record<string, any>;
}

type ChangeType =
  | 'proposal_created'
  | 'proposal_status_changed'
  | 'proposal_edited'
  | 'proposal_resent'
  | 'payment_status_changed'
  | 'advance_paid'
  | 'escrow_funded'
  | 'remaining_paid'
  | 'work_status_changed'
  | 'work_started'
  | 'work_submitted'
  | 'revision_requested'
  | 'work_approved'
  | 'dispute_raised'
  | 'dispute_resolved'
  | 'proposal_declined'
  | 'proposal_closed'
  | 'document_uploaded'
  | 'terms_accepted';

interface ProposalAuditLogProps {
  entries: ProposalHistoryEntry[];
  loading?: boolean;
}

export default function ProposalAuditLog({ entries, loading = false }: ProposalAuditLogProps) {
  const [filter, setFilter] = useState<ChangeType | 'all'>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Filter entries
  const filteredEntries = filter === 'all'
    ? entries
    : entries.filter(entry => entry.changeType === filter);

  // Group entries by date
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const date = new Date(entry.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, ProposalHistoryEntry[]>);

  // Get change type display info
  const getChangeTypeInfo = (changeType: ChangeType) => {
    const info: Record<ChangeType, { label: string; icon: string; color: string; track: string }> = {
      proposal_created: { label: 'Proposal Created', icon: '📝', color: 'text-blue-400', track: 'Proposal' },
      proposal_status_changed: { label: 'Status Changed', icon: '🔄', color: 'text-purple-400', track: 'Proposal' },
      proposal_edited: { label: 'Proposal Edited', icon: '✏️', color: 'text-yellow-400', track: 'Proposal' },
      proposal_resent: { label: 'Proposal Resent', icon: '📨', color: 'text-blue-400', track: 'Proposal' },
      payment_status_changed: { label: 'Payment Status Changed', icon: '💰', color: 'text-green-400', track: 'Payment' },
      advance_paid: { label: 'Advance Paid', icon: '💵', color: 'text-green-400', track: 'Payment' },
      escrow_funded: { label: 'Escrow Funded', icon: '🏦', color: 'text-green-400', track: 'Payment' },
      remaining_paid: { label: 'Remaining Paid', icon: '💰', color: 'text-green-400', track: 'Payment' },
      work_status_changed: { label: 'Work Status Changed', icon: '🔄', color: 'text-purple-400', track: 'Work' },
      work_started: { label: 'Work Started', icon: '🚀', color: 'text-[#B8FF00]', track: 'Work' },
      work_submitted: { label: 'Work Submitted', icon: '📤', color: 'text-blue-400', track: 'Work' },
      revision_requested: { label: 'Revision Requested', icon: '🔄', color: 'text-orange-400', track: 'Work' },
      work_approved: { label: 'Work Approved', icon: '✅', color: 'text-green-400', track: 'Work' },
      dispute_raised: { label: 'Dispute Raised', icon: '⚠️', color: 'text-red-400', track: 'Work' },
      dispute_resolved: { label: 'Dispute Resolved', icon: '✓', color: 'text-green-400', track: 'Work' },
      proposal_declined: { label: 'Proposal Declined', icon: '❌', color: 'text-red-400', track: 'Proposal' },
      proposal_closed: { label: 'Proposal Closed', icon: '🔒', color: 'text-red-400', track: 'Proposal' },
      document_uploaded: { label: 'Document Uploaded', icon: '📎', color: 'text-gray-400', track: 'All' },
      terms_accepted: { label: 'Terms Accepted', icon: '✍️', color: 'text-green-400', track: 'Proposal' },
    };
    return info[changeType];
  };

  // Helper to convert camelCase to readable text
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map((word, index) => 
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(' ');
};

// Format change description
  const formatChangeDescription = (entry: ProposalHistoryEntry) => {
    const typeInfo = getChangeTypeInfo(entry.changeType);

    switch (entry.changeType) {
      case 'proposal_created':
        return `Proposal created by ${entry.changedByRole}`;

      case 'proposal_edited':
        const editedFields = entry.changedFields?.join(', ') || 'details';
        return `Edited ${editedFields}`;

      case 'proposal_resent':
        return `Proposal resent${entry.reason ? `: "${entry.reason}"` : ''}`;

      case 'advance_paid':
        return `Advance payment of ₹${entry.newValues?.amount?.toLocaleString()} completed`;

      case 'escrow_funded':
        return `Escrow funded with ₹${entry.newValues?.amount?.toLocaleString()}`;

      case 'remaining_paid':
        return `Remaining payment of ₹${entry.newValues?.amount?.toLocaleString()} completed`;

      case 'work_submitted':
        return `Work submitted (${entry.newValues?.completionPercentage || 100}% complete)`;

      case 'revision_requested':
        return `Revision requested${entry.reason ? `: "${entry.reason}"` : ''}`;

      case 'work_approved':
        return 'Work approved and marked as complete';

      case 'proposal_declined':
        return `Proposal declined${entry.reason ? `: "${entry.reason}"` : ''}`;

      case 'proposal_closed':
        return `Proposal closed${entry.reason ? `: "${entry.reason}"` : ''}`;

      case 'dispute_raised':
        return `Dispute raised${entry.reason ? `: "${entry.reason}"` : ''}`;

      case 'terms_accepted':
        return `${entry.changedByRole === 'influencer' ? 'Influencer' : 'Promoter'} accepted terms`;

      case 'proposal_status_changed':
      case 'payment_status_changed':
      case 'work_status_changed':
        if (entry.previousStatus && entry.newStatus) {
          return `Status changed from ${formatStatus(entry.previousStatus)} to ${formatStatus(entry.newStatus)}`;
        }
        return `Status changed to ${formatStatus(entry.newStatus || '')}`;

      default:
        return typeInfo.label;
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8FF00]"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-400">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-white/10">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-[#00D9FF] text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('proposal_status_changed')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'proposal_status_changed'
              ? 'bg-[#00D9FF] text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Proposal
        </button>
        <button
          onClick={() => setFilter('advance_paid')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'advance_paid'
              ? 'bg-[#00D9FF] text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Payments
        </button>
        <button
          onClick={() => setFilter('work_submitted')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'work_submitted'
              ? 'bg-[#00D9FF] text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Work
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedEntries).map(([date, dateEntries]) => (
          <div key={date}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {date === new Date().toDateString() ? 'Today' : date}
            </h3>
            <div className="space-y-3">
              {dateEntries.map((entry) => {
                const typeInfo = getChangeTypeInfo(entry.changeType);
                const isExpanded = expandedEntry === entry.id;

                return (
                  <div
                    key={entry.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`text-2xl flex-shrink-0 ${typeInfo.color}`}>
                        {typeInfo.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {formatChangeDescription(entry)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${typeInfo.color.replace('text-', 'bg-').replace('400', '500/20')} ${typeInfo.color}`}>
                            {typeInfo.track}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            by {entry.changedByName || entry.changedByRole}
                          </span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}</span>
                        </div>

                        {/* Expandable details */}
                        {(entry.changedFields && entry.changedFields.length > 0) && (
                          <button
                            onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                            className="mt-2 text-xs text-gray-400 hover:text-white flex items-center gap-1"
                          >
                            {isExpanded ? 'Hide' : 'Show'} details
                            <svg
                              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}

                        {isExpanded && entry.changedFields && (
                          <div className="mt-3 p-3 bg-black/20 rounded-lg space-y-2">
                            {entry.changedFields.map((field) => (
                              <div key={field} className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 capitalize">{formatFieldName(field)}:</span>
                                <div className="flex items-center gap-2">
                                  {entry.previousValues?.[field] !== undefined && (
                                    <span className="text-red-400 line-through">
                                      {typeof entry.previousValues[field] === 'number' && field === 'completionPercentage'
                                        ? `${entry.previousValues[field]}%`
                                        : typeof entry.previousValues[field] === 'number'
                                          ? `₹${entry.previousValues[field].toLocaleString()}`
                                          : entry.previousValues[field]}
                                    </span>
                                  )}
                                  {entry.newValues?.[field] !== undefined && (
                                    <span className="text-green-400">
                                      {typeof entry.newValues[field] === 'number' && field === 'completionPercentage'
                                        ? `${entry.newValues[field]}%`
                                        : typeof entry.newValues[field] === 'number'
                                          ? `₹${entry.newValues[field].toLocaleString()}`
                                          : entry.newValues[field]}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
