// ============================================
// PROPOSAL HOOKS
// ============================================

import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuthStore } from '../stores';
import type { Proposal, ProposalAttachment, CreateProposalData, PaymentScheduleItem, ProposalHistoryEntry, ProposalChangeType, ProposalHistoryTrack } from '../types';

const writeProposalHistoryEntry = async (
  proposalId: string,
  entry: Omit<ProposalHistoryEntry, 'id'>
) => {
  try {
    await addDoc(collection(db, 'proposals', proposalId, 'history'), entry);
  } catch (e) {
    console.error('Error writing proposal history entry:', e);
  }
};

const inferChangedByRole = (user: any): ProposalHistoryEntry['changedByRole'] => {
  const activeRole = user?.activeRole;
  if (activeRole === 'promoter' || activeRole === 'influencer') return activeRole;
  return 'system';
};

const inferChangedByName = (user: any): string | undefined => {
  if (!user) return undefined;
  if (user.activeRole === 'promoter') return user.promoterProfile?.name;
  if (user.activeRole === 'influencer') return user.influencerProfile?.displayName;
  return undefined;
};

const buildHistoryEntry = (
  proposalId: string,
  user: any,
  params: {
    changeType: ProposalChangeType;
    track: ProposalHistoryTrack;
    previousStatus?: string;
    newStatus?: string;
    changedFields?: string[];
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    reason?: string;
    metadata?: Record<string, any>;
  }
): Omit<ProposalHistoryEntry, 'id'> => {
  return {
    proposalId,
    changedBy: user?.uid || 'system',
    changedByRole: inferChangedByRole(user),
    changedByName: inferChangedByName(user),
    timestamp: Date.now(),
    changeType: params.changeType,
    track: params.track,
    ...(params.previousStatus !== undefined ? { previousStatus: params.previousStatus } : {}),
    ...(params.newStatus !== undefined ? { newStatus: params.newStatus } : {}),
    ...(params.changedFields ? { changedFields: params.changedFields } : {}),
    ...(params.previousValues ? { previousValues: params.previousValues } : {}),
    ...(params.newValues ? { newValues: params.newValues } : {}),
    ...(params.reason ? { reason: params.reason } : {}),
    ...(params.metadata ? { metadata: params.metadata } : {}),
  };
};

// ============================================
// FETCH PROPOSALS
// ============================================

export type ProposalRole = 'promoter' | 'influencer' | 'all';

const convertDocToProposal = (doc: any): Proposal => {
  const data = doc.data();

  if (!data.proposalStatus || !data.paymentStatus || !data.workStatus) {
    throw new Error('Proposal document is missing proposalStatus/paymentStatus/workStatus');
  }

  const proposalStatus: Proposal['proposalStatus'] = data.proposalStatus;
  const paymentStatus: Proposal['paymentStatus'] = data.paymentStatus;
  const workStatus: Proposal['workStatus'] = data.workStatus;

  return {
    id: doc.id,
    promoterId: data.promoterId,
    influencerId: data.influencerId,

    proposalStatus,
    paymentStatus,
    workStatus,

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
          completedDeliverables: Array.isArray(entry?.completedDeliverables) ? entry.completedDeliverables : [],
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
  };
};

// ============================================
// RAISE DISPUTE
// ============================================

export function useRaiseDispute() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const raiseDispute = useCallback(async (proposalId: string, reason: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.uid) {
        throw new Error('User must be authenticated');
      }

      const cleanReason = reason.trim();
      if (!cleanReason) {
        throw new Error('Dispute reason is required');
      }

      await updateDoc(doc(db, 'proposals', proposalId), {
        workStatus: 'disputed',
        disputeReason: cleanReason,
        disputeRaisedAt: serverTimestamp(),
        disputeRaisedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

      await writeProposalHistoryEntry(
        proposalId,
        buildHistoryEntry(proposalId, user, {
          changeType: 'dispute_raised',
          track: 'work',
          previousStatus: 'submitted',
          newStatus: 'disputed',
          reason: cleanReason,
          changedFields: ['workStatus', 'disputeReason'],
          newValues: { workStatus: 'disputed', disputeReason: cleanReason },
        })
      );

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error raising dispute:', err);
      const errorMessage = err.message || 'Failed to raise dispute';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [user?.uid]);

  return { raiseDispute, loading, error };
}

export function useProposals(role: ProposalRole = 'all') {
  const { user } = useAuthStore();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setProposals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // For influencer role, only fetch where user is influencer
    if (role === 'influencer') {
      const q = query(
        collection(db, 'proposals'),
        where('influencerId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const proposalsData = snapshot.docs.map(convertDocToProposal);
          setProposals(proposalsData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching influencer proposals:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }

    // For promoter role, only fetch where user is promoter
    if (role === 'promoter') {
      const q = query(
        collection(db, 'proposals'),
        where('promoterId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const proposalsData = snapshot.docs.map(convertDocToProposal);
          setProposals(proposalsData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching promoter proposals:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }

    // For 'all' role, fetch both and merge
    // We need to query for proposals where user is either promoter or influencer
    // Firestore doesn't support OR queries, so we need two separate queries
    const q1 = query(
      collection(db, 'proposals'),
      where('promoterId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const q2 = query(
      collection(db, 'proposals'),
      where('influencerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe1 = onSnapshot(
      q1,
      (snapshot1) => {
        const proposals1 = snapshot1.docs.map(convertDocToProposal);

        const unsubscribe2 = onSnapshot(
          q2,
          (snapshot2) => {
            const proposals2 = snapshot2.docs.map(convertDocToProposal);

            // Merge both arrays and remove duplicates (by id)
            const allProposals = [...proposals1, ...proposals2];
            const uniqueProposals = Array.from(
              new Map(allProposals.map((p) => [p.id, p])).values()
            );

            // Sort by updatedAt descending
            uniqueProposals.sort((a, b) => b.updatedAt - a.updatedAt);

            setProposals(uniqueProposals);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching influencer proposals:', err);
            setError(err.message);
            setLoading(false);
          }
        );

        // Store unsubscribe2 for cleanup
        return () => unsubscribe2();
      },
      (err) => {
        console.error('Error fetching promoter proposals:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe1();
  }, [user?.uid, role]);

  return { proposals, loading, error };
}

// ============================================
// FETCH SINGLE PROPOSAL
// ============================================

export function useProposal(proposalId: string | null) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) {
      setProposal(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, 'proposals', proposalId),
      (doc) => {
        if (!doc.exists()) {
          setError('Proposal not found');
          setLoading(false);
          return;
        }

        setProposal(convertDocToProposal(doc));

        setLoading(false);
      },
      (err) => {
        console.error('Error fetching proposal:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [proposalId]);

  return { proposal, loading, error };
}

// ============================================
// PROPOSAL HISTORY / ACTIVITY LOG
// ============================================

export function useProposalHistory(proposalId: string | null) {
  const [entries, setEntries] = useState<ProposalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'proposals', proposalId, 'history'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextEntries: ProposalHistoryEntry[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ProposalHistoryEntry, 'id'>),
        }));
        setEntries(nextEntries);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching proposal history:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [proposalId]);

  return { entries, loading, error };
}

// ============================================
// CREATE PROPOSAL
// ============================================

export function useCreateProposal() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProposal = useCallback(
    async (data: CreateProposalData & { attachments?: File[] }) => {
      if (!user?.uid) {
        setError('Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      setLoading(true);
      setError(null);

      try {
        // Upload attachments if any
        const attachmentUrls: ProposalAttachment[] = [];

        if (data.attachments && data.attachments.length > 0) {
          for (const file of data.attachments) {
            const fileRef = ref(
              storage,
              `proposals/${Date.now()}_${file.name}`
            );
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            attachmentUrls.push({
              name: file.name,
              url,
              type: file.type,
              uploadedBy: user.uid,
              uploadedAt: Date.now(),
            });
          }
        }

        // Get influencer's advance percentage
        const influencerDoc = await getDoc(doc(db, 'users', data.influencerId));
        if (!influencerDoc.exists()) {
          throw new Error('Influencer not found');
        }

        const influencerData = influencerDoc.data();
        const advancePercentage = influencerData.influencerProfile?.pricing?.advancePercentage || 20;

        const proposalData = {
          promoterId: user.uid,
          influencerId: data.influencerId,
          proposalStatus: 'created',
          paymentStatus: 'not_started',
          workStatus: 'not_started',
          paymentMode: data.paymentMode || 'platform',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          deliverables: data.deliverables || [],
          proposedBudget: data.proposedBudget,
          attachments: attachmentUrls,
          deadline: data.deadline ? new Date(data.deadline) : null,
          advancePercentage,
          influencerAcceptedTerms: false,
          influencerSubmittedWork: false,
          brandApprovedWork: false,
          completionPercentage: 0,
          declineReason: '',
        };

        const docRef = await addDoc(collection(db, 'proposals'), proposalData);

        await writeProposalHistoryEntry(
          docRef.id,
          buildHistoryEntry(docRef.id, user, {
            changeType: 'proposal_created',
            track: 'proposal',
            newStatus: 'created',
            changedFields: ['proposalStatus', 'title', 'description', 'requirements', 'deliverables', 'proposedBudget'],
            newValues: {
              proposalStatus: 'created',
              title: proposalData.title,
              description: proposalData.description,
              requirements: proposalData.requirements,
              deliverables: proposalData.deliverables,
              proposedBudget: proposalData.proposedBudget,
            },
            metadata: {
              influencerId: proposalData.influencerId,
              promoterId: proposalData.promoterId,
              paymentMode: proposalData.paymentMode,
              attachmentCount: attachmentUrls.length,
            },
          })
        );

        setLoading(false);
        return { success: true, proposalId: docRef.id };
      } catch (err: any) {
        console.error('Error creating proposal:', err);
        const errorMessage = err.message || 'Failed to create proposal';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [user?.uid]
  );

  return { createProposal, loading, error };
}

// ============================================
// UPDATE PROPOSAL STATUS
// ============================================

export function useUpdateProposalStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (
      proposalId: string,
      statuses: Partial<Pick<Proposal, 'proposalStatus' | 'paymentStatus' | 'workStatus'>>
    ) => {
      setLoading(true);
      setError(null);

      try {
        await updateDoc(doc(db, 'proposals', proposalId), {
          ...statuses,
          updatedAt: serverTimestamp(),
        });

        setLoading(false);
        return { success: true };
      } catch (err: any) {
        console.error('Error updating status:', err);
        const errorMessage = err.message || 'Failed to update status';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return { updateStatus, loading, error };
}

// ============================================
// ACCEPT/DECLINE PROPOSAL
// ============================================

export function useRespondToProposal() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptProposal = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);

    try {
      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalDoc = await getDoc(proposalRef);
      const previousStatus = proposalDoc.exists() ? proposalDoc.data()?.proposalStatus : undefined;

      await updateDoc(proposalRef, {
        proposalStatus: 'discussing',
        declineReason: '',
        updatedAt: serverTimestamp(),
      });

      await writeProposalHistoryEntry(
        proposalId,
        buildHistoryEntry(proposalId, user, {
          changeType: 'proposal_status_changed',
          track: 'proposal',
          previousStatus,
          newStatus: 'discussing',
          changedFields: ['proposalStatus', 'declineReason'],
          previousValues: { proposalStatus: previousStatus, declineReason: proposalDoc.exists() ? proposalDoc.data()?.declineReason : undefined },
          newValues: { proposalStatus: 'discussing', declineReason: '' },
        })
      );

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error accepting proposal:', err);
      const errorMessage = err.message || 'Failed to accept proposal';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
    },
    [user]
  );

  const declineProposal = useCallback(async (proposalId: string, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalDoc = await getDoc(proposalRef);
      const previousStatus = proposalDoc.exists() ? proposalDoc.data()?.proposalStatus : undefined;
      const cleanReason = (reason || '').trim();

      await updateDoc(proposalRef, {
        proposalStatus: 'cancelled',
        declineReason: cleanReason,
        updatedAt: serverTimestamp(),
      });

      await writeProposalHistoryEntry(
        proposalId,
        buildHistoryEntry(proposalId, user, {
          changeType: 'proposal_cancelled',
          track: 'proposal',
          previousStatus,
          newStatus: 'cancelled',
          reason: cleanReason || undefined,
          changedFields: ['proposalStatus', 'declineReason'],
          previousValues: { proposalStatus: previousStatus },
          newValues: { proposalStatus: 'cancelled', declineReason: cleanReason },
        })
      );

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error declining proposal:', err);
      const errorMessage = err.message || 'Failed to decline proposal';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [user]);

  return { acceptProposal, declineProposal, loading, error };
}

// ============================================
// FINALIZE PROPOSAL (after discussion)
// ============================================

export function useFinalizeProposal() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalizeProposal = useCallback(
    async (proposalId: string, finalAmount: number) => {
      setLoading(true);
      setError(null);

      try {
        const proposalRef = doc(db, 'proposals', proposalId);
        const proposalDoc = await getDoc(proposalRef);

        if (!proposalDoc.exists()) {
          throw new Error('Proposal not found');
        }

        const proposalData = proposalDoc.data();
        const advancePercentage = proposalData.advancePercentage || 30;
        const advanceAmount = (finalAmount * advancePercentage) / 100;
        const remainingAmount = finalAmount - advanceAmount;

        const now = Date.now();
        const paymentSchedule: PaymentScheduleItem[] = [
          {
            id: `advance_${now}`,
            type: 'advance',
            name: 'Advance',
            amount: Math.round(advanceAmount),
            dueAfter: 0,
            status: 'pending',
          },
          {
            id: `remaining_${now}`,
            type: 'remaining',
            name: 'Remaining',
            amount: Math.round(remainingAmount),
            dueAfter: 100,
            status: 'pending',
          },
        ];

        const previousProposalStatus = proposalData.proposalStatus;
        const previousPaymentStatus = proposalData.paymentStatus;
        const previousWorkStatus = proposalData.workStatus;

        await updateDoc(proposalRef, {
          proposalStatus: 'agreed',
          paymentStatus: 'pending_advance',
          workStatus: 'not_started',
          finalAmount,
          advanceAmount,
          remainingAmount,
          paymentSchedule,
          updatedAt: serverTimestamp(),
        });

        await writeProposalHistoryEntry(
          proposalId,
          buildHistoryEntry(proposalId, user, {
            changeType: 'proposal_status_changed',
            track: 'proposal',
            previousStatus: previousProposalStatus,
            newStatus: 'agreed',
            changedFields: ['proposalStatus', 'paymentStatus', 'workStatus', 'finalAmount', 'advanceAmount', 'remainingAmount'],
            previousValues: {
              proposalStatus: previousProposalStatus,
              paymentStatus: previousPaymentStatus,
              workStatus: previousWorkStatus,
              finalAmount: proposalData.finalAmount,
              advanceAmount: proposalData.advanceAmount,
              remainingAmount: proposalData.remainingAmount,
            },
            newValues: {
              proposalStatus: 'agreed',
              paymentStatus: 'pending_advance',
              workStatus: 'not_started',
              finalAmount,
              advanceAmount,
              remainingAmount,
            },
            metadata: {
              paymentSchedule,
            },
          })
        );

        setLoading(false);
        return { success: true };
      } catch (err: any) {
        console.error('Error finalizing proposal:', err);
        const errorMessage = err.message || 'Failed to finalize proposal';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return { finalizeProposal, loading, error };
}

// ============================================
// UPDATE PROPOSAL (deliverables, attachments, etc)
// ============================================

export function useUpdateProposal() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProposal = useCallback(
    async (proposalId: string, updates: Omit<Partial<Proposal>, 'deadline'> & { deadline?: number | null }) => {
      if (!user?.uid) {
        setError('Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      setLoading(true);
      setError(null);

      try {
        const updateData: any = {
          updatedAt: serverTimestamp(),
        };

        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined) return;
          if (key === 'deadline') return;
          updateData[key] = value;
        });

        // deadline handling:
        // - number: convert to Date
        // - null: clear
        // - undefined: omit
        if (updates.deadline !== undefined) {
          updateData.deadline = updates.deadline === null ? null : new Date(updates.deadline);
        }

        const proposalRef = doc(db, 'proposals', proposalId);
        const proposalDoc = await getDoc(proposalRef);
        const previousValues: Record<string, any> = {};
        const nextValues: Record<string, any> = {};

        if (proposalDoc.exists()) {
          const current = proposalDoc.data() as any;
          Object.keys(updateData).forEach((k) => {
            if (k === 'updatedAt') return;
            previousValues[k] = current?.[k];
            nextValues[k] = updateData[k];
          });
        }

        await updateDoc(proposalRef, updateData);

        const changedFields = Object.keys(updateData).filter((k) => k !== 'updatedAt');
        if (changedFields.length > 0) {
          const changeType: ProposalChangeType = updateData.proposalStatus === 'changes_requested'
            ? 'changes_requested'
            : 'proposal_edited';

          await writeProposalHistoryEntry(
            proposalId,
            buildHistoryEntry(proposalId, user, {
              changeType,
              track: 'proposal',
              changedFields,
              previousValues: Object.keys(previousValues).length ? previousValues : undefined,
              newValues: Object.keys(nextValues).length ? nextValues : undefined,
              ...(updateData.proposalStatus ? { newStatus: updateData.proposalStatus } : {}),
              ...(proposalDoc.exists() && (proposalDoc.data() as any)?.proposalStatus
                ? { previousStatus: (proposalDoc.data() as any)?.proposalStatus }
                : {}),
            })
          );
        }

        setLoading(false);
        return { success: true };
      } catch (err: any) {
        console.error('Error updating proposal:', err);
        const errorMessage = err.message || 'Failed to update proposal';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [user?.uid]
  );

  const addAttachment = useCallback(
    async (proposalId: string, file: File) => {
      if (!user?.uid) {
        setError('Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      setLoading(true);
      setError(null);

      try {
        const fileRef = ref(
          storage,
          `proposals/${proposalId}/${Date.now()}_${file.name}`
        );
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        const attachment: ProposalAttachment = {
          name: file.name,
          url,
          type: file.type,
          uploadedBy: user.uid,
          uploadedAt: Date.now(),
        };

        const proposalRef = doc(db, 'proposals', proposalId);
        const proposalDoc = await getDoc(proposalRef);

        if (!proposalDoc.exists()) {
          throw new Error('Proposal not found');
        }

        const currentAttachments = proposalDoc.data()?.attachments || [];
        await updateDoc(proposalRef, {
          attachments: [...currentAttachments, attachment],
          updatedAt: serverTimestamp(),
        });

        await writeProposalHistoryEntry(
          proposalId,
          buildHistoryEntry(proposalId, user, {
            changeType: 'document_uploaded',
            track: 'proposal',
            changedFields: ['attachments'],
            metadata: {
              attachment: {
                name: attachment.name,
                type: attachment.type,
                url: attachment.url,
              },
            },
          })
        );

        setLoading(false);
        return { success: true, attachment };
      } catch (err: any) {
        console.error('Error adding attachment:', err);
        const errorMessage = err.message || 'Failed to add attachment';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [user?.uid]
  );

  return { updateProposal, addAttachment, loading, error };
}

// ============================================
// DELETE PROPOSAL
// ============================================

export function useDeleteProposal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProposal = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'proposals', proposalId));

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting proposal:', err);
      const errorMessage = err.message || 'Failed to delete proposal';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  return { deleteProposal, loading, error };
}

// ============================================
// INFLUENCER ACCEPT FINALIZED TERMS
// ============================================

export function useInfluencerAcceptTerms() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptTerms = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);

    try {
      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalDoc = await getDoc(proposalRef);
      const previous = proposalDoc.exists() ? proposalDoc.data()?.influencerAcceptedTerms : undefined;

      await updateDoc(proposalRef, {
        influencerAcceptedTerms: true,
        updatedAt: serverTimestamp(),
      });

      await writeProposalHistoryEntry(
        proposalId,
        buildHistoryEntry(proposalId, user, {
          changeType: 'terms_accepted',
          track: 'proposal',
          changedFields: ['influencerAcceptedTerms'],
          previousValues: { influencerAcceptedTerms: previous },
          newValues: { influencerAcceptedTerms: true },
        })
      );

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error accepting terms:', err);
      const errorMessage = err.message || 'Failed to accept terms';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [user]);

  return { acceptTerms, loading, error };
}

// ============================================
// PROMOTER MARK AS PAID
// ============================================

export function useMarkAsPaid() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsPaid = useCallback(
    async (
      proposalId: string,
      details?: { method?: string; transactionId?: string; notes?: string; paidAt?: number },
      proofScreenshotFile?: File,
      paymentType: 'advance' | 'remaining' = 'advance'
    ) => {
    setLoading(true);
    setError(null);

    try {
      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalDoc = await getDoc(proposalRef);

      if (!proposalDoc.exists()) {
        throw new Error('Proposal not found');
      }

      const data: any = proposalDoc.data();

      let screenshotUrl: string | undefined;
      if (proofScreenshotFile) {
        const fileRef = ref(storage, `proposals/${proposalId}/payments/${Date.now()}_${proofScreenshotFile.name}`);
        await uploadBytes(fileRef, proofScreenshotFile);
        screenshotUrl = await getDownloadURL(fileRef);
      }

      const paidAt = details?.paidAt || Date.now();

      const existingSchedule: PaymentScheduleItem[] = Array.isArray(data.paymentSchedule)
        ? (data.paymentSchedule as PaymentScheduleItem[])
        : [];

      let schedule = existingSchedule;

      const finalAmount = Number(data.finalAmount) || 0;
      const advancePercentage = Number(data.advancePercentage) || 30;
      const computedAdvanceAmount = data.advanceAmount ?? (finalAmount > 0 ? (finalAmount * advancePercentage) / 100 : 0);

      if (paymentType === 'advance') {
        // Ensure we have an advance entry to update
        const advanceIndex = schedule.findIndex((item) => item?.type === 'advance');
        const now = Date.now();

        if (advanceIndex === -1) {
          schedule = [
            {
              id: `advance_${now}`,
              type: 'advance',
              name: 'Advance',
              amount: Math.round(Number(computedAdvanceAmount) || 0),
              dueAfter: 0,
              status: 'paid',
              paidAt,
              proof: {
                ...(details?.method ? { method: details.method } : {}),
                ...(details?.transactionId ? { transactionId: details.transactionId } : {}),
                ...(details?.notes ? { notes: details.notes } : {}),
                ...(screenshotUrl ? { screenshotUrl } : {}),
              },
            },
            ...schedule,
          ];
        } else {
          schedule = schedule.map((item, idx) => {
            if (idx !== advanceIndex) return item;
            return {
              ...item,
              status: 'paid',
              paidAt,
              proof: {
                ...(item?.proof || {}),
                ...(details?.method ? { method: details.method } : {}),
                ...(details?.transactionId ? { transactionId: details.transactionId } : {}),
                ...(details?.notes ? { notes: details.notes } : {}),
                ...(screenshotUrl ? { screenshotUrl } : {}),
              },
            };
          });
        }

        const previousPaymentStatus = data.paymentStatus;
        const previousWorkStatus = data.workStatus;

        await updateDoc(proposalRef, {
          paymentSchedule: schedule,
          paymentStatus: 'advance_paid',
          workStatus: 'in_progress',
          updatedAt: serverTimestamp(),
        });

        await writeProposalHistoryEntry(
          proposalId,
          buildHistoryEntry(proposalId, user, {
            changeType: 'advance_paid',
            track: 'payment',
            previousStatus: previousPaymentStatus,
            newStatus: 'advance_paid',
            changedFields: ['paymentStatus', 'workStatus', 'paymentSchedule'],
            previousValues: { paymentStatus: previousPaymentStatus, workStatus: previousWorkStatus },
            newValues: { paymentStatus: 'advance_paid', workStatus: 'in_progress', amount: Math.round(Number(computedAdvanceAmount) || 0) },
            metadata: {
              paymentType: 'advance',
              paidAt,
              proof: {
                ...(details?.method ? { method: details.method } : {}),
                ...(details?.transactionId ? { transactionId: details.transactionId } : {}),
                ...(details?.notes ? { notes: details.notes } : {}),
                ...(screenshotUrl ? { screenshotUrl } : {}),
              },
            },
          })
        );
      } else {
        const remainingIndex = schedule.findIndex((item) => item?.type === 'remaining');
        const now = Date.now();
        const scheduleAdvance = schedule.find((item) => item?.type === 'advance');
        const advanceAmount = Number(scheduleAdvance?.amount) || Math.round(Number(computedAdvanceAmount) || 0);
        const remainingAmount = Math.max(0, Math.round(finalAmount - advanceAmount));

        if (remainingIndex === -1) {
          schedule = [
            ...schedule,
            {
              id: `remaining_${now}`,
              type: 'remaining',
              name: 'Remaining',
              amount: remainingAmount,
              dueAfter: 100,
              status: 'paid',
              paidAt,
              proof: {
                ...(details?.method ? { method: details.method } : {}),
                ...(details?.transactionId ? { transactionId: details.transactionId } : {}),
                ...(details?.notes ? { notes: details.notes } : {}),
                ...(screenshotUrl ? { screenshotUrl } : {}),
              },
            },
          ];
        } else {
          schedule = schedule.map((item, idx) => {
            if (idx !== remainingIndex) return item;
            return {
              ...item,
              status: 'paid',
              paidAt,
              proof: {
                ...(item?.proof || {}),
                ...(details?.method ? { method: details.method } : {}),
                ...(details?.transactionId ? { transactionId: details.transactionId } : {}),
                ...(details?.notes ? { notes: details.notes } : {}),
                ...(screenshotUrl ? { screenshotUrl } : {}),
              },
            };
          });
        }

        const previousPaymentStatus = data.paymentStatus;

        await updateDoc(proposalRef, {
          paymentSchedule: schedule,
          paymentStatus: 'fully_paid',
          updatedAt: serverTimestamp(),
        });

        await writeProposalHistoryEntry(
          proposalId,
          buildHistoryEntry(proposalId, user, {
            changeType: 'remaining_paid',
            track: 'payment',
            previousStatus: previousPaymentStatus,
            newStatus: 'fully_paid',
            changedFields: ['paymentStatus', 'paymentSchedule'],
            previousValues: { paymentStatus: previousPaymentStatus },
            newValues: { paymentStatus: 'fully_paid', amount: remainingAmount },
            metadata: {
              paymentType: 'remaining',
              paidAt,
              proof: {
                ...(details?.method ? { method: details.method } : {}),
                ...(details?.transactionId ? { transactionId: details.transactionId } : {}),
                ...(details?.notes ? { notes: details.notes } : {}),
                ...(screenshotUrl ? { screenshotUrl } : {}),
              },
            },
          })
        );
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error marking as paid:', err);
      const errorMessage = err.message || 'Failed to mark as paid';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [user]);

  return { markAsPaid, loading, error };
}

// ============================================
// INFLUENCER SUBMIT WORK
// ============================================

export function useInfluencerSubmitWork() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitWork = useCallback(async (
    proposalId: string,
    params: { deliverables: string[]; completedDeliverables: string[]; note?: string }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const deliverables = Array.isArray(params?.deliverables) ? params.deliverables : [];
      const completed = Array.isArray(params?.completedDeliverables) ? params.completedDeliverables : [];

      const nextCompletedDeliverables = deliverables.filter((d) => completed.includes(d));
      const progress = deliverables.length > 0
        ? Math.round((nextCompletedDeliverables.length / deliverables.length) * 100)
        : 0;
      const nextCompletionPercentage = Math.max(0, Math.min(100, Number(progress) || 0));

      const note = params?.note?.trim() ? params.note.trim() : undefined;

      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalSnap = await getDoc(proposalRef);
      const existingLog = Array.isArray(proposalSnap.data()?.workUpdateLog)
        ? proposalSnap.data()?.workUpdateLog
        : [];

      const nextLogEntry: any = {
        timestamp: Date.now(),
        completedDeliverables: nextCompletedDeliverables,
        ...(note ? { note } : {}),
      };

      const nextWorkUpdateLog = [...existingLog, nextLogEntry].slice(-50);

      const updatePayload: any = {
        completionPercentage: nextCompletionPercentage,
        completedDeliverables: nextCompletedDeliverables,
        workUpdateLog: nextWorkUpdateLog,
        updatedAt: serverTimestamp(),
      };

      if (deliverables.length > 0 && nextCompletedDeliverables.length === deliverables.length) {
        updatePayload.influencerSubmittedWork = true;
        updatePayload.workStatus = 'submitted';
        updatePayload.revisionReason = null;
        updatePayload.revisionRequestedAt = null;
        updatePayload.revisionRequestedBy = null;
      } else {
        updatePayload.workStatus = 'in_progress';
      }

      await updateDoc(proposalRef, updatePayload);

      const previousWorkStatus = proposalSnap.exists() ? proposalSnap.data()?.workStatus : undefined;
      const nextWorkStatus = updatePayload.workStatus;

      if (nextWorkStatus === 'submitted') {
        await writeProposalHistoryEntry(
          proposalId,
          buildHistoryEntry(proposalId, user, {
            changeType: 'work_submitted',
            track: 'work',
            previousStatus: previousWorkStatus,
            newStatus: 'submitted',
            changedFields: ['workStatus', 'completionPercentage', 'completedDeliverables'],
            previousValues: {
              workStatus: previousWorkStatus,
              completionPercentage: proposalSnap.exists() ? proposalSnap.data()?.completionPercentage : undefined,
              completedDeliverables: proposalSnap.exists() ? proposalSnap.data()?.completedDeliverables : undefined,
            },
            newValues: {
              workStatus: 'submitted',
              completionPercentage: nextCompletionPercentage,
              completedDeliverables: nextCompletedDeliverables,
            },
            ...(note ? { reason: note } : {}),
          })
        );
      } else {
        await writeProposalHistoryEntry(
          proposalId,
          buildHistoryEntry(proposalId, user, {
            changeType: 'work_status_changed',
            track: 'work',
            previousStatus: previousWorkStatus,
            newStatus: nextWorkStatus,
            changedFields: ['completionPercentage', 'completedDeliverables'],
            previousValues: {
              completionPercentage: proposalSnap.exists() ? proposalSnap.data()?.completionPercentage : undefined,
              completedDeliverables: proposalSnap.exists() ? proposalSnap.data()?.completedDeliverables : undefined,
            },
            newValues: {
              completionPercentage: nextCompletionPercentage,
              completedDeliverables: nextCompletedDeliverables,
            },
            metadata: {
              ...(note ? { note } : {}),
            },
          })
        );
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error submitting work:', err);
      const errorMessage = err.message || 'Failed to submit work';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [user]);

  return { submitWork, loading, error };
}

// ============================================
// PROMOTER APPROVE WORK & COMPLETE
// ============================================

export function usePromoterApproveWork() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveWork = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);

    try {
      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalDoc = await getDoc(proposalRef);
      const previousWorkStatus = proposalDoc.exists() ? proposalDoc.data()?.workStatus : undefined;

      await updateDoc(proposalRef, {
        brandApprovedWork: true,
        completionPercentage: 100,
        workStatus: 'approved',
        updatedAt: serverTimestamp(),
      });

      await writeProposalHistoryEntry(
        proposalId,
        buildHistoryEntry(proposalId, user, {
          changeType: 'work_approved',
          track: 'work',
          previousStatus: previousWorkStatus,
          newStatus: 'approved',
          changedFields: ['workStatus', 'brandApprovedWork', 'completionPercentage'],
          previousValues: {
            workStatus: previousWorkStatus,
            brandApprovedWork: proposalDoc.exists() ? proposalDoc.data()?.brandApprovedWork : undefined,
            completionPercentage: proposalDoc.exists() ? proposalDoc.data()?.completionPercentage : undefined,
          },
          newValues: { workStatus: 'approved', brandApprovedWork: true, completionPercentage: 100 },
        })
      );

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error approving work:', err);
      const errorMessage = err.message || 'Failed to approve work';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [user]);

  return { approveWork, loading, error };
}

// ============================================
// PROMOTER REQUEST REVISION
// ============================================

export function usePromoterRequestRevision() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRevision = useCallback(async (proposalId: string, reason: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.uid) {
        throw new Error('User must be authenticated');
      }

      const cleanReason = reason.trim();
      if (!cleanReason) {
        throw new Error('Revision reason is required');
      }

      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalDoc = await getDoc(proposalRef);
      const previousWorkStatus = proposalDoc.exists() ? proposalDoc.data()?.workStatus : undefined;

      await updateDoc(proposalRef, {
        workStatus: 'revision_requested',
        influencerSubmittedWork: false,
        brandApprovedWork: false,
        revisionReason: cleanReason,
        revisionRequestedAt: serverTimestamp(),
        revisionRequestedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

      await writeProposalHistoryEntry(
        proposalId,
        buildHistoryEntry(proposalId, user, {
          changeType: 'revision_requested',
          track: 'work',
          previousStatus: previousWorkStatus,
          newStatus: 'revision_requested',
          reason: cleanReason,
          changedFields: ['workStatus', 'revisionReason'],
          previousValues: {
            workStatus: previousWorkStatus,
            revisionReason: proposalDoc.exists() ? proposalDoc.data()?.revisionReason : undefined,
          },
          newValues: { workStatus: 'revision_requested', revisionReason: cleanReason },
        })
      );

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error requesting revision:', err);
      const errorMessage = err.message || 'Failed to request revision';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [user?.uid]);

  return { requestRevision, loading, error };
}
