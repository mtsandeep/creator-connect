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

    const totalCredits = activeCredits.reduce((sum, credit) => sum + credit.remainingAmount, 0);
    
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

  if (!user.verificationBadges?.promoterVerified) {
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
          <div className="flex items-start justify-between">
            <span className="text-sm text-gray-400 mt-1">Available Credits</span>
            <div className="text-right">
              <div className="text-lg font-semibold text-[#B8FF00]">
                {formatCredits(creditsInfo.totalCredits)}
              </div>
            </div>
          </div>

          {/* Credits List */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            {creditsInfo.activeCredits
              .slice()
              .sort((a, b) => b.expiryDate - a.expiryDate)
              .map((credit, index) => {
                const daysUntilExpiry = Math.ceil((credit.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysUntilExpiry <= 7;

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border ${isExpiringSoon
                        ? 'bg-orange-500/5 border-orange-500/20'
                        : 'bg-white/5 border-white/10'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium text-sm">
                            ₹{credit.remainingAmount.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            of ₹{credit.amount.toLocaleString()}
                          </span>
                          {credit.source === 'signup' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                              Signup Bonus
                            </span>
                          )}
                          {credit.source === 'verification' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                              Verification Reward
                            </span>
                          )}
                          {credit.source === 'purchase' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                              Purchased
                            </span>
                          )}
                        </div>
                        <span className={`text-xs ${isExpiringSoon ? 'text-orange-400' : 'text-gray-500'}`}>
                          Expires: {formatExpiryDate(credit.expiryDate)}
                        </span>
                      </div>
                      {isExpiringSoon && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">
                          {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} left
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-gray-400">
              20% additional discount when using credits to pay platform fees
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
