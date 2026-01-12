import { useCallback, useState } from 'react';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../stores';
import { buildHistoryEntry, writeProposalHistoryEntry } from './history';

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
          changedFields: ['workStatus', 'completionPercentage'],
          previousValues: {
            workStatus: previousWorkStatus,
            completionPercentage: proposalDoc.exists() ? proposalDoc.data()?.completionPercentage : undefined,
          },
          newValues: { workStatus: 'approved', completionPercentage: 100 },
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
