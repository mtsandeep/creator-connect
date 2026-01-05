// ============================================
// PROPOSAL DETAIL COMPONENT
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  useRespondToProposal,
  useFinalizeProposal,
  useDeleteProposal,
  useInfluencerAcceptTerms,
  useMarkAsPaid,
  useInfluencerSubmitWork,
  usePromoterApproveWork,
} from '../../hooks/useProposal';
import { usePlatformFeePayment } from '../../hooks/usePlatformFeePayment';
import { toast } from '../../stores/uiStore';
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

  const { acceptProposal, declineProposal, loading: responding } = useRespondToProposal();
  const { finalizeProposal, loading: finalizing } = useFinalizeProposal();
  const { deleteProposal, loading: deleting } = useDeleteProposal();
  const { acceptTerms, loading: acceptingTerms } = useInfluencerAcceptTerms();
  const { markAsPaid, loading: markingPaid } = useMarkAsPaid();
  const { submitWork, loading: submittingWork } = useInfluencerSubmitWork();
  const { approveWork, loading: approvingWork } = usePromoterApproveWork();
  const { payPlatformFee, loading: payingPlatformFee, error: platformFeeError } = usePlatformFeePayment();

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalAmount, setFinalAmount] = useState(proposal.finalAmount || proposal.proposedBudget || 0);
  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(proposal.completionPercentage);

  // Dynamic status description based on flags
  const getStatusDescription = () => {
    if (proposal.status === 'finalized') {
      if (isInfluencer) {
        return proposal.influencerAcceptedTerms
          ? 'Waiting for promoter to mark as paid'
          : 'Review the finalized terms and accept to proceed';
      } else {
        return proposal.influencerAcceptedTerms
          ? 'Influencer accepted. Mark as paid to start work.'
          : 'Waiting for influencer to accept terms';
      }
    }
    if (proposal.status === 'in_progress') {
      if (isInfluencer) {
        return proposal.influencerSubmittedWork
          ? 'Work submitted. Waiting for brand approval.'
          : `Work in progress (${proposal.completionPercentage}%). Update progress or submit when complete.`;
      } else {
        return proposal.influencerSubmittedWork
          ? 'Review submitted work and approve.'
          : `Influencer is working on the deliverables (${proposal.completionPercentage}% complete).`;
      }
    }
    return STATUS_CONFIG[proposal.status].description;
  };

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
      alert('Proposal finalized! Waiting for influencer to accept terms.');
    }
  };

  const handleAcceptTerms = async () => {
    const result = await acceptTerms(proposal.id);
    if (result.success) {
      alert('Terms accepted! Waiting for promoter to mark as paid.');
    }
  };

  const handleMarkAsPaid = async () => {
    if (confirm('Mark this proposal as paid? This will start the work phase.')) {
      const result = await markAsPaid(proposal.id);
      if (result.success) {
        alert('Marked as paid! Work has started.');
      }
    }
  };

  const handlePayPlatformFee = async (payerRole: 'influencer' | 'promoter') => {
    const result = await payPlatformFee({
      proposalId: proposal.id,
      payerRole,
    });

    if (result.success) {
      toast.success('Platform fee paid successfully.');
    } else {
      const message = result.message || platformFeeError;
      if (message === 'Payment cancelled') {
        toast.info('Payment cancelled.');
      } else {
        toast.error(message || 'Failed to process platform fee payment.');
      }
    }
  };

  const handleSubmitWork = async () => {
    const result = await submitWork(proposal.id, completionPercentage);
    if (result.success) {
      setShowSubmitWorkModal(false);
      if (completionPercentage === 100) {
        alert('Work submitted! Waiting for brand approval.');
      } else {
        alert(`Progress updated to ${completionPercentage}%. You can continue updating until 100%.`);
      }
    }
  };

  const handleApproveWork = async () => {
    if (confirm('Approve this work and mark collaboration as complete?')) {
      const result = await approveWork(proposal.id);
      if (result.success) {
        alert('Work approved! Collaboration completed.');
      }
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

  // Permission checks
  const canAccept = isInfluencer && proposal.status === 'pending';
  const canFinalize = !isInfluencer && proposal.status === 'discussing';
  const canDelete = proposal.status === 'pending' || proposal.status === 'cancelled';
  const canAcceptTerms = isInfluencer && proposal.status === 'finalized' && !proposal.influencerAcceptedTerms;

  const influencerPlatformFeePaid = Boolean(proposal.fees?.paidBy?.influencer);
  const promoterPlatformFeePaid = Boolean(proposal.fees?.paidBy?.promoter);

  const canMarkAsPaid =
    !isInfluencer &&
    proposal.status === 'finalized' &&
    proposal.influencerAcceptedTerms &&
    influencerPlatformFeePaid;

  const showInfluencerPayPlatformFee =
    isInfluencer &&
    proposal.status === 'finalized' &&
    proposal.influencerAcceptedTerms &&
    !influencerPlatformFeePaid;

  const showPromoterPayPlatformFee =
    !isInfluencer &&
    proposal.status === 'finalized' &&
    proposal.influencerAcceptedTerms &&
    !promoterPlatformFeePaid;

  const canUpdateProgress = isInfluencer && proposal.status === 'in_progress' && proposal.completionPercentage < 100;
  const canApproveWork = !isInfluencer && proposal.status === 'in_progress' && proposal.influencerSubmittedWork;

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

      {/* Submit Work Modal */}
      {showSubmitWorkModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-2">
              {completionPercentage === 100 ? 'Submit Work' : 'Update Progress'}
            </h2>
            <p className="text-gray-400 mb-6">
              {completionPercentage === 100
                ? 'Mark the collaboration as complete and submit for brand approval.'
                : 'Update your work progress. You can continue updating until reaching 100%.'}
            </p>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-300">Completion Progress</label>
                <span className="text-2xl font-bold text-[#B8FF00]">{completionPercentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={completionPercentage}
                onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#B8FF00]"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitWorkModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={submittingWork}
                className="flex-1 px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl disabled:opacity-50"
              >
                {submittingWork
                  ? 'Saving...'
                  : completionPercentage === 100
                    ? 'Submit Work'
                    : 'Update Progress'}
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
        <p className="text-sm text-gray-500 mt-2">{getStatusDescription()}</p>

        {/* Status badges for finalized/in_progress */}
        {proposal.status === 'finalized' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {proposal.influencerAcceptedTerms && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">
                ✓ Influencer accepted terms
              </span>
            )}
          </div>
        )}
        {proposal.status === 'in_progress' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {proposal.advancePaid && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">
                ✓ Paid
              </span>
            )}
            {proposal.influencerSubmittedWork && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">
                ✓ Work submitted
              </span>
            )}
            {proposal.brandApprovedWork && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-md">
                ✓ Brand approved
              </span>
            )}
          </div>
        )}
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
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining</span>
                    <span className="text-white font-medium">₹{proposal.remainingAmount?.toLocaleString()}</span>
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
                onClick={() => {
                  const otherUserId = isInfluencer ? proposal.promoterId : proposal.influencerId;
                  const basePath = isInfluencer
                    ? `/influencer/messages/${otherUserId}`
                    : `/promoter/messages/${otherUserId}`;
                  navigate(`${basePath}/${proposal.id}`);
                }}
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

              {/* Accept Terms (Influencer, finalized status) */}
              {canAcceptTerms && (
                <button
                  onClick={handleAcceptTerms}
                  disabled={acceptingTerms}
                  className="w-full px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {acceptingTerms ? 'Accepting...' : 'Accept Terms & Start Work'}
                </button>
              )}

              {/* Pay Platform Fee (Influencer) */}
              {showInfluencerPayPlatformFee && (
                <button
                  onClick={() => handlePayPlatformFee('influencer')}
                  disabled={payingPlatformFee}
                  className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {payingPlatformFee ? 'Processing...' : 'Pay Platform Fee (₹49 + GST)'}
                </button>
              )}

              {/* Pay Platform Fee (Promoter - optional unless escrow) */}
              {showPromoterPayPlatformFee && (
                <button
                  onClick={() => handlePayPlatformFee('promoter')}
                  disabled={payingPlatformFee}
                  className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {payingPlatformFee ? 'Processing...' : 'Pay Platform Fee (Optional) (₹49 + GST)'}
                </button>
              )}

              {/* Mark as Paid (Promoter, finalized, influencer accepted) */}
              {canMarkAsPaid && (
                <button
                  onClick={handleMarkAsPaid}
                  disabled={markingPaid}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {markingPaid ? 'Processing...' : 'Mark as Paid'}
                </button>
              )}

              {!isInfluencer && proposal.status === 'finalized' && proposal.influencerAcceptedTerms && !influencerPlatformFeePaid && (
                <p className="text-xs text-gray-400">
                  Influencer must pay the platform fee before work can start.
                </p>
              )}

              {/* Update/Submit Work (Influencer, in_progress) */}
              {canUpdateProgress && (
                <button
                  onClick={() => setShowSubmitWorkModal(true)}
                  className="w-full px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  {proposal.completionPercentage === 100 ? 'Submit Work' : `Update Progress (${proposal.completionPercentage}%)`}
                </button>
              )}

              {/* Approve Work (Promoter, work submitted) */}
              {canApproveWork && (
                <button
                  onClick={handleApproveWork}
                  disabled={approvingWork}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {approvingWork ? 'Approving...' : 'Approve & Complete'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
