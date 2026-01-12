// ============================================
// INFLUENCER PROPOSALS PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useProposals, useProposal } from '../../hooks/useProposal';
import ProposalCard from '../../components/proposal/ProposalCard';
import ProposalDetail from '../../components/proposal/ProposalDetail';
import CreateProposalForm from '../../components/proposal/CreateProposalForm';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type FilterStatus = 'all' | 'sent' | 'accepted' | 'edited' | 'declined' | 'closed' | 'in_progress' | 'approved';
type ViewMode = 'list' | 'create' | 'detail';

type UserNameMap = Record<string, string>;

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'New' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'edited', label: 'Updated' },
  { value: 'declined', label: 'Declined' },
  { value: 'closed', label: 'Closed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'approved', label: 'Completed' },
];

export default function InfluencerProposals() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { proposalId } = useParams<{ proposalId: string }>();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterStatus>('all');

  const { proposals, loading } = useProposals('influencer');
  const { proposal: selectedProposal, loading: detailLoading } = useProposal(proposalId || null);

  const [otherUserName, setOtherUserName] = useState<string>();
  const [promoterNames, setPromoterNames] = useState<UserNameMap>({});
  const [namesLoaded, setNamesLoaded] = useState(false);
  const [createProposalData, setCreateProposalData] = useState<{ influencerId?: string; influencerName?: string } | null>(null);

  // Check URL params for create mode (highest priority)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      const influencerId = params.get('influencerId');
      const influencerName = params.get('influencerName');
      if (influencerId && influencerName) {
        setCreateProposalData({ influencerId, influencerName });
        setViewMode('create');
        return;
      }
    }

    // If not create mode, check for proposal ID in URL path
    if (proposalId) {
      setViewMode('detail');
    } else {
      setViewMode('list');
    }
  }, [proposalId]);

  // Fetch all promoter names for proposals list
  useEffect(() => {
    const fetchPromoterNames = async () => {
      if (proposals.length > 0 && user) {
        const uniquePromoterIds = Array.from(new Set(proposals.map(p => p.promoterId)));
        const idsToFetch = uniquePromoterIds.filter(id => !promoterNames[id]);

        if (idsToFetch.length > 0) {
          const namePromises = idsToFetch.map(async (promoterId) => {
            const docSnapshot = await getDoc(doc(db, 'users', promoterId));
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              return { id: promoterId, name: data.promoterProfile?.name || data.email || 'Unknown' };
            }
            return { id: promoterId, name: 'Unknown' };
          });

          const results = await Promise.all(namePromises);
          const newNames = results.reduce((acc, { id, name }) => ({ ...acc, [id]: name }), {});
          setPromoterNames(newNames);
        }
        setNamesLoaded(true);
      }
    };

    fetchPromoterNames();
  }, [proposals, user]);

  // Fetch other user's name for proposal detail
  useEffect(() => {
    if (selectedProposal && user) {
      const otherUserId = selectedProposal.promoterId;
      getDoc(doc(db, 'users', otherUserId)).then((doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setOtherUserName(data.promoterProfile?.name || data.email);
        }
      });
    }
  }, [selectedProposal, user]);

  // Filter proposals (influencer's proposals)
  const filteredProposals = proposals.filter((proposal) => {
    if (filter === 'all') return true;

    const proposalStatus = proposal.proposalStatus;
    const workStatus = proposal.workStatus;

    switch (filter) {
      case 'sent':
        return proposalStatus === 'sent';
      case 'accepted':
        return proposalStatus === 'accepted' && workStatus !== 'approved';
      case 'edited':
        return proposalStatus === 'edited';
      case 'declined':
        return proposalStatus === 'declined';
      case 'closed':
        return proposalStatus === 'closed';
      case 'in_progress':
        return workStatus === 'in_progress' || workStatus === 'submitted';
      case 'approved':
        return workStatus === 'approved';
      default:
        return true;
    }
  });

  // Create Mode
  if (viewMode === 'create' && createProposalData?.influencerId && createProposalData?.influencerName) {
    return (
      <div className="p-8">
        <button
          onClick={() => {
            setViewMode('list');
            setCreateProposalData(null);
            navigate('/influencer/proposals');
          }}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Proposals
        </button>
        <CreateProposalForm
          influencerId={createProposalData.influencerId}
          influencerName={createProposalData.influencerName}
          onCancel={() => {
            setViewMode('list');
            setCreateProposalData(null);
            navigate('/influencer/proposals');
          }}
        />
      </div>
    );
  }

  // Detail Mode
  if (viewMode === 'detail' && selectedProposal) {
    if (detailLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8FF00]"></div>
        </div>
      );
    }

    return (
      <div className="p-8">
        <ProposalDetail
          proposal={selectedProposal}
          otherUserName={otherUserName || undefined}
          isInfluencer={true}
        />
      </div>
    );
  }

  // List Mode
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Proposals</h1>
        <p className="text-gray-400">View and manage your collaboration proposals</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
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
          </button>
        ))}
      </div>

      {/* Proposals Grid */}
      {loading || (proposals.length > 0 && !namesLoaded) ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8FF00]"></div>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-white font-semibold mb-2">No proposals found</h3>
          <p className="text-gray-400 text-sm">
            {filter === 'all'
              ? "When brands send you collaboration proposals, they'll appear here"
              : `No ${filter} proposals`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              otherUserName={promoterNames[proposal.promoterId] || undefined}
              onClick={() => navigate(`/influencer/proposals/${proposal.id}`)}
              isPromoter={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
