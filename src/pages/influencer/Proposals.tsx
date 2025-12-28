// ============================================
// INFLUENCER PROPOSALS PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../stores';
import { toast } from '../../stores/uiStore';

type FilterStatus = 'all' | 'pending' | 'discussing' | 'finalized' | 'in_progress' | 'completed' | 'cancelled';

const FILTERS: { value: FilterStatus; label: string; count?: number }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'New' },
  { value: 'discussing', label: 'Discussing' },
  { value: 'finalized', label: 'Finalized' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function InfluencerProposals() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if a specific proposal ID is in the URL
    const proposalId = searchParams.get('id');
    if (proposalId) {
      navigate(`/influencer/proposals/${proposalId}`, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    const proposalsQuery = query(
      collection(db, 'proposals'),
      where('influencerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(proposalsQuery, (snapshot) => {
      const proposalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProposals(proposalsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching proposals:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        status: 'discussing',
        updatedAt: serverTimestamp(),
      });
      toast.success('Proposal accepted! Start chatting with the brand.');
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Failed to accept proposal');
    }
  };

  const handleDeclineProposal = async (proposalId: string) => {
    if (!confirm('Are you sure you want to decline this proposal?')) return;

    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      toast.success('Proposal declined');
    } catch (error) {
      console.error('Error declining proposal:', error);
      toast.error('Failed to decline proposal');
    }
  };

  const filteredProposals = filter === 'all'
    ? proposals
    : proposals.filter(p => p.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'discussing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'finalized':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'in_progress':
        return 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/30';
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
        return 'New Proposal';
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

  const filterCounts = FILTERS.map(f => ({
    ...f,
    count: f.value === 'all' ? proposals.length : proposals.filter(p => p.status === f.value).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Proposals</h1>
        <p className="text-gray-400">View and manage your collaboration proposals</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filterCounts.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-[#00D9FF] text-gray-900'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === f.value ? 'bg-gray-900/20 text-gray-900' : 'bg-white/10'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">No proposals found</h3>
          <p className="text-gray-400 text-sm">
            {filter === 'all'
              ? 'When brands send you collaboration proposals, they\'ll appear here'
              : `No ${filter} proposals`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{proposal.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}
                        >
                          {getStatusLabel(proposal.status)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{proposal.description}</p>
                    </div>
                  </div>

                  {/* Requirements */}
                  {proposal.requirements && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Requirements:</p>
                      <p className="text-sm text-gray-300">{proposal.requirements}</p>
                    </div>
                  )}

                  {/* Deliverables */}
                  {proposal.deliverables && proposal.deliverables.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Deliverables:</p>
                      <div className="flex flex-wrap gap-2">
                        {proposal.deliverables.map((deliverable: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/5 rounded text-sm text-gray-300"
                          >
                            {deliverable}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {proposal.deadline && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Deadline: {new Date(proposal.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {proposal.finalAmount && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Budget: ₹{proposal.finalAmount.toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                  <button
                    onClick={() => navigate(`/influencer/proposals/${proposal.id}`)}
                    className="flex-1 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-medium px-4 py-2 rounded-xl transition-colors text-sm"
                  >
                    View Details
                  </button>

                  {proposal.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAcceptProposal(proposal.id)}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium px-4 py-2 rounded-xl transition-colors border border-green-500/30 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineProposal(proposal.id)}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium px-4 py-2 rounded-xl transition-colors border border-red-500/30 text-sm"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {proposal.status === 'discussing' && (
                    <button
                      onClick={() => navigate(`/influencer/messages?proposal=${proposal.id}`)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"
                    >
                      Open Chat
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
