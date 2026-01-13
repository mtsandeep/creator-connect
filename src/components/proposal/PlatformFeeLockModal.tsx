// ============================================
// PLATFORM FEE LOCK MODAL COMPONENT
// ============================================

import { useState } from 'react';
import { FaLock } from 'react-icons/fa';
import { FiAlertTriangle, FiCheck } from 'react-icons/fi';
import Modal from '../common/Modal';
import SecureProposalPaymentModal from './SecureProposalPaymentModal';

interface PlatformFeeLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInfluencer: boolean;
  isLocked: boolean;
  availableCredits: number;
  discountedFee: number;
  onPayWithCredits: () => void;
  onPayWithRazorpay: () => void;
  payingPlatformFee?: boolean;
}

export default function PlatformFeeLockModal({
  isOpen,
  onClose,
  isInfluencer,
  isLocked,
  availableCredits,
  discountedFee,
  onPayWithCredits,
  onPayWithRazorpay,
  payingPlatformFee = false,
}: PlatformFeeLockModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSecureProposal = () => {
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title={isLocked ? 'Proposal Secured' : 'Secure Proposal'}
        titleIcon={<FaLock size={20} />}
        iconColor={isLocked ? 'text-green-400' : 'text-orange-400'}
        maxWidthClassName="max-w-md"
        footer={
          <button
            onClick={isLocked ? onClose : handleSecureProposal}
            className={`px-6 py-2 font-semibold rounded-xl transition-colors ${
              isLocked
                ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                : 'bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900'
            }`}
          >
            {isLocked ? 'Got it' : 'Secure Proposal'}
          </button>
        }
      >

        <div className="space-y-4">
          {isLocked ? (
            <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
              <div className="flex items-center gap-3 text-green-400">
                <FiCheck className="flex-shrink-0" size={20} />
                <span className="font-medium">Proposal secured and stored</span>
              </div>
              <p className="text-sm text-gray-300 mt-3 ml-8">
                Your collaboration history and payment records are preserved. Tax documents are accessible anytime.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-red-400 text-sm font-medium mb-1">Automatic Archival</p>
                    <p className="text-red-300 text-sm">
                      Proposal data will be archived 7 days after completion if not secured.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white mb-3">Benefits of securing:</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <FiCheck className="text-green-400 flex-shrink-0" size={14} />
                    <span>Keep collaboration history organized</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheck className="text-green-400 flex-shrink-0" size={14} />
                    <span>Maintain payment records for tax filing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheck className="text-green-400 flex-shrink-0" size={14} />
                    <span>Generate tax-ready documents</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheck className="text-green-400 flex-shrink-0" size={14} />
                    <span>Prevent automatic archival</span>
                  </li>
                  {isInfluencer && (
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-green-400 flex-shrink-0" size={14} />
                      <span>Build professional portfolio</span>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Payment Modal */}
      <SecureProposalPaymentModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        isInfluencer={isInfluencer}
        availableCredits={availableCredits}
        discountedFee={discountedFee}
        regularFee={49}
        loading={payingPlatformFee}
        isPaid={isLocked}
        onPayWithCredits={onPayWithCredits}
        onPayWithRazorpay={onPayWithRazorpay}
      />
    </>
  );
}
