// ============================================
// INFLUENCER DASHBOARD PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DashboardMessageBar from '../../components/DashboardMessageBar';
import VerificationTasksMessageBar from '../../components/VerificationTasksMessageBar';
import { MdVerified, MdVerifiedUser } from 'react-icons/md';

interface DashboardStats {
  activeProposals: number;
  pendingProposals: number;
  inProgressProjects: number;
  totalEarnings: number;
  pendingEarnings: number;
  unreadMessages: number;
}

export default function InfluencerDashboard() {
  const { user, refreshUserProfile } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeProposals: 0,
    pendingProposals: 0,
    inProgressProjects: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    unreadMessages: 0,
  });
  const [recentProposals, setRecentProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    refreshUserProfile();

    setLoading(true);

    // Query proposals for this influencer
    const proposalsQuery = query(
      collection(db, 'proposals'),
      where('influencerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(proposalsQuery, (snapshot) => {
      const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate stats
      const activeProposals = proposals.filter((p: any) =>
        ['created', 'discussing', 'changes_requested', 'agreed'].includes(p.proposalStatus) &&
        p.workStatus !== 'approved' &&
        p.proposalStatus !== 'cancelled'
      ).length;

      const pendingProposals = proposals.filter((p: any) => p.proposalStatus === 'created').length;

      const inProgressProjects = proposals.filter((p: any) => p.workStatus === 'in_progress').length;

      // Calculate earnings (would come from transactions in real app)
      const completedProposals = proposals.filter((p: any) => p.workStatus === 'approved');
      const totalEarnings = completedProposals.reduce((sum: number, p: any) => sum + (p.finalAmount || 0), 0);

      const pendingEarnings = proposals
        .filter((p: any) => p.workStatus === 'in_progress' || p.workStatus === 'submitted')
        .reduce((sum: number, p: any) => sum + (p.finalAmount || 0), 0);

      // Count unread messages
      const unreadMessages = proposals.reduce((sum: number, p: any) => {
        // This would query actual messages in real app
        return sum + (p.proposalStatus === 'created' ? 1 : 0);
      }, 0);

      setStats({
        activeProposals,
        pendingProposals,
        inProgressProjects,
        totalEarnings,
        pendingEarnings,
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

  const getStatusColor = (proposal: any) => {
    const proposalStatus = proposal?.proposalStatus;
    const workStatus = proposal?.workStatus;

    if (proposalStatus === 'created') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (proposalStatus === 'discussing') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (proposalStatus === 'changes_requested') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (proposalStatus === 'agreed') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (proposalStatus === 'cancelled') return 'bg-gray-500/20 text-gray-400 border-gray-500/30';

    if (workStatus === 'in_progress') return 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/30';
    if (workStatus === 'submitted') return 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/30';
    if (workStatus === 'approved') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (workStatus === 'disputed') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';

    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (proposal: any) => {
    const proposalStatus = proposal?.proposalStatus;
    const workStatus = proposal?.workStatus;

    if (workStatus === 'approved') return 'Completed';
    if (workStatus === 'submitted') return 'Submitted';
    if (workStatus === 'in_progress') return 'In Progress';
    if (workStatus === 'disputed') return 'Disputed';

    if (proposalStatus === 'created') return 'New Proposal';
    if (proposalStatus === 'discussing') return 'Discussing';
    if (proposalStatus === 'changes_requested') return 'Changes Requested';
    if (proposalStatus === 'agreed') return 'Agreed';
    if (proposalStatus === 'cancelled') return 'Cancelled';

    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <DashboardMessageBar />
      <VerificationTasksMessageBar />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">
              Welcome back, {user?.influencerProfile?.displayName || 'Creator'}!
            </p>
          </div>
          
          {/* Verification Badges */}
          <div className="flex items-center gap-2">
            {user?.verificationBadges?.influencerVerified && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 text-sm rounded-full border border-green-500/30">
                <MdVerified className="w-4 h-4" />
                Verified
              </span>
            )}
            {user?.verificationBadges?.influencerTrusted && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00D9FF]/10 text-[#00D9FF] text-sm rounded-full border border-[#00D9FF]/30">
                <MdVerifiedUser className="w-4 h-4" />
                Trusted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Proposals */}
        <div
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-[#00D9FF]/50 transition-colors"
          onClick={() => navigate('/influencer/proposals')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {stats.pendingProposals > 0 && (
              <span className="bg-[#00D9FF] text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                {stats.pendingProposals} new
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.activeProposals}</p>
          <p className="text-gray-400 text-sm">Active Proposals</p>
        </div>

        {/* In Progress */}
        <div
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-[#00D9FF]/50 transition-colors"
          onClick={() => navigate('/influencer/proposals')}
        >
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.inProgressProjects}</p>
          <p className="text-gray-400 text-sm">In Progress</p>
        </div>

        {/* Total Earnings */}
        <div
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-[#00D9FF]/50 transition-colors"
          onClick={() => navigate('/influencer/earnings')}
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white mb-1">₹{stats.totalEarnings.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">Total Earnings</p>
        </div>

        {/* Pending Earnings */}
        <div
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-[#00D9FF]/50 transition-colors"
          onClick={() => navigate('/influencer/earnings')}
        >
          <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white mb-1">₹{stats.pendingEarnings.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">Pending Earnings</p>
        </div>
      </div>

      {/* Recent Proposals */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Proposals</h2>
            <p className="text-gray-400 text-sm mt-1">Your latest collaboration opportunities</p>
          </div>
          <button
            onClick={() => navigate('/influencer/proposals')}
            className="text-[#00D9FF] hover:text-[#00D9FF]/80 text-sm font-medium"
          >
            View All →
          </button>
        </div>

        {recentProposals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">No proposals yet</h3>
            <p className="text-gray-400 text-sm mb-4">
              When brands send you collaboration proposals, they'll appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {recentProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => navigate(`/influencer/proposals/${proposal.id}`)}
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
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal)}`}
                  >
                    {getStatusLabel(proposal)}
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
          onClick={() => navigate('/influencer/profile')}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-left hover:border-[#00D9FF]/50 transition-all group"
        >
          <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-1">Edit Profile</h3>
          <p className="text-gray-400 text-sm">Update your profile info and rates</p>
        </button>

        <button
          onClick={() => navigate('/influencer/messages')}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-left hover:border-[#00D9FF]/50 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {stats.unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#00D9FF] text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                {stats.unreadMessages}
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold mb-1">Messages</h3>
          <p className="text-gray-400 text-sm">Chat with brands about projects</p>
        </button>

        <button
          onClick={() => navigate('/influencer/earnings')}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-left hover:border-[#00D9FF]/50 transition-all group"
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-1">Earnings</h3>
          <p className="text-gray-400 text-sm">Track your payments and earnings</p>
        </button>
      </div>
    </div>
  );
}
