// ============================================
// SECURE PROPOSAL PAYMENT MODAL COMPONENT
// ============================================
// Modal for paying platform fee to secure proposal (accessed via lock icon)

import { FaLock } from 'react-icons/fa';
import { FiCheck, FiCheckCircle, FiStar } from 'react-icons/fi';
import Modal from '../common/Modal';

interface SecureProposalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInfluencer: boolean;
  availableCredits?: number;
  discountedFee: number;
  regularFee: number;
  loading?: boolean;
  isPaid?: boolean;
  onPayWithCredits?: () => void;
  onPayWithRazorpay: () => void;
}

export default function SecureProposalPaymentModal({
  isOpen,
  onClose,
  isInfluencer,
  availableCredits = 0,
  discountedFee,
  regularFee,
  loading = false,
  isPaid = false,
  onPayWithCredits,
  onPayWithRazorpay,
}: SecureProposalPaymentModalProps) {
  const hasEnoughCredits = !isInfluencer && availableCredits >= discountedFee;
  const useCredits = hasEnoughCredits && onPayWithCredits;
  const displayFee = isInfluencer ? regularFee : (hasEnoughCredits ? discountedFee : regularFee);

  const handlePayment = () => {
    if (useCredits) {
      onPayWithCredits!();
    } else {
      onPayWithRazorpay();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Secure Proposal"
      titleIcon={<FaLock size={20} />}
      iconColor="text-green-400"
      maxWidthClassName="max-w-md"
      footer={
        isPaid ? null : (
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full px-4 py-2 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900"
          >
            {loading ? 'Processing...' : (
              useCredits
                ? `Use ₹${displayFee} Credits`
                : `Pay ₹${displayFee} + GST`
            )}
          </button>
        )
      }
    >
      <div className="space-y-4">
        {/* Platform Fee Display */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          {isPaid ? (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-medium text-gray-300">
                  Platform Fee{' '}
                  <span className="text-green-400 font-semibold">Paid</span>
                </p>
                <p className="text-xs text-green-400 mt-1">
                  Your proposal is secured
                </p>
              </div>
              <FiCheck className="text-green-400 flex-shrink-0" size={24} />
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-medium text-gray-300">
                  Platform Fee{' '}
                  <span className="text-gray-500 line-through">₹99</span>{' '}
                  {useCredits ? (
                    <>
                      <span className="text-gray-500 line-through">₹{regularFee}</span>{' '}
                      <span className="text-[#B8FF00] font-semibold">₹{displayFee}</span>
                    </>
                  ) : (
                    <span className="text-[#B8FF00] font-semibold">₹{regularFee}</span>
                  )}
                  {!useCredits && <span className="text-gray-500 text-sm"> + GST</span>}
                </p>
                {useCredits ? (
                  <p className="text-xs text-green-400 mt-1">
                    20% discount applied using credits (₹{availableCredits} available)
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    One-time payment to secure your proposal
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white mb-3">
            {isPaid ? 'Your proposal is secured' : 'Why secure your proposal?'}
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <FiStar className="mt-0.5 text-[#B8FF00] flex-shrink-0" size={14} />
              <span>{isInfluencer
                ? 'Professional portfolio of brand collaborations'
                : 'Keep your collaboration history organized in one place'
              }</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <FiStar className="mt-0.5 text-[#B8FF00] flex-shrink-0" size={14} />
              <span>{isInfluencer
                ? 'Verified payment history for better opportunities'
                : 'Structured record-keeping for payments, deliverables, and approvals'
              }</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <FiCheckCircle className="mt-0.5 text-[#B8FF00] flex-shrink-0" size={14} />
              <span>Tax-ready documents for your business</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <FiCheckCircle className="mt-0.5 text-[#B8FF00] flex-shrink-0" size={14} />
              <span>Prevent automatic archival of your data</span>
            </li>
          </ul>
        </div>

        {/* Info Note */}
        <div className="rounded-lg bg-blue-400/10 border border-blue-400/20 p-3">
          <p className="text-xs text-blue-300">
            Once secured, your proposal data will be permanently stored and accessible for future reference, tax filing, and portfolio building.
          </p>
        </div>
      </div>
    </Modal>
  );
}
