// ============================================
// PUBLIC PROMOTER PROFILE VIEW (READ-ONLY)
// ============================================

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import { formatDistanceToNow } from 'date-fns';
import type { Proposal, User } from '../types';
import { LuArrowLeft, LuCircleCheck, LuGlobe, LuStar } from 'react-icons/lu';

type PromoterPublicStats = {
  completedProposalsCount: number;
  totalAmountPaid: number;
};

const isPaidScheduleStatus = (status: unknown): boolean => {
  return status === 'paid' || status === 'released';
};

const calculateTotalAmountPaid = (proposal: Proposal): number => {
  if (!Array.isArray(proposal.paymentSchedule)) return 0;
  return proposal.paymentSchedule
    .filter((item) => isPaidScheduleStatus(item?.status))
    .reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
};

// Status configuration matching ProposalCard
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  sent: { label: 'Awaiting Response', color: 'bg-yellow-500/20 text-yellow-500' },
  accepted: { label: 'Accepted', color: 'bg-purple-500/20 text-purple-500' },
  edited: { label: 'Updated', color: 'bg-orange-500/20 text-orange-500' },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-500' },
  closed: { label: 'Closed', color: 'bg-red-500/20 text-red-500' },
  in_progress: { label: 'In Progress', color: 'bg-[#B8FF00]/20 text-[#B8FF00]' },
  revision_requested: { label: 'Revision Requested', color: 'bg-orange-500/20 text-orange-500' },
  submitted: { label: 'Submitted', color: 'bg-[#00D9FF]/20 text-[#00D9FF]' },
  approved: { label: 'Completed', color: 'bg-green-500/20 text-green-500' },
  disputed: { label: 'Disputed', color: 'bg-orange-500/20 text-orange-500' },
};

export default function PromoterProfileView() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [promoter, setPromoter] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [stats, setStats] = useState<PromoterPublicStats>({
    completedProposalsCount: 0,
    totalAmountPaid: 0,
  });
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  useEffect(() => {
    if (!uid) return;

    const fetchPromoter = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const userDoc = await getDoc(doc(db, 'users', uid));

        if (!userDoc.exists()) {
          setNotFound(true);
          return;
        }

        const userData = userDoc.data();

        if (!userData.promoterProfile) {
          setNotFound(true);
          return;
        }

        setPromoter({
          uid: userDoc.id,
          email: userData.email || '',
          roles: userData.roles || [],
          activeRole: userData.activeRole || null,
          createdAt: userData.createdAt || 0,
          profileComplete: userData.profileComplete || false,
          influencerProfile: userData.influencerProfile,
          promoterProfile: userData.promoterProfile,
          avgRating: userData.avgRating || 0,
          totalReviews: userData.totalReviews || 0,
          isBanned: userData.isBanned || false,
          verificationBadges: userData.verificationBadges || { 
            influencerVerified: false, 
            promoterVerified: false,
            influencerTrusted: false,
            promoterTrusted: false
          },
        });

        const proposalsQuery = query(
          collection(db, 'proposals'),
          where('promoterId', '==', uid)
        );
        const proposalsSnapshot = await getDocs(proposalsQuery);

        const proposals: Proposal[] = proposalsSnapshot.docs
          .map((d) => {
            const data = d.data();

            if (!data.proposalStatus || !data.paymentStatus || !data.workStatus) {
              return null;
            }

            return {
              id: d.id,
              promoterId: data.promoterId,
              influencerId: data.influencerId,

              proposalStatus: data.proposalStatus,
              paymentStatus: data.paymentStatus,
              workStatus: data.workStatus,

              paymentMode: data.paymentMode,
              createdAt: data.createdAt?.toMillis?.() || data.createdAt || 0,
              updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
              title: data.title,
              description: data.description,
              requirements: data.requirements,
              deliverables: data.deliverables || [],
              proposedBudget: data.proposedBudget,
              finalAmount: data.finalAmount,
              advanceAmount: data.advanceAmount,
              advancePercentage: data.advancePercentage || 30,
              remainingAmount: data.remainingAmount,
              paymentSchedule: data.paymentSchedule,
              attachments: data.attachments || [],
              deadline: data.deadline?.toMillis?.() || data.deadline,
              completionPercentage: data.completionPercentage || 0,
              completedDeliverables: Array.isArray(data.completedDeliverables) ? data.completedDeliverables : [],
              workUpdateLog: Array.isArray(data.workUpdateLog)
                ? data.workUpdateLog.map((entry: any) => ({
                    timestamp: entry?.timestamp?.toMillis?.() || entry?.timestamp || 0,
                    note: entry?.note,
                    completedDeliverables: Array.isArray(entry?.completedDeliverables)
                      ? entry.completedDeliverables
                      : [],
                  }))
                : [],
              revisionReason: data.revisionReason,
              revisionRequestedAt: data.revisionRequestedAt?.toMillis?.() || data.revisionRequestedAt,
              revisionRequestedBy: data.revisionRequestedBy,
              disputeReason: data.disputeReason,
              disputeRaisedAt: data.disputeRaisedAt?.toMillis?.() || data.disputeRaisedAt,
              disputeRaisedBy: data.disputeRaisedBy,
              declineReason: data.declineReason,
              fees: data.fees,
            } as Proposal;
          })
          .filter(Boolean) as Proposal[];

        const completedProposalsCount = proposals.filter((p) => p.workStatus === 'approved').length;
        const totalAmountPaid = proposals.reduce((sum, p) => sum + calculateTotalAmountPaid(p), 0);

        setStats({
          completedProposalsCount,
          totalAmountPaid,
        });
      } catch (error) {
        console.error('Error fetching promoter:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoter();
  }, [uid]);

  // Fetch proposals between logged-in influencer and this promoter
  useEffect(() => {
    if (!uid || !user?.roles.includes('influencer')) return;

    const fetchProposals = async () => {
      setLoadingProposals(true);
      try {
        const proposalsQuery = query(
          collection(db, 'proposals'),
          where('influencerId', '==', user.uid),
          where('promoterId', '==', uid),
          orderBy('updatedAt', 'desc')
        );
        const proposalsSnapshot = await getDocs(proposalsQuery);
        const proposalsData = proposalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Proposal[];
        setProposals(proposalsData);
      } catch (error) {
        console.error('Error fetching proposals:', error);
      } finally {
        setLoadingProposals(false);
      }
    };

    fetchProposals();
  }, [uid, user]);

  const handleViewProposal = (proposalId: string) => {
    navigate(`/influencer/proposals/${proposalId}`);
  };

  const profile = promoter?.promoterProfile;

  const formattedPaid = useMemo(() => {
    return `₹${Math.round(stats.totalAmountPaid).toLocaleString()}`;
  }, [stats.totalAmountPaid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  if (notFound || !promoter || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Promoter Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <LuArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <img
              src={profile.logo}
              alt={profile.name}
              className="w-32 h-32 rounded-2xl object-cover border-4 border-white/10"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`;
              }}
            />
          </div>

          <div className="flex-1">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                {promoter.verificationBadges?.promoterVerified && (
                  <div className="flex items-center gap-1 px-2 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full">
                    <LuCircleCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 text-sm font-semibold leading-none">Verified</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap text-gray-400">
                <span className="px-2 py-0.5 bg-white/10 rounded text-xs capitalize">{profile.type}</span>
                {(profile.categories || []).map((category) => (
                  <span key={category} className="px-2 py-0.5 bg-[#B8FF00]/20 text-[#B8FF00] rounded text-xs">
                    {category}
                  </span>
                ))}
              </div>
              {profile.location && (
                <p className="text-gray-500 text-sm mt-1">📍 {profile.location}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-6 mb-4">
              <div>
                <div className="text-2xl font-bold text-white">{stats.completedProposalsCount}</div>
                <div className="text-gray-500 text-sm">Completed Proposals</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{formattedPaid}</div>
                <div className="text-gray-500 text-sm">Total Amount Paid</div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <LuStar className="w-5 h-5 text-yellow-400" />
                  <div className="text-2xl font-bold text-white">{promoter.avgRating.toFixed(1)}</div>
                </div>
                <div className="text-gray-500 text-sm">Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{promoter.totalReviews}</div>
                <div className="text-gray-500 text-sm">Reviews</div>
              </div>
            </div>

            {profile.description && (
              <p className="text-gray-300 mb-4">{profile.description}</p>
            )}

            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#00D9FF] hover:underline"
              >
                <LuGlobe className="w-5 h-5" />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {profile.type === 'agency' && profile.brands && profile.brands.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Brands Managed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.brands.map((brand) => (
              <div key={brand} className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 bg-[#B8FF00]/20 rounded-lg flex items-center justify-center">
                  <span className="text-[#B8FF00] font-semibold">{brand[0]}</span>
                </div>
                <div className="text-white capitalize">{brand}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposals Section - Only for influencers viewing promoter profiles */}
      {user?.roles.includes('influencer') && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Proposals from {profile.name}</h2>
          {loadingProposals ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8FF00]"></div>
            </div>
          ) : proposals.length > 0 ? (
            <div className="space-y-3">
              {proposals.map((proposal) => {
                // Use the same status logic as ProposalCard
                const statusKey = proposal.workStatus === 'approved' ? 'approved' : proposal.workStatus;
                const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG[proposal.proposalStatus];
                const statusLabel = statusConfig.label;
                const statusColor = statusConfig.color;

                // Format dates - handle both Firestore Timestamp objects and plain numbers
                const formatDate = (timestamp?: any) => {
                  if (!timestamp) return null;

                  let date: Date;

                  // Handle Firestore Timestamp object
                  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
                    const milliseconds = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
                    date = new Date(milliseconds);
                  } else if (typeof timestamp === 'number') {
                    date = new Date(timestamp);
                  } else if (timestamp && typeof timestamp.toDate === 'function') {
                    date = timestamp.toDate();
                  } else {
                    return 'Invalid date';
                  }

                  if (isNaN(date.getTime())) return 'Invalid date';
                  return formatDistanceToNow(date, { addSuffix: true });
                };

                // Get exact date for tooltip
                const getExactDate = (timestamp?: any) => {
                  if (!timestamp) return null;

                  let date: Date;

                  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
                    const milliseconds = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
                    date = new Date(milliseconds);
                  } else if (typeof timestamp === 'number') {
                    date = new Date(timestamp);
                  } else if (timestamp && typeof timestamp.toDate === 'function') {
                    date = timestamp.toDate();
                  } else {
                    return null;
                  }

                  if (isNaN(date.getTime())) return null;
                  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                };

                const createdDate = formatDate(proposal.createdAt);
                const completedDate = proposal.workStatus === 'approved' ? formatDate(proposal.updatedAt) : null;
                const createdDateTooltip = getExactDate(proposal.createdAt);
                const completedDateTooltip = proposal.workStatus === 'approved' ? getExactDate(proposal.updatedAt) : null;

                return (
                  <div
                    key={proposal.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate mb-2">{proposal.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                          {proposal.finalAmount && (
                            <span className="text-xs text-gray-400">
                              ₹{proposal.finalAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          <span title={createdDateTooltip || undefined}>Created: {createdDate}</span>
                          {completedDate && (
                            <span title={completedDateTooltip || undefined}>Completed: {completedDate}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewProposal(proposal.id)}
                        className="flex-shrink-0 px-4 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black text-sm font-semibold rounded-lg transition-colors"
                      >
                        View Proposal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">You don't have any proposals from this promoter yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
