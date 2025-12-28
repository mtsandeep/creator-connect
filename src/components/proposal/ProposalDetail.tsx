// ============================================
// PROPOSAL DETAIL COMPONENT
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../stores';
import {
  useRespondToProposal,
  useFinalizeProposal,
  useUpdateProposal,
  useDeleteProposal,
} from '../../hooks/useProposal';
import DeliverableTracker from './DeliverableTracker';
import type { Proposal } from '../../types';

interface ProposalDetailProps {
  proposal: Proposal;
  otherUserName?: string;
  isInfluencer?: boolean;
}

export default function ProposalDetail({
  proposal,
  otherUserName,
  isInfluencer = false,
}: ProposalDetailProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { acceptProposal, declineProposal, loading: responding } = useRespondToProposal();
  const { finalizeProposal, loading: finalizing } = useFinalizeProposal();
  const { updateProposal, loading: updating } = useUpdateProposal();
  const { deleteProposal, loading: deleting } = useDeleteProposal();

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalAmount, setFinalAmount] = useState(proposal.finalAmount || proposal.proposedBudget || 0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(proposal.completionPercentage);

  const STATUS_CONFIG: Record<Proposal['status'], { label: string; color: string; description: string }> = {
    pending: {
      label: 'Pending Response',
      color: 'bg-yellow-500/20 text-yellow-500',
      description: 'Waiting for influencer to respond',
    },
    discussing: {
      label: 'Discussing',
      color: 'bg-blue-500/20 text-blue-500',
      description: 'Discussing details in chat',
    },
    finalized: {
      label: 'Finalized',
      color: 'bg-purple-500/20 text-purple-500',
      description: 'Proposal finalized, awaiting payment',
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-[#B8FF00]/20 text-[#B8FF00]',
      description: 'Work in progress',
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-500/20 text-green-500',
      description: 'Collaboration completed',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-500/20 text-red-500',
      description: 'Proposal was cancelled',
    },
    disputed: {
      label: 'Disputed',
      color: 'bg-orange-500/20 text-orange-500',
      description: 'Dispute under review',
    },
  };

  const statusConfig = STATUS_CONFIG[proposal.status];

  const handleAccept = async () => {
    const result = await acceptProposal(proposal.id);
    if (result.success) {
      alert('Proposal accepted! You can now discuss details in chat.');
    }
  };

  const handleDecline = async () => {
    if (confirm('Are you sure you want to decline this proposal?')) {
      const result = await declineProposal(proposal.id);
      if (result.success) {
        alert('Proposal declined.');
        navigate(-1);
      }
    }
  };

  const handleFinalize = async () => {
    const result = await finalizeProposal(proposal.id, finalAmount);
    if (result.success) {
      setShowFinalizeModal(false);
      alert('Proposal finalized! Ready for payment.');
    }
  };

  const handleMarkComplete = async () => {
    const result = await updateProposal(proposal.id, {
      influencerApproval: true,
      completionPercentage: 100,
    });
    if (result.success) {
      setShowCompleteModal(false);
      alert('Work submitted! Waiting for brand approval.');
    }
  };

  const handleBrandApprove = async () => {
    const result = await updateProposal(proposal.id, {
      brandApproval: true,
      status: 'completed',
    });
    if (result.success) {
      alert('Work approved! Collaboration completed.');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this proposal?')) {
      const result = await deleteProposal(proposal.id);
      if (result.success) {
        navigate(-1);
      }
    }
  };

  const canAccept = isInfluencer && proposal.status === 'pending';
  const canFinalize = !isInfluencer && proposal.status === 'discussing';
  const canDelete = proposal.status === 'pending' || proposal.status === 'cancelled';
  const canMarkComplete = isInfluencer && proposal.status === 'in_progress' && !proposal.influencerApproval;
  const canBrandApprove = !isInfluencer && proposal.status === 'in_progress' && proposal.influencerApproval;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Finalize Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-2">Finalize Proposal</h2>
            <p className="text-gray-400 mb-4">
              Enter the final agreed amount for this collaboration.
            </p>
            <input
              type="number"
              value={finalAmount}
              onChange={(e) => setFinalAmount(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-4"
              placeholder="Final amount (₹)"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={finalizing || finalAmount <= 0}
                className="flex-1 px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl disabled:opacity-50"
              >
                {finalizing ? 'Finalizing...' : 'Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Work Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-2">Submit Work</h2>
            <p className="text-gray-400 mb-4">
              Mark the collaboration as complete and submit for brand approval.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Completion Percentage</label>
              <input
                type="number"
                min="0"
                max="100"
                value={completionPercentage}
                onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkComplete}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{proposal.title}</h1>
            <p className="text-gray-400">with {otherUserName}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete proposal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{statusConfig.description}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{proposal.description}</p>
          </div>

          {/* Requirements */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Requirements</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{proposal.requirements}</p>
          </div>

          {/* Deliverables */}
          {proposal.deliverables && proposal.deliverables.length > 0 && (
            <DeliverableTracker
              deliverables={proposal.deliverables}
              completedDeliverables={proposal.completionPercentage === 100 ? proposal.deliverables : []}
            />
          )}

          {/* Attachments */}
          {proposal.attachments && proposal.attachments.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Attachments</h2>
              <div className="space-y-2">
                {proposal.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-8 h-8 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(attachment.uploadedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Budget */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Budget</h2>
            <div className="space-y-2">
              {proposal.proposedBudget && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Proposed</span>
                  <span className="text-white font-medium">₹{proposal.proposedBudget.toLocaleString()}</span>
                </div>
              )}
              {proposal.finalAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Final Amount</span>
                  <span className="text-[#B8FF00] font-medium">₹{proposal.finalAmount.toLocaleString()}</span>
                </div>
              )}
              {proposal.advanceAmount && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Advance ({proposal.advancePercentage}%)</span>
                    <span className="text-white font-medium">₹{proposal.advanceAmount.toLocaleString()}</span>
                  </div>
                  {proposal.advancePaid && (
                    <span className="text-xs text-green-400">✓ Advance paid</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Deadline */}
          {proposal.deadline && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Deadline</h2>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white">{new Date(proposal.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Created</span>
                <span className="text-white">
                  {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Updated</span>
                <span className="text-white">
                  {formatDistanceToNow(new Date(proposal.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Actions</h2>
            <div className="space-y-3">
              {/* Open Chat */}
              <button
                onClick={() => navigate(`/messages/${proposal.id}`)}
                className="w-full px-4 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Open Chat
              </button>

              {/* Accept/Decline (Influencer, pending status) */}
              {canAccept && (
                <>
                  <button
                    onClick={handleAccept}
                    disabled={responding}
                    className="w-full px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {responding ? 'Accepting...' : 'Accept Proposal'}
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={responding}
                    className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    {responding ? 'Declining...' : 'Decline'}
                  </button>
                </>
              )}

              {/* Finalize (Promoter, discussing status) */}
              {canFinalize && (
                <button
                  onClick={() => setShowFinalizeModal(true)}
                  className="w-full px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  Finalize Proposal
                </button>
              )}

              {/* Mark Complete (Influencer, in progress) */}
              {canMarkComplete && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="w-full px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  Submit Work
                </button>
              )}

              {/* Brand Approve (Promoter, work submitted) */}
              {canBrandApprove && (
                <button
                  onClick={handleBrandApprove}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-500/80 text-white font-semibold rounded-xl transition-colors"
                >
                  Approve & Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
