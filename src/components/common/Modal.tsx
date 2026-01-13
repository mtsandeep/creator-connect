import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ReactNode } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: ReactNode;
  iconColor?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  showHeaderBorder?: boolean;
  position?: 'top' | 'center';
  topOffset?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  titleIcon,
  iconColor = 'text-green-400',
  children,
  footer,
  maxWidthClassName = 'max-w-md',
  showHeaderBorder = false,
  position = 'top',
  topOffset = '5dvh',
}: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div className={`fixed inset-x-0 p-4 flex ${position === 'center' ? 'inset-y-0 items-center justify-center' : 'justify-center'}`} style={position === 'top' ? { top: topOffset } : undefined}>
        <DialogPanel
          className={`w-full ${maxWidthClassName} bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90dvh]`}
        >
          <div className={`relative px-6 pt-4 pb-4 flex-shrink-0 ${showHeaderBorder ? 'border-b border-white/10 mb-4' : ''}`}>
            <div className="flex items-center gap-3 justify-center">
              {titleIcon && (
                <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
                  {titleIcon}
                </div>
              )}
              {title && <DialogTitle className="text-xl font-bold text-white uppercase">{title}</DialogTitle>}
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
