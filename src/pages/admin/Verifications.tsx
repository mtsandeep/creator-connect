// ============================================
// ADMIN - VERIFICATIONS PAGE
// ============================================

import { useState, useEffect } from 'react';
import { useAllInfluencers, useAllPromoters, useAssignTrusted, useRemoveTrusted } from '../../hooks/useAdmin';
import { useAuthStore } from '../../stores';
import { HiShieldCheck, HiUser, HiBuildingOffice } from 'react-icons/hi2';
import type { User } from '../../types';

type TabType = 'influencers' | 'promoters';

export default function AdminVerifications() {
  const { user: adminUser } = useAuthStore();
  const { fetchInfluencers } = useAllInfluencers();
  const { fetchPromoters } = useAllPromoters();
  const { assignTrusted } = useAssignTrusted();
  const { removeTrusted } = useRemoveTrusted();

  const [influencers, setInfluencers] = useState<User[]>([]);
  const [promoters, setPromoters] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('influencers');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [infData, promData] = await Promise.all([
      fetchInfluencers(),
      fetchPromoters(),
    ]);
    setInfluencers(infData);
    setPromoters(promData);
    setLoading(false);
  };

  const handleToggleTrusted = async (userId: string, userEmail: string, currentStatus: boolean) => {
    const action = currentStatus ? 'remove' : 'assign';
    if (!confirm(`Are you sure you want to ${action} trusted badge to ${userEmail}?`)) {
      return;
    }

    setActionLoading(userId);
    const result = currentStatus
      ? await removeTrusted(userId, userEmail, adminUser!.uid, adminUser!.email)
      : await assignTrusted(userId, userEmail, adminUser!.uid, adminUser!.email);

    if (result.success) {
      await loadData();
    } else {
      alert(`Failed to update trusted badge: ${result.error}`);
    }
    setActionLoading(null);
  };

  const currentList = activeTab === 'influencers' ? influencers : promoters;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Verification Badges</h1>
        <p className="text-gray-400">Manage verified and trusted badges for users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('influencers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'influencers'
              ? 'bg-[#00D9FF]/10 text-[#00D9FF]'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <HiUser className="w-4 h-4" />
          Influencers ({influencers.length})
        </button>
        <button
          onClick={() => setActiveTab('promoters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'promoters'
              ? 'bg-[#00D9FF]/10 text-[#00D9FF]'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <HiBuildingOffice className="w-4 h-4" />
          Promoters ({promoters.length})
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Badges</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                currentList.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {activeTab === 'influencers' ? (
                          <>
                            <img
                              src={user.influencerProfile?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                              alt=""
                              className="w-8 h-8 rounded-full bg-white/10"
                            />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {user.influencerProfile?.displayName || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {user.influencerProfile?.username || '@username'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                              <HiBuildingOffice className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {user.promoterProfile?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {user.promoterProfile?.type === 'agency' ? 'Agency' : 'Individual'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.verificationBadges?.verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#B8FF00]/10 text-[#B8FF00] text-xs rounded-full">
                            <HiShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {user.verificationBadges?.trusted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00D9FF]/10 text-[#00D9FF] text-xs rounded-full">
                            <HiShieldCheck className="w-3 h-3" />
                            Trusted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleTrusted(
                            user.uid,
                            user.email,
                            user.verificationBadges?.trusted || false
                          )}
                          disabled={actionLoading === user.uid}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            user.verificationBadges?.trusted
                              ? 'bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00D9FF]/20'
                              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                          } disabled:opacity-50`}
                        >
                          <HiShieldCheck className="w-3.5 h-3.5" />
                          {user.verificationBadges?.trusted ? 'Remove Trusted' : 'Add Trusted'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <h3 className="text-sm font-medium text-white mb-3">Badge Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#B8FF00]/10 text-[#B8FF00] text-xs rounded-full">
              <HiShieldCheck className="w-3 h-3" />
              Verified
            </span>
            <span className="text-gray-400">Auto-assigned after first completed project</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00D9FF]/10 text-[#00D9FF] text-xs rounded-full">
              <HiShieldCheck className="w-3 h-3" />
              Trusted
            </span>
            <span className="text-gray-400">Manually assigned by admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
