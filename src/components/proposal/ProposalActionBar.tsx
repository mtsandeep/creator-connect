import { useState } from 'react';
import { Switch } from '@headlessui/react';
import { FiCheckCircle } from 'react-icons/fi';
import {
  useFinalizeProposal,
  useInfluencerAcceptTerms,
  useInfluencerSubmitWork,
  useMarkAsPaid,
  usePromoterApproveWork,
  useRespondToProposal,
  useUpdateProposal,
} from '../../hooks/useProposal';
import { useNavigate } from 'react-router-dom';
import { usePlatformFeePayment } from '../../hooks/usePlatformFeePayment';
import { toast } from '../../stores/uiStore';
import type { Proposal } from '../../types';
import Modal from '../common/Modal';

interface ProposalActionBarProps {
  proposal: Proposal;
  otherUserName?: string;
  isInfluencer: boolean;
}

export default function ProposalActionBar({
  proposal,
  otherUserName,
  isInfluencer,
}: ProposalActionBarProps) {
  const navigate = useNavigate();
  const { acceptProposal, declineProposal, loading: responding } = useRespondToProposal();
  const { finalizeProposal, loading: finalizing } = useFinalizeProposal();
  const { acceptTerms, loading: acceptingTerms } = useInfluencerAcceptTerms();
  const { payPlatformFee, loading: payingPlatformFee, error: platformFeeError } = usePlatformFeePayment();
  const { markAsPaid, loading: markingPaid } = useMarkAsPaid();
  const { submitWork, loading: submittingWork } = useInfluencerSubmitWork();
  const { approveWork, loading: approvingWork } = usePromoterApproveWork();
  const { loading: updatingProposal } = useUpdateProposal();

  const [infoModal, setInfoModal] = useState<{ open: boolean; title: string; message?: string }>({
    open: false,
    title: '',
    message: undefined,
  });

  const closeInfoModal = () => setInfoModal({ open: false, title: '', message: undefined });

  const showInfo = (title: string, message?: string) => setInfoModal({ open: true, title, message });

  const proposalStatus = proposal.proposalStatus;
  const paymentStatus = proposal.paymentStatus;
  const workStatus = proposal.workStatus;

  const influencerPlatformFeePaid = Boolean(proposal.fees?.paidBy?.influencer);
  const promoterPlatformFeePaid = Boolean(proposal.fees?.paidBy?.promoter);

  const canAccept = isInfluencer && proposalStatus === 'created';
  const canFinalize = !isInfluencer && proposalStatus === 'discussing';
  const canAcceptTerms = isInfluencer && proposalStatus === 'agreed' && paymentStatus === 'not_started';

  const canMarkAsPaid =
    !isInfluencer &&
    proposalStatus === 'agreed' &&
    (paymentStatus === 'pending_advance' || paymentStatus === 'pending_escrow');

  const canUpdateProgress = isInfluencer && workStatus === 'in_progress' && proposal.completionPercentage < 100;
  const canApproveWork = !isInfluencer && workStatus === 'submitted';

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalAmount, setFinalAmount] = useState(proposal.finalAmount || proposal.proposedBudget || 0);
  const [promoterPayPlatformFee, setPromoterPayPlatformFee] = useState(true);

  const platformFeeBase = 49;
  const platformFeeGstRate = 0.18;
  const platformFeeGstAmount = Math.round(platformFeeBase * platformFeeGstRate * 100) / 100;
  const platformFeeTotal = Math.round((platformFeeBase + platformFeeGstAmount) * 100) / 100;

  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(proposal.completionPercentage);
  const [showInfluencerPlatformFeeModal, setShowInfluencerPlatformFeeModal] = useState(false);
  const [influencerFeePaidOverride, setInfluencerFeePaidOverride] = useState(false);

  const [showApproveWorkModal, setShowApproveWorkModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState(proposal.declineReason || '');

  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentPaidOn, setPaymentPaidOn] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  const handleReopenEdit = () => {
    navigate(`/promoter/proposals/${proposal.id}/edit`);
  };

  const openDeclineModal = () => {
    setDeclineReason(proposal.declineReason || '');
    setShowDeclineModal(true);
  };

  const confirmDecline = async () => {
    const result = await declineProposal(proposal.id, declineReason);
    if (result.success) {
      showInfo('Proposal declined', 'The proposal has been declined.');
    }
    setShowDeclineModal(false);
  };

  const openMarkPaidModal = () => {
    setPaymentMethod('');
    setPaymentTransactionId('');
    setPaymentNotes('');
    setPaymentProofFile(null);
    try {
      setPaymentPaidOn(new Date().toISOString().slice(0, 10));
    } catch {
      setPaymentPaidOn('');
    }
    setShowMarkPaidModal(true);
  };

  const confirmMarkPaid = async () => {
    const paidAtTimestamp = paymentPaidOn ? new Date(paymentPaidOn).getTime() : Date.now();
    const result = await markAsPaid(proposal.id, {
      method: paymentMethod.trim() || undefined,
      transactionId: paymentTransactionId.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
      paidAt: paidAtTimestamp,
    }, paymentProofFile || undefined);

    if (result.success) {
      showInfo('Payment confirmed', 'Work has started.');
    }
    setShowMarkPaidModal(false);
  };

  // Route-based edit handles reopen on save

  const handleAccept = async () => {
    const result = await acceptProposal(proposal.id);
    if (result.success) {
      showInfo('Proposal accepted', 'You can now discuss details in chat.');
    }
  };

  const handleFinalize = async () => {
    if (promoterPayPlatformFee) {
      const feeResult = await payPlatformFee({
        proposalId: proposal.id,
        payerRole: 'promoter',
      });

      if (feeResult.success) {
        toast.success('Platform fee paid successfully.');
      } else {
        const message = feeResult.message || platformFeeError;
        if (message === 'Payment cancelled') {
          toast.info('Payment cancelled.');
        } else {
          toast.error(message || 'Failed to process platform fee payment.');
        }

        return;
      }
    }

    const result = await finalizeProposal(proposal.id, finalAmount);
    if (!result.success) return;

    setShowFinalizeModal(false);
    openMarkPaidModal();
  };

  const handleAcceptTerms = async () => {
    const result = await acceptTerms(proposal.id);
    if (result.success) {
      showInfo('Terms accepted', 'Waiting for promoter to mark as paid.');
    }
  };

  const handleInfluencerPayPlatformFee = async () => {
    const result = await payPlatformFee({
      proposalId: proposal.id,
      payerRole: 'influencer',
    });

    if (result.success) {
      toast.success('Platform fee paid successfully.');
      setInfluencerFeePaidOverride(true);
      setShowInfluencerPlatformFeeModal(false);
      showInfo('Platform fee paid', 'You can now submit your work.');
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
    const influencerFeePaid = influencerPlatformFeePaid || influencerFeePaidOverride;
    if (completionPercentage === 100 && !influencerFeePaid) {
      setShowSubmitWorkModal(false);
      setShowInfluencerPlatformFeeModal(true);
      return;
    }

    const result = await submitWork(proposal.id, completionPercentage);
    if (result.success) {
      setShowSubmitWorkModal(false);
      if (completionPercentage === 100) {
        showInfo('Work submitted', 'Waiting for brand approval.');
      } else {
        showInfo('Progress updated', `Progress updated to ${completionPercentage}%. You can continue updating until 100%.`);
      }
    }
  };

  const handleApproveWork = async () => {
    const result = await approveWork(proposal.id);
    if (result.success) {
      setShowApproveWorkModal(false);
      showInfo('Work approved', 'Collaboration completed.');
    }
  };

  return (
    <>
      <Modal
        open={infoModal.open}
        onClose={closeInfoModal}
        title={infoModal.title}
        footer={
          <button
            onClick={closeInfoModal}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        }
      >
        {infoModal.message && <p className="text-gray-400 text-sm">{infoModal.message}</p>}
      </Modal>

      <Modal
        open={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        title="Finalize proposal"
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowFinalizeModal(false)}
              disabled={finalizing}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalize}
              disabled={finalizing || payingPlatformFee || finalAmount <= 0}
              className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {payingPlatformFee ? 'Processing...' : finalizing ? 'Finalizing...' : 'Finalize'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-gray-400 text-sm text-left">Confirm final amount, advance, and platform fee preference.</p>

          <div>
            <label className="block text-md font-medium text-gray-300 mb-2">Final agreed amount (₹)</label>
            <input
              type="number"
              value={finalAmount}
              onChange={(e) => setFinalAmount(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              placeholder="Final amount (₹)"
            />
          </div>

          <div>
            <label className="block text-md font-medium text-gray-300 mb-2">
              Advance upfront ({proposal.advancePercentage ?? 30}%)
            </label>
            <input
              type="text"
              readOnly
              value={(() => {
                const pct = proposal.advancePercentage ?? 30;
                const amount = finalAmount > 0 ? (finalAmount * pct) / 100 : 0;
                return `₹${Math.round(amount)}`;
              })()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80"
            />
            <p className="text-xs text-gray-500 mt-1">This is based on influencer settings.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-medium text-gray-300">
                  Platform Fee{' '}
                  <span className="text-gray-500 line-through">₹99</span>{' '}
                  <span className="text-[#B8FF00] font-semibold">₹{platformFeeBase}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Optional for using advanced platform features. Price excluding GST.
                </p>
              </div>
              <Switch
                checked={promoterPayPlatformFee}
                onChange={setPromoterPayPlatformFee}
                className={`${
                  promoterPayPlatformFee ? 'bg-[#B8FF00]' : 'bg-white/10'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8FF00]/30`}
              >
                <span
                  className={`${
                    promoterPayPlatformFee ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-gray-900 transition-transform`}
                />
              </Switch>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Why pay the platform fee?</p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <FiCheckCircle className="mt-0.5 text-[#B8FF00] flex-shrink-0" />
                  <span>Keep your collaboration history organized in one place</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <FiCheckCircle className="mt-0.5 text-[#B8FF00] flex-shrink-0" />
                  <span>Structured record-keeping for payments, deliverables, and approvals</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <FiCheckCircle className="mt-0.5 text-[#B8FF00] flex-shrink-0" />
                  <span>Easily generate tax-ready documents and receipts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showInfluencerPlatformFeeModal}
        onClose={() => setShowInfluencerPlatformFeeModal(false)}
        title="Pay platform fee to submit work"
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowInfluencerPlatformFeeModal(false)}
              disabled={payingPlatformFee}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleInfluencerPayPlatformFee}
              disabled={payingPlatformFee}
              className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {payingPlatformFee ? 'Processing...' : 'Pay with Razorpay'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            Platform fee payment is required before submitting work.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Benefits</p>
            <p className="text-sm text-gray-400 mt-1">
              Ensures clean records for the collaboration, faster support in disputes, and a verified completion trail.
            </p>
          </div>
          {platformFeeError ? <p className="text-xs text-error-500">{platformFeeError}</p> : null}
        </div>
      </Modal>

      <Modal
        open={showSubmitWorkModal}
        onClose={() => setShowSubmitWorkModal(false)}
        title={completionPercentage === 100 ? 'Submit work' : 'Update progress'}
        maxWidthClassName="max-w-md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowSubmitWorkModal(false)}
              disabled={submittingWork}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitWork}
              disabled={submittingWork}
              className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submittingWork ? 'Saving...' : completionPercentage === 100 ? 'Submit' : 'Update'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            {completionPercentage === 100
              ? 'Mark the collaboration as complete and submit for brand approval.'
              : 'Update your work progress. You can continue updating until reaching 100%.'}
          </p>
          <div>
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
        </div>
      </Modal>

      <Modal
        open={showApproveWorkModal}
        onClose={() => setShowApproveWorkModal(false)}
        title="Approve work?"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowApproveWorkModal(false)}
              disabled={approvingWork}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApproveWork}
              disabled={approvingWork}
              className="px-4 py-2 bg-green-500 hover:bg-green-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {approvingWork ? 'Approving...' : 'Approve'}
            </button>
          </div>
        }
      >
        <p className="text-gray-400 text-sm">Approve this work and mark collaboration as complete?</p>
      </Modal>

      <Modal
        open={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        title="Decline proposal"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeclineModal(false)}
              disabled={responding}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmDecline}
              disabled={responding}
              className="px-4 py-2 bg-error-500/90 hover:bg-error-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {responding ? 'Declining...' : 'Decline'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            Please share a short reason so the promoter understands why you declined.
          </p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={4}
            placeholder="Optional: e.g. timeline doesn't work, budget too low, not available"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
          />
        </div>
      </Modal>

      <Modal
        open={showMarkPaidModal}
        onClose={() => setShowMarkPaidModal(false)}
        title="Mark advance paid"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowMarkPaidModal(false)}
              disabled={markingPaid}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmMarkPaid}
              disabled={markingPaid}
              className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {markingPaid ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-gray-400 text-sm text-left">Add payment details (optional) for reference.</p>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-md font-medium text-gray-300 mb-2">Paid on</label>
              <input
                type="date"
                value={paymentPaidOn}
                onChange={(e) => setPaymentPaidOn(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              />
            </div>
            <div>
              <label className="block text-md font-medium text-gray-300 mb-2">Payment method</label>
              <input
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="UPI / Bank transfer / Cash / Other"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              />
            </div>
            <div>
              <label className="block text-md font-medium text-gray-300 mb-2">Transaction ID</label>
              <input
                value={paymentTransactionId}
                onChange={(e) => setPaymentTransactionId(e.target.value)}
                placeholder="Reference / UTR / UPI ID (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              />
            </div>
            <div>
              <label className="block text-md font-medium text-gray-300 mb-2">Payment proof (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
              />
              {paymentProofFile ? (
                <p className="text-xs text-gray-500 mt-1">Selected: {paymentProofFile.name}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-md font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
                placeholder="Any additional notes (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
              />
            </div>
          </div>
        </div>
      </Modal>

      <div className="-mx-0 mt-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
        {canAccept && (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-300">
              You have received a proposal from{' '}
              <span className={isInfluencer ? 'text-primary-500' : 'text-secondary-500'}>{otherUserName}</span>. Continue with the proposal.
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAccept}
                disabled={responding}
                className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {responding ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={openDeclineModal}
                disabled={responding}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {!canAccept && proposalStatus === 'created' && !isInfluencer && (
          <div className="text-sm text-gray-300">
            Waiting for <span className="text-secondary-500">{otherUserName}</span> to accept or decline your proposal.
          </div>
        )}

        {proposalStatus === 'cancelled' && (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-300">
              Proposal declined.
              {proposal.declineReason ? <span className="text-gray-400"> Reason: {proposal.declineReason}</span> : null}
            </div>
            {!isInfluencer && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleReopenEdit}
                  disabled={updatingProposal}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Reopen & Edit
                </button>
              </div>
            )}
          </div>
        )}

        {proposalStatus === 'discussing' && (
          <div className="text-sm text-gray-300">Proposal accepted. Continue discussion in chat.</div>
        )}

        {canFinalize && (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-300">Finalize the proposal once you’ve agreed on terms.</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowFinalizeModal(true)}
                className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Finalize proposal
              </button>
            </div>
          </div>
        )}

        {canAcceptTerms && (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-300">Accept the finalized terms to proceed to payment.</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAcceptTerms}
                disabled={acceptingTerms}
                className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {acceptingTerms ? 'Accepting...' : 'Accept terms'}
              </button>
            </div>
          </div>
        )}

        {canMarkAsPaid && (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-300">Proposal agreed. Mark the advance payment as paid to start work.</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openMarkPaidModal}
                disabled={markingPaid}
                className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Mark advance paid
              </button>
            </div>
          </div>
        )}

        {isInfluencer && workStatus === 'in_progress' && !proposal.influencerSubmittedWork && (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-300">Update your work progress.</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setCompletionPercentage(proposal.completionPercentage);
                  const influencerFeePaid = influencerPlatformFeePaid || influencerFeePaidOverride;
                  if (proposal.completionPercentage === 100 && !influencerFeePaid) {
                    setShowInfluencerPlatformFeeModal(true);
                    return;
                  }
                  setShowSubmitWorkModal(true);
                }}
                className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {proposal.completionPercentage === 100
                  ? 'Submit work'
                  : `Update progress (${proposal.completionPercentage}%)`}
              </button>
            </div>
          </div>
        )}

        {canApproveWork && (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-300">Review the submitted work.</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowApproveWorkModal(true)}
                disabled={approvingWork}
                className="px-4 py-2 bg-green-500 hover:bg-green-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {approvingWork ? 'Approving...' : 'Approve & complete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
