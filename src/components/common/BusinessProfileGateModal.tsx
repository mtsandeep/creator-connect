import type { ReactNode } from 'react';
import { FiStar } from 'react-icons/fi';
import Modal from './Modal';

interface BusinessProfileGateModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer: ReactNode;
}

export default function BusinessProfileGateModal({
  open,
  onClose,
  title,
  description,
  footer,
}: BusinessProfileGateModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClassName="max-w-lg" footer={footer}>
      <div className="space-y-4">
        {description ? <p className="text-gray-400 text-sm text-center">{description}</p> : null}
        <ul className="space-y-2 text-left">
          <li className="flex items-start gap-2 text-sm text-gray-400">
            <FiStar className="mt-0.5 text-[#B8FF00] flex-shrink-0" />
            <span>Invoices and receipts require legal billing details.</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-400">
            <FiStar className="mt-0.5 text-[#B8FF00] flex-shrink-0" />
            <span>It helps us generate professional records for the collaboration.</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-400">
            <FiStar className="mt-0.5 text-[#B8FF00] flex-shrink-0" />
            <span>All data stored securely and only shared with people you collaborate with.</span>
          </li>
        </ul>
      </div>
    </Modal>
  );
}
