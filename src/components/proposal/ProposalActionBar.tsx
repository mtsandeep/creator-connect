import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import {
  useRespondToProposal,
  useUpdateProposal,
  useUpdateProposalStatus,
  useCloseProposal,
  useInfluencerSubmitWork,
  useMarkAsPaid,
  usePromoterApproveWork,
  usePromoterRequestRevision,
} from '../../hooks/useProposal';
import { useNavigate } from 'react-router-dom';
import { usePlatformFeePayment } from '../../hooks/usePlatformFeePayment';
import { toast } from '../../stores/uiStore';
import { useAuthStore } from '../../stores';
import type { Proposal } from '../../types';
import Modal from '../common/Modal';
import BusinessProfileGateModal from '../common/BusinessProfileGateModal';
import DeliverableTracker from './DeliverableTracker';

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
  const { user } = useAuthStore();
  const { acceptProposal, declineProposal, loading: responding } = useRespondToProposal();
  const { closeProposal, loading: closingProposal } = useCloseProposal();
  useUpdateProposalStatus();
  const { payPlatformFee, loading: payingPlatformFee } = usePlatformFeePayment();
  const { markAsPaid, loading: markingPaid } = useMarkAsPaid();
  const { submitWork, loading: submittingWork } = useInfluencerSubmitWork();
  const { approveWork, loading: approvingWork } = usePromoterApproveWork();
  const { requestRevision, loading: requestingRevision } = usePromoterRequestRevision();
  const { loading: updatingProposal } = useUpdateProposal();

  const [showBusinessProfileGate, setShowBusinessProfileGate] = useState(false);

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

  const isDisputed = workStatus === 'disputed';

  if (isDisputed) {
    return null;
  }

  const influencerPlatformFeePaid = Boolean(proposal.fees?.paidBy?.influencer);

  const canAccept =
    !isDisputed && isInfluencer && (proposalStatus === 'sent' || proposalStatus === 'edited');

  const canCloseProposal =
    !isDisputed && !isInfluencer && (proposalStatus === 'sent' || proposalStatus === 'edited');

  const canMarkAsPaid =
    !isDisputed &&
    !isInfluencer &&
    (proposalStatus === 'accepted' || proposalStatus === 'edited') &&
    (paymentStatus === 'pending_advance' || paymentStatus === 'pending_escrow');
  const canApproveWork = !isDisputed && !isInfluencer && workStatus === 'submitted';
  const canRequestRevision = !isDisputed && !isInfluencer && workStatus === 'submitted';

  const canUpdateOrSubmitWork =
    !isDisputed &&
    isInfluencer &&
    (workStatus === 'revision_requested' || workStatus === 'in_progress');

  const shouldRenderActionCard =
    canAccept ||
    (!canAccept && (proposalStatus === 'sent' || proposalStatus === 'edited') && !isInfluencer) ||
    proposalStatus === 'declined' ||
    proposalStatus === 'closed' ||
    canCloseProposal ||
    canMarkAsPaid ||
    canUpdateOrSubmitWork ||
    canApproveWork;

  const platformFeeBase = 49;

  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState(false);
  const [completedDeliverables, setCompletedDeliverables] = useState<string[]>(proposal.completedDeliverables || []);
  const [workUpdateNote, setWorkUpdateNote] = useState('');
  const [showInfluencerPlatformFeeModal, setShowInfluencerPlatformFeeModal] = useState(false);
  const [influencerFeePaidOverride, setInfluencerFeePaidOverride] = useState(false);

  const [showRequestRevisionModal, setShowRequestRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState(proposal.declineReason || '');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState(proposal.closedReason || '');

  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [paymentProofType, setPaymentProofType] = useState<'advance' | 'remaining'>('advance');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentPaidOn, setPaymentPaidOn] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  const getScheduleItemAmount = (type: 'advance' | 'remaining') => {
    const schedule = Array.isArray(proposal.paymentSchedule) ? proposal.paymentSchedule : [];
    const item = schedule.find((s: any) => s?.type === type);
    if (item && typeof item.amount === 'number') return item.amount;
    if (type === 'advance' && typeof proposal.advanceAmount === 'number') return proposal.advanceAmount;
    if (type === 'remaining' && typeof proposal.remainingAmount === 'number') return proposal.remainingAmount;
    return 0;
  };

  const getAdvancePaidAt = (): number | null => {
    const schedule = Array.isArray(proposal.paymentSchedule) ? proposal.paymentSchedule : [];
    const advanceItem = schedule.find((s: any) => s?.type === 'advance');
    const paidAt = advanceItem?.paidAt;
    return typeof paidAt === 'number' && Number.isFinite(paidAt) ? paidAt : null;
  };

  const advanceAmountForMessage = getScheduleItemAmount('advance');
  const paymentProofAmount = getScheduleItemAmount(paymentProofType);

  const openMarkRemainingPaidModal = () => {
    setPaymentMethod('');
    setPaymentTransactionId('');
    setPaymentNotes('');
    setPaymentProofFile(null);
    try {
      const now = new Date();
      const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
      setPaymentPaidOn(new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16));
    } catch {
      setPaymentPaidOn('');
    }
    setPaymentProofType('remaining');
    setShowMarkPaidModal(true);
  };

  const handleReopenEdit = async () => {
    navigate(`/promoter/proposals/${proposal.id}/edit`);
  };

  const openDeclineModal = () => {
    setDeclineReason(proposal.declineReason || '');
    setShowDeclineModal(true);
  };

  const confirmDecline = async () => {
    await declineProposal(proposal.id, declineReason);
    setShowDeclineModal(false);
  };

  const openCloseModal = () => {
    setCloseReason(proposal.closedReason || '');
    setShowCloseModal(true);
  };

  const confirmClose = async () => {
    await closeProposal(proposal.id, closeReason);
    setShowCloseModal(false);
  };

  const openMarkPaidModal = () => {
    setPaymentMethod('');
    setPaymentTransactionId('');
    setPaymentNotes('');
    setPaymentProofFile(null);
    try {
      const now = new Date();
      const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
      setPaymentPaidOn(new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16));
    } catch {
      setPaymentPaidOn('');
    }
    setPaymentProofType('advance');
    setShowMarkPaidModal(true);
  };

  const confirmMarkPaid = async () => {
    const paidAtTimestamp = paymentPaidOn ? new Date(paymentPaidOn).getTime() : Date.now();
    await markAsPaid(proposal.id, {
      method: paymentMethod.trim() || undefined,
      transactionId: paymentTransactionId.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
      paidAt: paidAtTimestamp,
    }, paymentProofFile || undefined);

    setShowMarkPaidModal(false);
  };

  // Route-based edit handles reopen on save

  const handleAccept = async () => {
    if (isInfluencer && !user?.businessProfile?.influencer?.isComplete) {
      setShowBusinessProfileGate(true);
      return;
    }

    await acceptProposal(proposal.id);
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

      if (computedCompletionPercentage === 100) {
        const submitResult = await submitWork(proposal.id, {
          deliverables: proposal.deliverables || [],
          completedDeliverables,
          note: workUpdateNote.trim() || undefined,
        });

        if (submitResult.success) {
          showInfo('Work submitted', 'Waiting for brand approval.');
        }
      } else {
        showInfo('Platform fee paid');
      }
    } else {
      const message = result.message;
      if (message === 'Payment cancelled') {
        toast.info('Payment cancelled.');
      } else {
        toast.error(message || 'Failed to process platform fee payment.');
      }
    }
  };

  const computedCompletionPercentage = (() => {
    const deliverables = Array.isArray(proposal.deliverables) ? proposal.deliverables : [];
    if (deliverables.length === 0) return 0;
    const completedCount = deliverables.filter((d) => completedDeliverables.includes(d)).length;
    return Math.round((completedCount / deliverables.length) * 100);
  })();

  const handleSubmitWork = async () => {
    const influencerFeePaid = influencerPlatformFeePaid || influencerFeePaidOverride;
    if (computedCompletionPercentage === 100 && !influencerFeePaid) {
      setShowSubmitWorkModal(false);
      setShowInfluencerPlatformFeeModal(true);
      return;
    }

    const result = await submitWork(proposal.id, {
      deliverables: proposal.deliverables || [],
      completedDeliverables,
      note: workUpdateNote.trim() || undefined,
    });
    if (result.success) {
      setShowSubmitWorkModal(false);
      if (computedCompletionPercentage === 100) {
        showInfo('Work submitted', 'Waiting for brand approval.');
      } else {
        showInfo('Progress updated', 'Progress updated. You can continue updating until all deliverables are completed.');
      }
    }
  };

  const handleApproveWork = async () => {
    const paidAtTimestamp = paymentPaidOn ? new Date(paymentPaidOn).getTime() : Date.now();
    const paymentResult = await markAsPaid(
      proposal.id,
      {
        method: paymentMethod.trim() || undefined,
        transactionId: paymentTransactionId.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
        paidAt: paidAtTimestamp,
      },
      paymentProofFile || undefined,
      'remaining'
    );

    if (!paymentResult.success) return;

    const result = await approveWork(proposal.id);
    if (result.success) {
      setShowMarkPaidModal(false);
      showInfo('Collaboration completed', 'Remaining payment recorded and work approved.');
    }
  };

  const handleRequestRevision = async () => {
    const result = await requestRevision(proposal.id, revisionReason);
    if (result.success) {
      setShowRequestRevisionModal(false);
      setRevisionReason('');
      showInfo('Revision requested', 'The influencer has been asked to make changes and resubmit.');
    }
  };

  return (
    <>
      <BusinessProfileGateModal
        open={showBusinessProfileGate}
        onClose={() => setShowBusinessProfileGate(false)}
        title="Business profile required"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => {
                sessionStorage.setItem('businessProfileRedirect', JSON.stringify({ to: `/influencer/proposals/${proposal.id}` }));
                navigate('/influencer/business-profile');
              }}
              className="px-4 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Complete business profile
            </button>
          </div>
        }
      />

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
        {infoModal.message && <p className="text-gray-400 text-sm text-center">{infoModal.message}</p>}
      </Modal>

      <Modal
        open={showRequestRevisionModal}
        onClose={() => setShowRequestRevisionModal(false)}
        title="Request revision"
        maxWidthClassName="max-w-md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowRequestRevisionModal(false)}
              disabled={requestingRevision}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestRevision}
              disabled={requestingRevision || !revisionReason.trim()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {requestingRevision ? 'Requesting...' : 'Request revision'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">Describe what needs to be changed so the influencer can resubmit.</p>
          <textarea
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            placeholder="e.g. Please adjust the caption and add the product tag."
          />
        </div>
      </Modal>

      <Modal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close proposal"
        maxWidthClassName="max-w-md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowCloseModal(false)}
              disabled={closingProposal}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmClose}
              disabled={closingProposal || !closeReason.trim()}
              className="px-4 py-2 bg-red-500 hover:bg-red-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {closingProposal ? 'Closing...' : 'Close proposal'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">Provide a reason for closing this proposal.</p>
          <textarea
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            placeholder="e.g. Campaign paused / no longer required"
          />
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
              {payingPlatformFee ? 'Processing...' : 'Proceed to Pay'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-lg font-medium text-gray-300">
            Platform Fee{' '}
            <span className="text-gray-500 line-through">₹99</span>{' '}
            <span className="text-[#B8FF00] font-semibold">₹{platformFeeBase}</span>
            <span className="text-gray-500 text-sm"> + GST</span>
          </p>

          <div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <FiStar className="mt-0.5 text-[#B8FF00] flex-shrink-0" />
                <span>Clean record-keeping for payments, deliverables, and approvals</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <FiStar className="mt-0.5 text-[#B8FF00] flex-shrink-0" />
                <span>Invoice Generation and Tax ready documents</span>
              </li>
            </ul>
          </div>

          {null}
        </div>
      </Modal>

      <Modal
        open={showSubmitWorkModal}
        onClose={() => setShowSubmitWorkModal(false)}
        title={computedCompletionPercentage === 100 ? 'Submit work' : 'Update progress'}
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
              {submittingWork ? 'Saving...' : computedCompletionPercentage === 100 ? 'Submit' : 'Update'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            {computedCompletionPercentage === 100
              ? 'Mark the collaboration as complete and submit for brand approval.'
              : 'Update your work by checking off deliverables. Add a note if anything changed.'}
          </p>
          <DeliverableTracker
            deliverables={proposal.deliverables || []}
            completedDeliverables={completedDeliverables}
            editable
            onToggle={(deliverable) => {
              setCompletedDeliverables((prev) =>
                prev.includes(deliverable) ? prev.filter((d) => d !== deliverable) : [...prev, deliverable]
              );
            }}
          />
          <div>
            <label className="text-sm text-gray-300">What changed? (optional)</label>
            <textarea
              value={workUpdateNote}
              onChange={(e) => setWorkUpdateNote(e.target.value)}
              rows={3}
              className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              placeholder="e.g. Updated caption, added product tag, changed thumbnail"
            />
          </div>
        </div>
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
        title={paymentProofType === 'advance' ? 'Mark advance paid' : 'Mark remaining paid'}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowMarkPaidModal(false)}
              disabled={paymentProofType === 'remaining' ? (markingPaid || approvingWork) : markingPaid}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={paymentProofType === 'advance' ? confirmMarkPaid : handleApproveWork}
              disabled={paymentProofType === 'remaining' ? (markingPaid || approvingWork) : markingPaid}
              className={paymentProofType === 'remaining'
                ? 'px-4 py-2 bg-green-500 hover:bg-green-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer'
                : 'px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer'}
            >
              {paymentProofType === 'remaining'
                ? (markingPaid || approvingWork ? 'Completing...' : 'Complete')
                : (markingPaid ? 'Saving...' : 'Confirm')}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-gray-400 text-sm text-left">
            {paymentProofType === 'advance'
              ? 'Add payment details (optional) for reference.'
              : 'Mark the remaining payment as paid to complete the collaboration.'}
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Amount to be paid</span>
              <span className="text-white font-semibold">₹{Number(paymentProofAmount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-md font-medium text-gray-300 mb-2">Paid on</label>
              <input
                type="datetime-local"
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

      {shouldRenderActionCard ? (
        <div className="mt-6 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden">
          {/* Header with Status */}
          <div className="bg-gradient-to-r from-white/[0.05] to-transparent px-4 py-3 border-b border-white/5">
            {proposalStatus === 'declined' ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-400">
                    {isInfluencer ? 'You Declined the Proposal' : 'Proposal Declined'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {isInfluencer 
                      ? 'You did not accept this proposal' 
                      : 'Your proposal was not accepted'
                    }
                  </p>
                </div>
              </div>
            ) : canApproveWork ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-400">Work completed!</h3>
                  <p className="text-sm text-gray-400">Review and approve the submitted work</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#B8FF00] rounded-full animate-pulse"></div>
                <h3 className="text-white font-semibold">Proposal Actions</h3>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="px-6 py-5 space-y-5">
        {canAccept && (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-300">
              {proposalStatus === 'edited' 
                ? 'The promoter has edited the proposal. Please review the changes and respond.'
                : 'You have received a proposal from ' + (isInfluencer ? 'the brand' : otherUserName) + '. Continue with the proposal.'
              }
            </div>
          </div>
        )}

        {!canAccept && proposalStatus === 'sent' && !isInfluencer && (
          <div className="text-sm text-gray-300">
            Waiting for <span className="text-secondary-500">{otherUserName}</span> to accept or decline your proposal.
          </div>
        )}

        {proposalStatus === 'declined' && (
          <div className="flex flex-col gap-4">
            {proposal.declineReason && (
              <div className="bg-gradient-to-r from-red-500/[0.05] to-orange-500/[0.05] border-l-4 border-red-500/30 rounded-r-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-200 leading-relaxed italic">
                      "{proposal.declineReason}"
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Provided by {isInfluencer ? 'you' : (otherUserName || 'the client')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {canMarkAsPaid && (
          <div className="text-sm text-gray-300">
            Proposal is accepted. Please pay ₹{Number(advanceAmountForMessage || 0).toLocaleString()} to start the work.
          </div>
        )}

        {canUpdateOrSubmitWork && paymentStatus === 'advance_paid' && (
          <div className="text-sm text-gray-300">
            Advance paid on{' '}
            {(() => {
              const paidAt = getAdvancePaidAt();
              return paidAt ? new Date(paidAt).toLocaleDateString() : '—';
            })()}
            . Please submit work when done.
          </div>
        )}

        {isInfluencer && workStatus === 'revision_requested' && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-300">
              Revision requested by <span className="text-secondary-500">{otherUserName}</span>. Please update your work and resubmit.
            </div>
            {proposal.revisionReason && (
              <div className="bg-gradient-to-r from-orange-500/[0.05] to-red-500/[0.05] border-l-4 border-orange-500/30 rounded-r-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-xs font-medium text-orange-300 uppercase tracking-wide">Feedback</span>
                    </div>
                    <div className="text-sm text-gray-200 leading-relaxed italic">
                      "{proposal.revisionReason}"
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {canApproveWork && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-300">
              Work submitted by <span className="text-secondary-500">{otherUserName}</span> for review.
            </div>
            {(() => {
              const log = Array.isArray(proposal.workUpdateLog) ? proposal.workUpdateLog : [];
              const last = log.length > 0 ? log[log.length - 1] : null;
              const lastNote = typeof last?.note === 'string' ? last.note.trim() : '';

              if (!lastNote) return null;

              return (
              <div className="bg-gradient-to-r from-blue-500/[0.05] to-cyan-500/[0.05] border-l-4 border-blue-500/30 rounded-r-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-xs font-medium text-blue-300 uppercase tracking-wide">Work Update</span>
                    </div>
                    <div className="text-sm text-gray-200 leading-relaxed">
                      {lastNote}
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
        )}
          </div>
          
          {/* Footer with Actions */}
          <div className="bg-gradient-to-r from-white/[0.02] to-transparent px-4 py-3 border-t border-white/5">
            <div className="flex flex-wrap gap-3">
              {/* Accept/Decline buttons */}
              {canAccept && (
                <>
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
                </>
              )}
              
              {/* Reopen & Edit button */}
              {proposalStatus === 'declined' && !isInfluencer && (
                <button
                  onClick={handleReopenEdit}
                  disabled={updatingProposal}
                  className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Reopen Proposal
                </button>
              )}

              {canCloseProposal && (
                <button
                  onClick={openCloseModal}
                  disabled={closingProposal}
                  className="px-4 py-2 bg-red-500 hover:bg-red-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {closingProposal ? 'Closing...' : 'Close proposal'}
                </button>
              )}
              
              {/* Awaiting response for influencers */}
              {proposalStatus === 'declined' && isInfluencer && (
                <div className="text-sm text-gray-400 italic">
                  Awaiting response from brand
                </div>
              )}
              
              {/* Other action buttons */}
              {canMarkAsPaid && (
                <button
                  onClick={openMarkPaidModal}
                  disabled={markingPaid}
                  className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Mark advance paid
                </button>
              )}
              
              {canUpdateOrSubmitWork && (
                <button
                  onClick={() => {
                    const influencerFeePaid = influencerPlatformFeePaid || influencerFeePaidOverride;
                    const initialCompleted = proposal.completedDeliverables
                      ? proposal.completedDeliverables
                      : proposal.completionPercentage === 100
                        ? proposal.deliverables || []
                        : [];
                    setCompletedDeliverables(initialCompleted);
                    setWorkUpdateNote('');

                    if (proposal.completionPercentage === 100 && !influencerFeePaid) {
                      setShowInfluencerPlatformFeeModal(true);
                      return;
                    }
                    setShowSubmitWorkModal(true);
                  }}
                  className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {(() => {
                    const deliverables = proposal.deliverables || [];
                    const completed = proposal.completedDeliverables
                      ? proposal.completedDeliverables
                      : proposal.completionPercentage === 100
                        ? deliverables
                        : [];
                    const completedCount = deliverables.filter((d) => completed.includes(d)).length;

                    if (deliverables.length > 0 && completedCount === deliverables.length) return 'Submit work';
                    if (deliverables.length > 0) return `Update deliverables (${completedCount}/${deliverables.length})`;
                    return 'Update progress';
                  })()}
                </button>
              )}
              
              {canApproveWork && (
                <>
                  {canRequestRevision && (
                    <button
                      onClick={() => {
                        setRevisionReason(proposal.revisionReason || '');
                        setShowRequestRevisionModal(true);
                      }}
                      disabled={requestingRevision}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Request revision
                    </button>
                  )}
                  <button
                    onClick={openMarkRemainingPaidModal}
                    disabled={markingPaid || approvingWork}
                    className="px-4 py-2 bg-green-500 hover:bg-green-500/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {markingPaid || approvingWork ? 'Completing...' : 'Approve work'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
