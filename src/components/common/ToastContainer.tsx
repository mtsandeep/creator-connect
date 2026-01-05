import { useUIStore } from '../../stores';

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (!toasts.length) {
    return null;
  }

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-green-500/10 text-green-200';
      case 'error':
        return 'border-red-500/30 bg-red-500/10 text-red-200';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-100';
      case 'info':
      default:
        return 'border-[#00D9FF]/30 bg-[#00D9FF]/10 text-[#B3F4FF]';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-[min(420px,calc(100vw-2rem))]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`border rounded-xl px-4 py-3 backdrop-blur-sm shadow-lg ${getToastStyles(t.type)}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-snug">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
