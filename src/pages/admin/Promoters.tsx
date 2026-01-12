// ============================================
// ADMIN - PROMOTERS LIST PAGE
// ============================================

import { useState, useEffect } from 'react';
import { useAllPromoters, useBanUser, useUnbanUser, useAssignTrusted, useRemoveTrusted, useAssignVerification, useRemoveVerification } from '../../hooks/useAdmin';
import { useAuthStore } from '../../stores';
import { useNavigate } from 'react-router-dom';
import { HiMagnifyingGlass, HiNoSymbol, HiCheck, HiEye, HiBuildingOffice } from 'react-icons/hi2';
import { MdVerified, MdVerifiedUser } from 'react-icons/md';
import type { User } from '../../types';
import { logAdminAction } from '../../hooks/useAdmin';

export default function AdminPromoters() {
  const { user: adminUser, startImpersonation } = useAuthStore();
  const { fetchPromoters } = useAllPromoters();
  const { banUser } = useBanUser();
  const { unbanUser } = useUnbanUser();
  const { assignTrusted } = useAssignTrusted();
  const { removeTrusted } = useRemoveTrusted();
  const { assignVerification } = useAssignVerification();
  const { removeVerification } = useRemoveVerification();
  const navigate = useNavigate();

  const [promoters, setPromoters] = useState<User[]>([]);
  const [filteredPromoters, setFilteredPromoters] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPromoters();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPromoters(promoters);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = promoters.filter((prom) =>
        prom.promoterProfile?.name?.toLowerCase().includes(query) ||
        prom.email?.toLowerCase().includes(query)
      );
      setFilteredPromoters(filtered);
    }
  }, [searchQuery, promoters]);

  const loadPromoters = async () => {
    setLoading(true);
    const data = await fetchPromoters();
    setPromoters(data);
    setFilteredPromoters(data);
    setLoading(false);
  };

  const handleBan = async (userId: string, userEmail: string, userName: string) => {
    const displayName = userName || userEmail || 'this user';
    if (!confirm(`Are you sure you want to ban ${displayName}?`)) {
      return;
    }

    const reason = prompt('Enter reason for banning this user:');
    if (!reason || !reason.trim()) {
      alert('Reason is required to ban a user.');
      return;
    }

    setActionLoading(userId);
    const result = await banUser(
      userId,
      userEmail || 'unknown',
      reason,
      adminUser!.uid,
      adminUser!.email
    );

    if (result.success) {
      await loadPromoters();
    } else {
      alert(`Failed to ban user: ${result.error}`);
    }
    setActionLoading(null);
  };

  const handleUnban = async (userId: string, userEmail: string, userName: string) => {
    const displayName = userName || userEmail || 'this user';
    if (!confirm(`Are you sure you want to unban ${displayName}?`)) {
      return;
    }

    setActionLoading(userId);
    const result = await unbanUser(
      userId,
      userEmail || 'unknown',
      adminUser!.uid,
      adminUser!.email
    );

    if (result.success) {
      await loadPromoters();
    } else {
      alert(`Failed to unban user: ${result.error}`);
    }
    setActionLoading(null);
  };

  const handleToggleTrusted = async (userId: string, userEmail: string, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'remove' : 'assign';
    const displayName = userName || userEmail || 'this user';
    if (!confirm(`Are you sure you want to ${action} trusted badge to ${displayName}?`)) {
      return;
    }

    setActionLoading(userId);
    const result = currentStatus
      ? await removeTrusted(userId, userEmail || 'unknown', adminUser!.uid, adminUser!.email, 'promoter')
      : await assignTrusted(userId, userEmail || 'unknown', adminUser!.uid, adminUser!.email, 'promoter');

    if (result.success) {
      await loadPromoters();
    } else {
      alert(`Failed to update trusted badge: ${result.error}`);
    }
    setActionLoading(null);
  };

  const handleToggleVerification = async (userId: string, userEmail: string, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'remove' : 'assign';
    const displayName = userName || userEmail || 'this user';
    if (!confirm(`Are you sure you want to ${action} verification to ${displayName}?`)) {
      return;
    }

    setActionLoading(userId);
    const result = currentStatus
      ? await removeVerification(userId, userEmail || 'unknown', adminUser!.uid, adminUser!.email, 'promoter')
      : await assignVerification(userId, userEmail || 'unknown', adminUser!.uid, adminUser!.email, 'promoter');

    if (result.success) {
      await loadPromoters();
    } else {
      alert(`Failed to update verification: ${result.error}`);
    }
    setActionLoading(null);
  };

  const handleImpersonate = async (targetUser: User) => {
    // Cannot impersonate other admins
    if (targetUser.roles.includes('admin')) {
      alert('Cannot impersonate other admin users.');
      return;
    }

    // Store original user data before starting impersonation
    const originalUserData = adminUser!;

    // Start impersonation (swaps user in authStore)
    await startImpersonation(targetUser, originalUserData.uid);

    // Log the action
    await logAdminAction(
      originalUserData.uid,
      originalUserData.email || 'admin',
      'impersonate_start',
      targetUser.uid,
      targetUser.email
    );

    // Navigate to the user's dashboard
    if (targetUser.roles.includes('influencer')) {
      navigate('/influencer/dashboard');
    } else if (targetUser.roles.includes('promoter')) {
      navigate('/promoter/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading promoters...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Promoters</h1>
        <p className="text-gray-400">Manage all promoters on the platform</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by company name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/50"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Promoters</p>
          <p className="text-2xl font-bold text-white">{promoters.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Verified</p>
          <p className="text-2xl font-bold text-green-400">
            {promoters.filter((i) => i.verificationBadges?.promoterVerified).length}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Trusted</p>
          <p className="text-2xl font-bold text-[#00D9FF]">
            {promoters.filter((i) => i.verificationBadges?.promoterTrusted).length}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Banned</p>
          <p className="text-2xl font-bold text-red-400">
            {promoters.filter((i) => i.isBanned).length}
          </p>
        </div>
      </div>

      {/* Promoters Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Badges</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPromoters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No promoters found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPromoters.map((promoter) => (
                  <tr key={promoter.uid} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <HiBuildingOffice className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {promoter.promoterProfile?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {promoter.promoterProfile?.type === 'agency' ? 'Agency' : 'Individual'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{promoter.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {promoter.verificationBadges?.promoterVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                            <MdVerified className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {promoter.verificationBadges?.promoterTrusted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00D9FF]/10 text-[#00D9FF] text-xs rounded-full">
                            <MdVerifiedUser className="w-3 h-3" />
                            Trusted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {promoter.isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full">
                          <HiNoSymbol className="w-3 h-3" />
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                          <HiCheck className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleImpersonate(promoter)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Impersonate user"
                        >
                          <HiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleTrusted(
                            promoter.uid,
                            promoter.email,
                            promoter.promoterProfile?.name || '',
                            promoter.verificationBadges?.promoterTrusted || false
                          )}
                          disabled={actionLoading === promoter.uid}
                          className="p-1.5 text-gray-400 hover:text-[#00D9FF] hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                          title={promoter.verificationBadges?.promoterTrusted ? 'Remove trusted badge' : 'Assign trusted badge'}
                        >
                          <MdVerifiedUser className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleVerification(
                            promoter.uid,
                            promoter.email,
                            promoter.promoterProfile?.name || '',
                            promoter.verificationBadges?.promoterVerified || false
                          )}
                          disabled={actionLoading === promoter.uid}
                          className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                          title={promoter.verificationBadges?.promoterVerified ? 'Remove verification' : 'Assign verification'}
                        >
                          <MdVerified className="w-4 h-4" />
                        </button>
                        {promoter.isBanned ? (
                          <button
                            onClick={() => handleUnban(promoter.uid, promoter.email, promoter.promoterProfile?.name || '')}
                            disabled={actionLoading === promoter.uid}
                            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Unban user"
                          >
                            <HiCheck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBan(promoter.uid, promoter.email, promoter.promoterProfile?.name || '')}
                            disabled={actionLoading === promoter.uid}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Ban user"
                          >
                            <HiNoSymbol className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
