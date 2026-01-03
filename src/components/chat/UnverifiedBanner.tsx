import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UnverifiedBannerProps {
  onClose?: () => void;
}

export default function UnverifiedBanner({ onClose }: UnverifiedBannerProps) {
  const navigate = useNavigate();

  const handleVerify = () => {
    // Navigate to verification flow
    navigate('/promoter/settings?tab=verification');
  };

  return (
    <div className="bg-gradient-to-r from-[#FF3366]/20 to-[#FF3366]/10 border-l-4 border-[#FF3366] rounded-r-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#FF3366] flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <h3 className="text-[#FF3366] font-semibold mb-1">
            You're using an unverified account
          </h3>

          <div className="space-y-2 mb-3">
            <p className="text-gray-300 text-sm">
              Complete verification to get these benefits:
            </p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#00FF94] flex-shrink-0" />
                <span>Keep conversation history for future access</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#00FF94] flex-shrink-0" />
                <span>Professional proposal tracking</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#00FF94] flex-shrink-0" />
                <span>Tax documentation & invoices</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#00FF94] flex-shrink-0" />
                <span>Access to all influencers</span>
              </li>
            </ul>

            <div className="bg-[#0F172A] rounded-lg p-3 mt-2">
              <p className="text-[#FFC700] text-sm font-medium">
                ⚠️ Important: Without verification, your conversations will be deleted after
                7 days of inactivity or work completion.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerify}
              className="bg-gradient-to-r from-[#00D9FF] to-[#00A8CC] text-[#0F172A] font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Complete Signup & Verify
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
