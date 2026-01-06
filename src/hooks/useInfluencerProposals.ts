// ============================================
// CHECK IF PROMOTER HAS PROPOSALS FOR INFLUENCER
// ============================================

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import type { Proposal } from '../types';

export function useInfluencerProposals(influencerId: string | null) {
  const { user } = useAuthStore();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !influencerId) {
      setProposals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query for proposals where current user is promoter AND for this influencer
    const q = query(
      collection(db, 'proposals'),
      where('promoterId', '==', user.uid),
      where('influencerId', '==', influencerId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const proposalsData = snapshot.docs.map((doc) => {
          const data = doc.data();

          if (!data.proposalStatus || !data.paymentStatus || !data.workStatus) {
            throw new Error('Proposal document is missing proposalStatus/paymentStatus/workStatus');
          }

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
            influencerAcceptedTerms: data.influencerAcceptedTerms,
            influencerSubmittedWork: data.influencerSubmittedWork,
            brandApprovedWork: data.brandApprovedWork,
            completionPercentage: data.completionPercentage || 0,
          } as Proposal;
        });

        // Sort by updatedAt descending
        proposalsData.sort((a, b) => b.updatedAt - a.updatedAt);

        setProposals(proposalsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching influencer proposals:', err);
        setProposals([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, influencerId]);

  return { proposals, loading, hasProposals: proposals.length > 0 };
}
