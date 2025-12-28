// ============================================
// PROMOTER DASHBOARD PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface DashboardStats {
  activeProposals: number;
  pendingResponse: number;
  inProgressProjects: number;
  totalSpent: number;
  pendingPayments: number;
  unreadMessages: number;
}

export default function PromoterDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeProposals: 0,
    pendingResponse: 0,
    inProgressProjects: 0,
    totalSpent: 0,
    pendingPayments: 0,
    unreadMessages: 0,
  });
  const [recentProposals, setRecentProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    // Query proposals for this promoter
    const proposalsQuery = query(
      collection(db, 'proposals'),
      where('promoterId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(proposalsQuery, (snapshot) => {
      const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate stats
      const activeProposals = proposals.filter((p: any) =>
        ['pending', 'discussing', 'finalized', 'in_progress'].includes(p.status)
      ).length;

      const pendingResponse = proposals.filter((p: any) => p.status === 'pending').length;

      const inProgressProjects = proposals.filter((p: any) => p.status === 'in_progress').length;

      // Calculate spending
      const completedProposals = proposals.filter((p: any) => p.status === 'completed');
      const totalSpent = completedProposals.reduce((sum: number, p: any) => sum + (p.finalAmount || 0), 0);

      const pendingPayments = proposals
        .filter((p: any) => ['finalized', 'in_progress'].includes(p.status))
        .reduce((sum: number, p: any) => sum + (p.finalAmount || 0), 0);

      // Count unread messages
      const unreadMessages = proposals.reduce((sum: number, p: any) => {
        return sum + (p.status === 'pending' ? 1 : 0);
      }, 0);

      setStats({
        activeProposals,
        pendingResponse,
        inProgressProjects,
        totalSpent,
        pendingPayments,
        unreadMessages,
      });

      // Get recent proposals (top 5)
      setRecentProposals(proposals.slice(0, 5));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching proposals:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'discussing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'finalized':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'in_progress':
        return 'bg-[#B8FF00]/20 text-[#B8FF00] border-[#B8FF00]/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Awaiting Response';
      case 'discussing':
        return 'Discussing';
      case 'finalized':
        return 'Awaiting Payment';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8FF00]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back, {user?.promoterProfile?.name || 'Promoter'}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Proposals */}
        <div
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-[#B8FF00]/50 transition-colors"
          onClick={() => navigate('/promoter/proposals')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#B8FF00]/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {stats.pendingResponse > 0 && (
              <span className="bg-[#B8FF00] text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                {stats.pendingResponse} pending
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.activeProposals}</p>
          <p className="text-gray-400 text-sm">Active Proposals</p>
        </div>

        {/* In Progress */}
        <div
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-[#B8FF00]/50 transition-colors"
          onClick={() => navigate('/promoter/proposals')}
        >
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.inProgressProjects}</p>
          <p className="text-gray-400 text-sm">In Progress</p>
        </div>

        {/* Total Spent */}
        <div
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-[#B8FF00]/50 transition-colors"
          onClick={() => navigate('/promoter/proposals')}
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white mb-1">₹{stats.totalSpent.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">Total Spent</p>
        </div>

        {/* Pending Payments */}
        <div
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-[#B8FF00]/50 transition-colors"
          onClick={() => navigate('/promoter/proposals')}
        >
          <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white mb-1">₹{stats.pendingPayments.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">Pending Payments</p>
        </div>
      </div>

      {/* Recent Proposals */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Proposals</h2>
            <p className="text-gray-400 text-sm mt-1">Your latest collaboration activities</p>
          </div>
          <button
            onClick={() => navigate('/promoter/proposals')}
            className="text-[#B8FF00] hover:text-[#B8FF00]/80 text-sm font-medium"
          >
            View All →
          </button>
        </div>

        {recentProposals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">No proposals yet</h3>
            <p className="text-gray-400 text-sm mb-4">
              Start by discovering and connecting with influencers
            </p>
            <button
              onClick={() => navigate('/promoter/browse')}
              className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors"
            >
              Browse Influencers
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {recentProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => navigate(`/promoter/proposals?id=${proposal.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{proposal.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{proposal.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      {proposal.deadline && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(proposal.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {proposal.finalAmount && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ₹{proposal.finalAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}
                  >
                    {getStatusLabel(proposal.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/promoter/browse')}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-left hover:border-[#B8FF00]/50 transition-all group"
        >
          <div className="w-12 h-12 bg-[#B8FF00]/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-1">Browse Influencers</h3>
          <p className="text-gray-400 text-sm">Discover and connect with creators</p>
        </button>

        <button
          onClick={() => navigate('/promoter/messages')}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-left hover:border-[#B8FF00]/50 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {stats.unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B8FF00] text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                {stats.unreadMessages}
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold mb-1">Messages</h3>
          <p className="text-gray-400 text-sm">Chat with influencers about projects</p>
        </button>

        <button
          onClick={() => navigate('/promoter/profile')}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-left hover:border-[#B8FF00]/50 transition-all group"
        >
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-1">Edit Profile</h3>
          <p className="text-gray-400 text-sm">Update your brand profile</p>
        </button>
      </div>
    </div>
  );
}
