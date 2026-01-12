import { FiAlertTriangle, FiCheckCircle, FiGift, FiInfo, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { useDashboardMessages } from '../hooks/useDashboardMessages';

function getIntentStyles(intent: string) {
  switch (intent) {
    case 'success':
      return {
        container: 'bg-green-500/10 border-green-500/30',
        title: 'text-green-400',
        icon: <FiCheckCircle className="w-5 h-5 text-green-400" />,
        cta: 'text-green-400 hover:text-green-400/80',
      };
    case 'warning':
      return {
        container: 'bg-yellow-500/10 border-yellow-500/30',
        title: 'text-yellow-400',
        icon: <FiAlertTriangle className="w-5 h-5 text-yellow-400" />,
        cta: 'text-yellow-400 hover:text-yellow-400/80',
      };
    case 'promo':
      return {
        container: 'bg-gradient-to-r from-[#B8FF00]/10 to-[#00D9FF]/10 border-[#B8FF00]/30',
        title: 'text-[#B8FF00]',
        icon: <FiGift className="w-5 h-5 text-[#B8FF00]" />,
        cta: 'text-[#B8FF00] hover:text-[#B8FF00]/80',
      };
    case 'info':
    default:
      return {
        container: 'bg-white/5 border-white/10',
        title: 'text-[#00D9FF]',
        icon: <FiInfo className="w-5 h-5 text-[#00D9FF]" />,
        cta: 'text-[#00D9FF] hover:text-[#00D9FF]/80',
      };
  }
}

export default function DashboardMessageBar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { messages, dismissMessage } = useDashboardMessages(user);

  if (!messages.length) return null;

  return (
    <div className="space-y-3 mb-6">
      {messages.map((message) => {
        const styles = getIntentStyles(message.intent);

        return (
          <div
            key={message.id}
            className={`${styles.container} border rounded-xl p-4`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {message.iconEmoji ? (
                  <span className="text-lg leading-none">{message.iconEmoji}</span>
                ) : (
                  styles.icon
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`${styles.title} font-medium mb-1`}>{message.title}</p>
                <p className="text-gray-300 text-sm mb-2">{message.body}</p>

                {message.ctaLabel && message.ctaPath && (
                  <button
                    onClick={() => navigate(message.ctaPath!)}
                    className={`${styles.cta} text-sm font-medium`}
                  >
                    {message.ctaLabel} →
                  </button>
                )}
              </div>

              {message.dismissible && (
                <button
                  onClick={() => dismissMessage(message.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
