// ============================================
// IMPERSONATION BANNER COMPONENT
// ============================================

import { useAuthStore } from '../../stores';
import { useNavigate } from 'react-router-dom';
import { logAdminAction } from '../../hooks/useAdmin';

export default function ImpersonationBanner() {
  const { impersonation, endImpersonation, user } = useAuthStore();
  const navigate = useNavigate();

  if (!impersonation) {
    return null;
  }

  const displayName = user?.influencerProfile?.displayName
    || user?.promoterProfile?.name
    || user?.email
    || 'Unknown';

  const handleExitImpersonation = async () => {
    // Log the action before ending
    await logAdminAction(
      impersonation.originalUserId,
      impersonation.originalUserData.email || 'admin',
      'impersonate_end',
      impersonation.impersonatedUserId,
      user?.email
    );

    // End impersonation (restores original user data)
    await endImpersonation(impersonation.originalUserData);

    // Navigate back to admin dashboard
    navigate('/admin/dashboard');
  };

  return (
    <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <span className="font-semibold">Viewing as: </span>
          <span className="font-bold">{displayName}</span>
          <span className="ml-2 text-orange-100 text-sm">(View-only mode)</span>
        </div>
      </div>
      <button
        onClick={handleExitImpersonation}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Exit Impersonation
      </button>
    </div>
  );
}
