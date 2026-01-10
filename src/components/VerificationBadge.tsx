import { useMemo } from 'react';
import type { User } from '../types';
import { LuCircleCheck } from 'react-icons/lu';

interface VerificationBadgeProps {
  user: User;
}

export function VerificationBadge({ user }: VerificationBadgeProps) {
  const creditsInfo = useMemo(() => {
    if (!user.promoterProfile?.credits || user.promoterProfile.credits.length === 0) {
      return {
        totalCredits: 0,
        nextExpiry: null,
        activeCredits: [],
      };
    }

    const now = Date.now();
    const activeCredits = user.promoterProfile.credits.filter(
      credit => credit.expiryDate > now
    );

    const totalCredits = activeCredits.reduce((sum, credit) => sum + credit.amount, 0);
    
    // Find the next credit batch to expire
    const nextExpiry = activeCredits
      .map(credit => credit.expiryDate)
      .sort((a, b) => a - b)[0] || null;

    return {
      totalCredits,
      nextExpiry,
      activeCredits,
    };
  }, [user.promoterProfile?.credits]);

  const formatExpiryDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCredits = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!user.isPromoterVerified) {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <LuCircleCheck className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Verified Brand</h3>
            <p className="text-sm text-green-400">Verification complete</p>
          </div>
        </div>
      </div>

      {creditsInfo.totalCredits > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Available Credits</span>
            <span className="text-lg font-semibold text-[#B8FF00]">
              {formatCredits(creditsInfo.totalCredits)}
            </span>
          </div>

          {creditsInfo.nextExpiry && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Next Expiry</span>
              <span className="text-sm text-gray-300">
                {formatExpiryDate(creditsInfo.nextExpiry)}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-gray-400">
              20% discount when using credits to pay platform fees
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
