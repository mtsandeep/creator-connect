// ============================================
// ADMIN - DASHBOARD PAGE
// ============================================

import { useState, useEffect } from 'react';
import { useAllInfluencers, useAllPromoters, useAdminLogs } from '../../hooks/useAdmin';
import { Link } from 'react-router-dom';
import {
  HiUsers,
  HiBuildingOffice,
  HiDocumentText,
  HiExclamationTriangle,
  HiArrowRight,
} from 'react-icons/hi2';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface DashboardStats {
  totalInfluencers: number;
  totalPromoters: number;
  activeProposals: number;
  totalProposals: number;
  bannedUsers: number;
  trustedUsers: number;
  verifiedUsers: number;
}

export default function AdminDashboard() {
  const { fetchInfluencers } = useAllInfluencers();
  const { fetchPromoters } = useAllPromoters();
  const { fetchLogs } = useAdminLogs();

  const [stats, setStats] = useState<DashboardStats>({
    totalInfluencers: 0,
    totalPromoters: 0,
    activeProposals: 0,
    totalProposals: 0,
    bannedUsers: 0,
    trustedUsers: 0,
    verifiedUsers: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    // Load users
    const [influencers, promoters, logs, proposalsSnapshot] = await Promise.all([
      fetchInfluencers(),
      fetchPromoters(),
      fetchLogs(10),
      getDocs(query(collection(db, 'proposals'))),
    ]);

    const allUsers = [...influencers, ...promoters];

    setStats({
      totalInfluencers: influencers.length,
      totalPromoters: promoters.length,
      activeProposals: proposalsSnapshot.docs.filter(
        (d) => ['pending', 'discussing', 'finalized', 'in_progress'].includes(d.data().status)
      ).length,
      totalProposals: proposalsSnapshot.size,
      bannedUsers: allUsers.filter((u) => u.isBanned).length,
      trustedUsers: allUsers.filter((u) => u.verificationBadges?.trusted).length,
      verifiedUsers: allUsers.filter((u) => u.verificationBadges?.verified).length,
    });

    setRecentLogs(logs);
    setLoading(false);
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      ban_user: 'Banned User',
      unban_user: 'Unbanned User',
      assign_trusted: 'Assigned Trusted',
      remove_trusted: 'Removed Trusted',
      assign_admin: 'Assigned Admin',
      impersonate_start: 'Started Impersonation',
      impersonate_end: 'Ended Impersonation',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      ban_user: 'text-red-400 bg-red-500/10',
      unban_user: 'text-green-400 bg-green-500/10',
      assign_trusted: 'text-[#00D9FF] bg-[#00D9FF]/10',
      remove_trusted: 'text-yellow-400 bg-yellow-500/10',
      assign_admin: 'text-purple-400 bg-purple-500/10',
      impersonate_start: 'text-orange-400 bg-orange-500/10',
      impersonate_end: 'text-gray-400 bg-gray-500/10',
    };
    return colors[action] || 'text-gray-400 bg-gray-500/10';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of platform activity and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center">
              <HiUsers className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <Link
              to="/admin/influencers"
              className="text-[#00D9FF] hover:underline text-sm flex items-center gap-1"
            >
              View <HiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-gray-400 text-sm">Total Influencers</p>
          <p className="text-2xl font-bold text-white">{stats.totalInfluencers}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <HiBuildingOffice className="w-5 h-5 text-purple-400" />
            </div>
            <Link
              to="/admin/promoters"
              className="text-purple-400 hover:underline text-sm flex items-center gap-1"
            >
              View <HiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-gray-400 text-sm">Total Promoters</p>
          <p className="text-2xl font-bold text-white">{stats.totalPromoters}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HiDocumentText className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Active Proposals</p>
          <p className="text-2xl font-bold text-white">{stats.activeProposals}</p>
          <p className="text-xs text-gray-500 mt-1">of {stats.totalProposals} total</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <HiExclamationTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Banned Users</p>
          <p className="text-2xl font-bold text-white">{stats.bannedUsers}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Verified Users</p>
          <p className="text-xl font-bold text-green-400">{stats.verifiedUsers}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Trusted Users</p>
          <p className="text-xl font-bold text-[#00D9FF]">{stats.trustedUsers}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Total Users</p>
          <p className="text-xl font-bold text-white">{stats.totalInfluencers + stats.totalPromoters}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/admin/influencers"
            className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <HiUsers className="w-5 h-5 text-[#00D9FF]" />
            <span className="text-white">Manage Influencers</span>
          </Link>
          <Link
            to="/admin/promoters"
            className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <HiBuildingOffice className="w-5 h-5 text-purple-400" />
            <span className="text-white">Manage Promoters</span>
          </Link>
          <Link
            to="/admin/verifications"
            className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <HiDocumentText className="w-5 h-5 text-blue-400" />
            <span className="text-white">Manage Badges</span>
          </Link>
        </div>
      </div>

      {/* Recent Admin Activity */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Recent Admin Activity</h2>
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {recentLogs.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No recent activity</div>
          ) : (
            <div className="divide-y divide-white/10">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-medium">{log.adminEmail}</span>
                        {log.targetUserEmail && (
                          <>
                            {' → '}
                            <span className="text-gray-300">{log.targetUserEmail}</span>
                          </>
                        )}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-gray-500 mt-0.5">Reason: {log.reason}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
