// ============================================
// INFLUENCER EARNINGS PAGE
// ============================================

import { useEffect, useState } from 'react';
import { Info, Star } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../stores';

interface EarningsData {
  totalEarnings: number;
  pendingAmount: number;
  availableBalance: number;
  inProgressAmount: number;
  completedProjects: number;
  activeProjects: number;
}

export default function InfluencerEarnings() {
  const { user } = useAuthStore();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    pendingAmount: 0,
    availableBalance: 0,
    inProgressAmount: 0,
    completedProjects: 0,
    activeProjects: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    // Fetch proposals to calculate earnings
    const proposalsQuery = query(
      collection(db, 'proposals'),
      where('influencerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeProposals = onSnapshot(proposalsQuery, (snapshot) => {
      const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const completedProjects = proposals.filter((p: any) => p.workStatus === 'approved');
      const inProgressProjects = proposals.filter((p: any) => p.workStatus === 'in_progress');
      const agreedProjectsAwaitingCompletion = proposals.filter((p: any) =>
        p.proposalStatus === 'agreed' && p.workStatus !== 'approved' && p.proposalStatus !== 'cancelled'
      );

      // Total earnings from completed projects
      const totalEarnings = completedProjects.reduce((sum: number, p: any) => sum + (p.finalAmount || 0), 0);

      // Pending amount = finalized + in progress (awaiting completion/approval)
      const pendingAmount = [...agreedProjectsAwaitingCompletion, ...inProgressProjects].reduce(
        (sum: number, p: any) => sum + (p.finalAmount || 0),
        0
      );

      // Available balance (completed and released)
      const availableBalance = totalEarnings;

      // In progress amount (currently working on)
      const inProgressAmount = inProgressProjects.reduce((sum: number, p: any) => {
        const advanceAmount = p.advanceAmount || 0;
        const remainingAmount = p.remainingAmount || 0;
        return sum + advanceAmount + remainingAmount;
      }, 0);

      setEarnings({
        totalEarnings,
        pendingAmount,
        availableBalance,
        inProgressAmount,
        completedProjects: completedProjects.length,
        activeProjects: inProgressProjects.length + agreedProjectsAwaitingCompletion.length,
      });

      setLoading(false);
    }, (error) => {
      console.error('Error fetching proposals:', error);
      setLoading(false);
    });

    // Fetch transactions (when transaction collection is implemented)
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('receiverId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(transactionsData);
    }, (error) => {
      console.error('Error fetching transactions:', error);
      // Transactions collection might not exist yet, that's okay
    });

    return () => {
      unsubscribeProposals();
      unsubscribeTransactions();
    };
  }, [user?.uid]);

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'advance':
        return 'text-[#00D9FF]';
      case 'final':
        return 'text-green-400';
      case 'refund':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'advance':
        return 'Advance Payment';
      case 'final':
        return 'Final Payment';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Earnings</h1>
        <p className="text-gray-400">Track your payments and earnings</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
        </div>
      ) : (
        <>
          {/* Earnings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Earnings */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white mb-1">₹{earnings.totalEarnings.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Total Earnings</p>
            </div>

            {/* Available Balance */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white mb-1">₹{earnings.availableBalance.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Available Balance</p>
            </div>

            {/* Pending Amount */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white mb-1">₹{earnings.pendingAmount.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Pending Amount</p>
            </div>

            {/* In Progress */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{earnings.activeProjects}</p>
              <p className="text-gray-400 text-sm">Active Projects</p>
            </div>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Project Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Completed Projects</span>
                  <span className="text-white font-semibold">{earnings.completedProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Active Projects</span>
                  <span className="text-white font-semibold">{earnings.activeProjects}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-[#00D9FF] h-2 rounded-full transition-all"
                    style={{
                      width: `${earnings.completedProjects + earnings.activeProjects > 0
                        ? (earnings.completedProjects / (earnings.completedProjects + earnings.activeProjects)) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Schedule</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#00D9FF] rounded-full"></div>
                    <span className="text-gray-400">Advance (upfront)</span>
                  </div>
                  <span className="text-white">
                    {user?.influencerProfile?.pricing?.advancePercentage || 30}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-400">Final (on completion)</span>
                  </div>
                  <span className="text-white">
                    {100 - (user?.influencerProfile?.pricing?.advancePercentage || 30)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Advance percentage is configurable in Settings
                </p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Transaction History</h2>
              <p className="text-gray-400 text-sm mt-1">Your recent payments and transactions</p>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">No transactions yet</h3>
                <p className="text-gray-400 text-sm">
                  Your payment history will appear here once you start completing projects
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-6 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-lg font-semibold ${getTransactionTypeColor(transaction.type)}`}>
                            {getTransactionTypeLabel(transaction.type)}
                          </span>
                          {transaction.status === 'completed' && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              Completed
                            </span>
                          )}
                          {transaction.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'Processing...'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          transaction.type === 'refund' ? 'text-red-400' : 'text-white'
                        }`}>
                          {transaction.type === 'refund' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-[#00D9FF]/5 border border-[#00D9FF]/20 rounded-2xl p-6">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-[#00D9FF] flex-shrink-0" />
                <h3 className="text-white font-semibold">How payments work</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Escrow Payment Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium text-white">Escrow Payment</h4>
                  <span className="px-2 py-1 bg-[#00D9FF]/20 text-[#00D9FF] text-xs rounded-full">Coming Soon</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#00D9FF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Discuss project with brand</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#00D9FF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Brand pays to platform (escrow)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#00D9FF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Get your advance payment instantly</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#00D9FF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Complete the work</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#00D9FF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Receive remaining amount after approval</span>
                  </div>
                </div>
              </div>
              
              {/* Direct Payment Card */}
              <div className="bg-[#00D9FF]/5 border border-[#00D9FF]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium text-white">Direct Payment</h4>
                  <span className="px-2 py-1 bg-[#B8FF00]/20 text-[#B8FF00] text-xs rounded-full">Available</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#B8FF00] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Discuss project with brand</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#B8FF00] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Get paid directly by brand</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#B8FF00] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Submit payment proof</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#B8FF00] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Complete the work</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#B8FF00] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Build your portfolio & reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
