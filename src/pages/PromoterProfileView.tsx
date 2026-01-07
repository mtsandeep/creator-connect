// ============================================
// PUBLIC PROMOTER PROFILE VIEW (READ-ONLY)
// ============================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Proposal, User } from '../types';

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

export default function PromoterProfileView() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();

  const [promoter, setPromoter] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [stats, setStats] = useState<PromoterPublicStats>({
    completedProposalsCount: 0,
    totalAmountPaid: 0,
  });

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
          verificationBadges: userData.verificationBadges || { verified: false, trusted: false },
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
              influencerAcceptedTerms: data.influencerAcceptedTerms,
              influencerSubmittedWork: data.influencerSubmittedWork,
              brandApprovedWork: data.brandApprovedWork,
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
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
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{profile.name}</h1>
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
                <div className="text-2xl font-bold text-white">{promoter.avgRating.toFixed(1)}</div>
                <div className="text-gray-500 text-sm">⭐ Rating</div>
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
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
    </div>
  );
}
