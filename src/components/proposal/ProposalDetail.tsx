// ============================================
// PROPOSAL DETAIL COMPONENT
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiClock } from 'react-icons/fi';
import {
  useRespondToProposal,
  useFinalizeProposal,
  useInfluencerAcceptTerms,
  useMarkAsPaid,
  useInfluencerSubmitWork,
  usePromoterApproveWork,
} from '../../hooks/useProposal';
import { usePlatformFeePayment } from '../../hooks/usePlatformFeePayment';
import { toast } from '../../stores/uiStore';
import Modal from '../common/Modal';
import DeliverableTracker from './DeliverableTracker';
import ProposalStepper from './ProposalStepper';
import ProposalAuditLog from './ProposalAuditLog';
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
  const { acceptTerms, loading: acceptingTerms } = useInfluencerAcceptTerms();
  const { markAsPaid, loading: markingPaid } = useMarkAsPaid();
  const { submitWork, loading: submittingWork } = useInfluencerSubmitWork();
  const { approveWork, loading: approvingWork } = usePromoterApproveWork();
  const { payPlatformFee, loading: payingPlatformFee, error: platformFeeError } = usePlatformFeePayment();

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalAmount, setFinalAmount] = useState(proposal.finalAmount || proposal.proposedBudget || 0);
  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(proposal.completionPercentage);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);

  const [alertModal, setAlertModal] = useState<{
    open: boolean;
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    loading?: boolean;
    onConfirm?: (() => void | Promise<void>) | null;
  }>({
    open: false,
    title: '',
    message: undefined,
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    loading: false,
    onConfirm: null,
  });

  const closeAlertModal = () => {
    setAlertModal((prev) => ({
      ...prev,
      open: false,
      loading: false,
      onConfirm: null,
    }));
  };

  const showInfoModal = (title: string, message?: string) => {
    setAlertModal({
      open: true,
      title,
      message,
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: false,
      loading: false,
      onConfirm: null,
    });
  };

  const showConfirmModal = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setAlertModal({
      open: true,
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showCancel: true,
      loading: false,
      onConfirm,
    });
  };

  // Helper to get three-track statuses with backward compatibility
  const getProposalStatus = (): Exclude<Proposal['proposalStatus'], undefined> => {
    if (proposal.proposalStatus) return proposal.proposalStatus;
    // Map legacy status to new proposal status
    if (proposal.status === 'pending') return 'created';
    if (proposal.status === 'discussing') return 'discussing';
    if (proposal.status === 'finalized' || proposal.status === 'in_progress' || proposal.status === 'completed') return 'agreed';
    if (proposal.status === 'cancelled') return 'cancelled';
    return 'created';
  };

  const getPaymentStatus = (): Exclude<Proposal['paymentStatus'], undefined> => {
    if (proposal.paymentStatus) return proposal.paymentStatus;
    // Map legacy status to new payment status
    if (proposal.status === 'pending' || proposal.status === 'discussing') return 'not_started';
    if (proposal.status === 'finalized') return proposal.advancePaid ? 'advance_paid' : 'pending_advance';
    if (proposal.status === 'in_progress') return 'advance_paid';
    if (proposal.status === 'completed') return 'fully_paid';
    return 'not_started';
  };

  const getWorkStatus = (): Exclude<Proposal['workStatus'], undefined> => {
    if (proposal.workStatus) return proposal.workStatus;
    // Map legacy status to new work status
    if (proposal.status === 'pending' || proposal.status === 'discussing' || proposal.status === 'finalized') return 'not_started';
    if (proposal.status === 'in_progress') {
      if (proposal.brandApprovedWork) return 'approved';
      if (proposal.influencerSubmittedWork) return 'submitted';
      return 'in_progress';
    }
    if (proposal.status === 'completed') return 'approved';
    if (proposal.status === 'disputed') return 'disputed';
    return 'not_started';
  };

  const proposalStatus = getProposalStatus();
  const paymentStatus = getPaymentStatus();
  const workStatus = getWorkStatus();

  const handleAccept = async () => {
    const result = await acceptProposal(proposal.id);
    if (result.success) {
      showInfoModal('Proposal accepted', 'You can now discuss details in chat.');
    }
  };

  const handleDecline = async () => {
    showConfirmModal(
      'Decline proposal?',
      'Are you sure you want to decline this proposal?',
      async () => {
        setAlertModal((prev) => ({ ...prev, loading: true }));
        const result = await declineProposal(proposal.id);
        setAlertModal((prev) => ({ ...prev, loading: false }));
        if (result.success) {
          closeAlertModal();
          showInfoModal('Proposal declined', 'The proposal has been declined.');
          navigate(-1);
        }
      }
    );
  };

  const handleFinalize = async () => {
    const result = await finalizeProposal(proposal.id, finalAmount);
    if (result.success) {
      setShowFinalizeModal(false);
      showInfoModal('Proposal finalized', 'Waiting for influencer to accept terms.');
    }
  };

  const handleAcceptTerms = async () => {
    const result = await acceptTerms(proposal.id);
    if (result.success) {
      showInfoModal('Terms accepted', 'Waiting for promoter to mark as paid.');
    }
  };

  const handleMarkAsPaid = async () => {
    showConfirmModal(
      'Mark as paid?',
      'Mark this proposal as paid? This will start the work phase.',
      async () => {
        setAlertModal((prev) => ({ ...prev, loading: true }));
        const result = await markAsPaid(proposal.id);
        setAlertModal((prev) => ({ ...prev, loading: false }));
        if (result.success) {
          closeAlertModal();
          showInfoModal('Payment confirmed', 'Work has started.');
        }
      }
    );
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
        showInfoModal('Work submitted', 'Waiting for brand approval.');
      } else {
        showInfoModal(
          'Progress updated',
          `Progress updated to ${completionPercentage}%. You can continue updating until 100%.`
        );
      }
    }
  };

  const handleApproveWork = async () => {
    showConfirmModal(
      'Approve work?',
      'Approve this work and mark collaboration as complete?',
      async () => {
        setAlertModal((prev) => ({ ...prev, loading: true }));
        const result = await approveWork(proposal.id);
        setAlertModal((prev) => ({ ...prev, loading: false }));
        if (result.success) {
          closeAlertModal();
          showInfoModal('Work approved', 'Collaboration completed.');
        }
      }
    );
  };

  // Permission checks based on three-track status
  const canAccept = isInfluencer && proposalStatus === 'created';
  const canFinalize = !isInfluencer && proposalStatus === 'discussing';
  const canAcceptTerms = isInfluencer && proposalStatus === 'agreed' && paymentStatus === 'not_started';

  const influencerPlatformFeePaid = Boolean(proposal.fees?.paidBy?.influencer);
  const promoterPlatformFeePaid = Boolean(proposal.fees?.paidBy?.promoter);

  const canMarkAsPaid =
    !isInfluencer &&
    proposalStatus === 'agreed' &&
    (paymentStatus === 'pending_advance' || paymentStatus === 'pending_escrow') &&
    influencerPlatformFeePaid;

  const showInfluencerPayPlatformFee =
    isInfluencer &&
    proposalStatus === 'agreed' &&
    (paymentStatus === 'pending_advance' || paymentStatus === 'pending_escrow') &&
    !influencerPlatformFeePaid;

  const showPromoterPayPlatformFee =
    !isInfluencer &&
    proposalStatus === 'agreed' &&
    (paymentStatus === 'pending_advance' || paymentStatus === 'pending_escrow') &&
    !promoterPlatformFeePaid;

  const canUpdateProgress = isInfluencer && workStatus === 'in_progress' && proposal.completionPercentage < 100;
  const canApproveWork = !isInfluencer && workStatus === 'submitted';

  return (
    <div className="max-w-4xl mx-auto">
      <Modal
        open={alertModal.open}
        onClose={closeAlertModal}
        title={alertModal.title}
        footer={
          <div className="flex gap-3">
            {alertModal.showCancel && (
              <button
                onClick={closeAlertModal}
                disabled={alertModal.loading}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {alertModal.cancelText || 'Cancel'}
              </button>
            )}
            <button
              onClick={async () => {
                if (alertModal.onConfirm) {
                  await alertModal.onConfirm();
                } else {
                  closeAlertModal();
                }
              }}
              disabled={alertModal.loading}
              className="flex-1 px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {alertModal.loading ? 'Please wait...' : alertModal.confirmText || 'OK'}
            </button>
          </div>
        }
      >
        {alertModal.message && <p className="text-gray-400 text-sm">{alertModal.message}</p>}
      </Modal>

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

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-3xl font-bold text-white leading-tight">
                {proposal.title}{' '}
                <span className="font-normal text-sm text-gray-400">
                  with{' '}
                  <span className={isInfluencer ? 'text-secondary-500' : 'text-primary-500'}>{otherUserName}</span>
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAuditLogModal(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Activity log"
            >
              <FiClock size={18} />
            </button>
          </div>
        </div>
        {/* Status badges for key milestones */}
        <div className="mt-3 flex flex-wrap gap-2">
          {proposalStatus === 'agreed' && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">
              ✓ Terms agreed
            </span>
          )}
          {(paymentStatus === 'advance_paid' || paymentStatus === 'fully_paid') && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">
              ✓ Payment complete
            </span>
          )}
          {workStatus === 'submitted' && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">
              ✓ Work submitted
            </span>
          )}
          {workStatus === 'approved' && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-md">
              ✓ Work approved
            </span>
          )}
        </div>

      </div>

      {/* Three-Track Stepper */}
      <div className="mb-8">
        <ProposalStepper
          proposalStatus={proposalStatus}
          paymentStatus={paymentStatus}
          workStatus={workStatus}
          isInfluencer={isInfluencer}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
                <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Description</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{proposal.description}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
                <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Requirements</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{proposal.requirements}</p>
            </div>
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
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Attachments</h2>
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
        <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Actions */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
                <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Actions</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
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

                {!isInfluencer && proposalStatus === 'agreed' && !influencerPlatformFeePaid && (
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
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
                <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Budget</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
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
            <div className="p-5 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white mb-3">Deadline</h2>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white">{new Date(proposal.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
              <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Timeline</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
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

 
        </div>
      </div>
      </div>

      {/* Audit Log Modal */}
      {showAuditLogModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Activity Log</h2>
                <p className="text-sm text-gray-400 mt-1">Track all changes and updates</p>
              </div>
              <button
                onClick={() => setShowAuditLogModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <ProposalAuditLog entries={[]} loading={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
