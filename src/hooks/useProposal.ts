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
import type { Proposal, ProposalAttachment, CreateProposalData, PaymentScheduleItem } from '../types';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptProposal = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        proposalStatus: 'discussing',
        declineReason: '',
        updatedAt: serverTimestamp(),
      });

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
    []
  );

  const declineProposal = useCallback(async (proposalId: string, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        proposalStatus: 'cancelled',
        declineReason: (reason || '').trim(),
        updatedAt: serverTimestamp(),
      });

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error declining proposal:', err);
      const errorMessage = err.message || 'Failed to decline proposal';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  return { acceptProposal, declineProposal, loading, error };
}

// ============================================
// FINALIZE PROPOSAL (after discussion)
// ============================================

export function useFinalizeProposal() {
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

        await updateDoc(doc(db, 'proposals', proposalId), updateData);

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptTerms = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        influencerAcceptedTerms: true,
        updatedAt: serverTimestamp(),
      });

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error accepting terms:', err);
      const errorMessage = err.message || 'Failed to accept terms';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  return { acceptTerms, loading, error };
}

// ============================================
// PROMOTER MARK AS PAID
// ============================================

export function useMarkAsPaid() {
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

        await updateDoc(proposalRef, {
          paymentSchedule: schedule,
          paymentStatus: 'advance_paid',
          workStatus: 'in_progress',
          updatedAt: serverTimestamp(),
        });
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

        await updateDoc(proposalRef, {
          paymentSchedule: schedule,
          paymentStatus: 'fully_paid',
          updatedAt: serverTimestamp(),
        });
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
  }, []);

  return { markAsPaid, loading, error };
}

// ============================================
// INFLUENCER SUBMIT WORK
// ============================================

export function useInfluencerSubmitWork() {
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

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error submitting work:', err);
      const errorMessage = err.message || 'Failed to submit work';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  return { submitWork, loading, error };
}

// ============================================
// PROMOTER APPROVE WORK & COMPLETE
// ============================================

export function usePromoterApproveWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveWork = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        brandApprovedWork: true,
        completionPercentage: 100,
        workStatus: 'approved',
        updatedAt: serverTimestamp(),
      });

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error approving work:', err);
      const errorMessage = err.message || 'Failed to approve work';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

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

      await updateDoc(doc(db, 'proposals', proposalId), {
        workStatus: 'revision_requested',
        influencerSubmittedWork: false,
        brandApprovedWork: false,
        revisionReason: cleanReason,
        revisionRequestedAt: serverTimestamp(),
        revisionRequestedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

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
