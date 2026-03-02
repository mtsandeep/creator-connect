// ============================================
// FETCH PROPOSALS FROM A PROMOTER (FOR INFLUENCERS)
// ============================================

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import type { Proposal } from '../types';

// Statuses that mean the proposal is no longer active
const INACTIVE_STATUSES = ['declined', 'closed'];
const COMPLETED_STATUSES = ['approved'];

function isProposalActive(proposal: Proposal): boolean {
  // Completed work
  if (COMPLETED_STATUSES.includes(proposal.workStatus)) return false;
  // Declined or closed proposals
  if (INACTIVE_STATUSES.includes(proposal.proposalStatus)) return false;
  return true;
}

export function usePromoterProposals(promoterId: string | null) {
  const { user } = useAuthStore();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !promoterId) {
      setProposals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query for proposals where current user is influencer AND from this promoter
    const q = query(
      collection(db, 'proposals'),
      where('influencerId', '==', user.uid),
      where('promoterId', '==', promoterId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const proposalsData = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            promoterId: data.promoterId,
            influencerId: data.influencerId,
            proposalStatus: data.proposalStatus,
            paymentStatus: data.paymentStatus,
            workStatus: data.workStatus,
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
          } as Proposal;
        });

        // Sort by updatedAt descending
        proposalsData.sort((a, b) => b.updatedAt - a.updatedAt);

        setProposals(proposalsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching promoter proposals:', err);
        setProposals([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, promoterId]);

  // Filter for active proposals only (not completed, declined, or closed)
  const activeProposals = proposals.filter(isProposalActive);

  // Count completed proposals (workStatus === 'approved')
  const completedCount = proposals.filter(p => COMPLETED_STATUSES.includes(p.workStatus)).length;

  return {
    proposals,
    activeProposals,
    loading,
    hasProposals: activeProposals.length > 0,
    hasAnyProposals: proposals.length > 0,
    completedCount,
  };
}
