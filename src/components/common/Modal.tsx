import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ReactNode } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidthClassName = 'max-w-md',
}: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full ${maxWidthClassName} bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        >
          <div className="relative px-6 pt-6 pb-8 flex-shrink-0">
            <div className="flex flex-col items-center text-center gap-1 uppercase">
              {title && <DialogTitle className="text-xl font-bold text-white">{title}</DialogTitle>}
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pb-6 overflow-y-auto flex-1">{children}</div>

          {footer && <div className="px-6 pb-4 pt-4 flex justify-center flex-shrink-0">{footer}</div>}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
