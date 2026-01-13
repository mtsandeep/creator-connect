import { useCallback, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuthStore } from '../../stores';
import type {
  CreateProposalData,
  PaymentScheduleItem,
  Proposal,
  ProposalAttachment,
  ProposalChangeType,
} from '../../types';
import { buildHistoryEntry, writeProposalHistoryEntry } from './history';

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
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        const sanitizeAttachmentName = (name: string) => {
          const parts = name.split('.');
          const ext = parts.length > 1 ? parts.pop() : '';
          const base = parts.join('.') || 'file';
          const safeBase = base
            .trim()
            .replace(/[^a-zA-Z0-9-_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          const safeExt = (ext || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
          return safeExt ? `${safeBase || 'file'}.${safeExt}` : `${safeBase || 'file'}`;
        };

        // Get influencer's advance percentage
        let advancePercentage = 20;
        try {
          const influencerDoc = await getDoc(doc(db, 'users', data.influencerId));
          if (!influencerDoc.exists()) {
            throw new Error('Influencer not found');
          }
          const influencerData = influencerDoc.data();
          advancePercentage = influencerData.influencerProfile?.pricing?.advancePercentage || 20;
        } catch (err: any) {
          console.error('Error reading influencer profile for proposal creation:', {
            message: err?.message,
            code: err?.code,
            name: err?.name,
            stack: err?.stack,
          });
          throw new Error(`Failed to read influencer profile: ${err?.message || 'unknown error'}${err?.code ? ` (code: ${err.code})` : ''}`);
        }

        const proposalData = {
          promoterId: user.uid,
          influencerId: data.influencerId,
          proposalStatus: 'sent',
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
          attachments: [],
          deadline: data.deadline ? new Date(data.deadline) : null,
          advancePercentage,
          completionPercentage: 0,
          declineReason: '',
        };

        let docRef: { id: string };
        try {
          docRef = await addDoc(collection(db, 'proposals'), proposalData);
        } catch (err: any) {
          console.error('Error writing proposal document:', {
            message: err?.message,
            code: err?.code,
            name: err?.name,
            stack: err?.stack,
          });
          throw new Error(`Failed to create proposal document: ${err?.message || 'unknown error'}${err?.code ? ` (code: ${err.code})` : ''}`);
        }

        // Upload attachments (only after proposal exists) so Storage rules can validate participants
        const attachmentUrls: ProposalAttachment[] = [];
        if (data.attachments && data.attachments.length > 0) {
          try {
            for (const file of data.attachments) {
              const safeName = sanitizeAttachmentName(file.name);
              const parts = safeName.split('.');
              const ext = parts.length > 1 ? (parts.pop() as string) : '';
              const base = parts.join('.') || 'file';
              const safeBase = `${Date.now()}_${base}`
                .replace(/[^a-zA-Z0-9-_]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
              const attachmentId = ext ? `${safeBase}.${ext}` : safeBase;
              const storagePath = `proposals/${docRef.id}/attachments/${attachmentId}`;
              const fileRef = ref(storage, storagePath);

              let lastErr: any;
              for (let attempt = 0; attempt < 4; attempt++) {
                try {
                  await uploadBytes(fileRef, file);
                  lastErr = null;
                  break;
                } catch (err: any) {
                  lastErr = err;
                  const isPermissionDenied = err?.code === 'storage/unauthorized' || err?.code === 'permission-denied';
                  if (!isPermissionDenied || attempt === 3) {
                    throw err;
                  }
                  await sleep(400 * (attempt + 1));
                }
              }

              if (lastErr) {
                throw lastErr;
              }
              const url = await getDownloadURL(fileRef);

              attachmentUrls.push({
                name: file.name,
                url,
                type: file.type,
                uploadedBy: user.uid,
                uploadedAt: Date.now(),
              });
            }

            await updateDoc(doc(db, 'proposals', docRef.id), {
              attachments: attachmentUrls,
              updatedAt: serverTimestamp(),
            });
          } catch (err: any) {
            console.error('Error uploading proposal attachments:', {
              message: err?.message,
              code: err?.code,
              name: err?.name,
              stack: err?.stack,
            });
            throw new Error(`Failed to upload proposal attachments: ${err?.message || 'unknown error'}${err?.code ? ` (code: ${err.code})` : ''}`);
          }
        }

        try {
          await writeProposalHistoryEntry(
            docRef.id,
            buildHistoryEntry(docRef.id, user, {
              changeType: 'proposal_created',
              track: 'proposal',
              newStatus: 'sent',
              changedFields: ['proposalStatus', 'title', 'description', 'requirements', 'deliverables', 'proposedBudget'],
              newValues: {
                proposalStatus: 'sent',
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
        } catch (err: any) {
          console.error('Error writing proposal history entry after creation:', {
            message: err?.message,
            code: err?.code,
            name: err?.name,
            stack: err?.stack,
          });
          throw new Error(`Failed to create proposal history entry: ${err?.message || 'unknown error'}${err?.code ? ` (code: ${err.code})` : ''}`);
        }

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

      const proposalData = proposalDoc.exists() ? proposalDoc.data() : null;
      const baseAmount = Number(proposalData?.finalAmount ?? proposalData?.proposedBudget ?? 0) || 0;
      const advancePercentage = Number(proposalData?.advancePercentage ?? 20) || 20;
      const nextAdvanceAmount = baseAmount > 0 ? (baseAmount * advancePercentage) / 100 : 0;
      const nextRemainingAmount = baseAmount > 0 ? baseAmount - nextAdvanceAmount : 0;
      const nextPaymentStatus = proposalData?.paymentMode === 'escrow' ? 'pending_escrow' : 'pending_advance';

      const now = Date.now();
      const paymentSchedule: PaymentScheduleItem[] = baseAmount > 0
        ? [
            {
              id: `advance_${now}`,
              type: 'advance',
              name: 'Advance',
              amount: Math.round(nextAdvanceAmount),
              dueAfter: 0,
              status: 'pending',
            },
            {
              id: `remaining_${now}`,
              type: 'remaining',
              name: 'Remaining',
              amount: Math.round(nextRemainingAmount),
              dueAfter: 100,
              status: 'pending',
            },
          ]
        : [];

      await updateDoc(proposalRef, {
        proposalStatus: 'accepted',
        paymentStatus: nextPaymentStatus,
        workStatus: 'not_started',
        ...(baseAmount > 0
          ? {
              finalAmount: baseAmount,
              advanceAmount: nextAdvanceAmount,
              remainingAmount: nextRemainingAmount,
              paymentSchedule,
            }
          : {}),
        declineReason: '',
        updatedAt: serverTimestamp(),
      });

      await writeProposalHistoryEntry(
        proposalId,
        buildHistoryEntry(proposalId, user, {
          changeType: 'proposal_status_changed',
          track: 'proposal',
          previousStatus,
          newStatus: 'accepted',
          changedFields: ['proposalStatus', 'declineReason', 'paymentStatus', 'workStatus', 'finalAmount', 'advanceAmount', 'remainingAmount', 'paymentSchedule'],
          previousValues: { proposalStatus: previousStatus, declineReason: proposalDoc.exists() ? proposalDoc.data()?.declineReason : undefined },
          newValues: {
            proposalStatus: 'accepted',
            paymentStatus: nextPaymentStatus,
            workStatus: 'not_started',
            declineReason: '',
            ...(baseAmount > 0
              ? {
                  finalAmount: baseAmount,
                  advanceAmount: nextAdvanceAmount,
                  remainingAmount: nextRemainingAmount,
                  paymentSchedule,
                }
              : {}),
          },
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
        proposalStatus: 'declined',
        declineReason: cleanReason,
        updatedAt: serverTimestamp(),
      });

      await writeProposalHistoryEntry(
        proposalId,
        buildHistoryEntry(proposalId, user, {
          changeType: 'proposal_declined',
          track: 'proposal',
          previousStatus,
          newStatus: 'declined',
          reason: cleanReason || undefined,
          changedFields: ['proposalStatus', 'declineReason'],
          previousValues: { proposalStatus: previousStatus },
          newValues: { proposalStatus: 'declined', declineReason: cleanReason },
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
// CLOSE PROPOSAL
// ============================================

export function useCloseProposal() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeProposal = useCallback(async (proposalId: string, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.uid) {
        throw new Error('Not authenticated');
      }

      const proposalRef = doc(db, 'proposals', proposalId);
      const proposalDoc = await getDoc(proposalRef);
      const previousStatus = proposalDoc.exists() ? proposalDoc.data()?.proposalStatus : undefined;
      const cleanReason = (reason || '').trim();

      await updateDoc(proposalRef, {
        proposalStatus: 'closed',
        closedReason: cleanReason,
        closedAt: serverTimestamp(),
        closedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

      await writeProposalHistoryEntry(
        proposalId,
        buildHistoryEntry(proposalId, user, {
          changeType: 'proposal_closed',
          track: 'proposal',
          previousStatus,
          newStatus: 'closed',
          reason: cleanReason || undefined,
          changedFields: ['proposalStatus', 'closedReason'],
          previousValues: { proposalStatus: previousStatus },
          newValues: { proposalStatus: 'closed', closedReason: cleanReason },
        })
      );

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error closing proposal:', err);
      const errorMessage = err.message || 'Failed to close proposal';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [user?.uid]);

  return { closeProposal, loading, error };
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

        const nextPaymentStatus = proposalData.paymentMode === 'escrow' ? 'pending_escrow' : 'pending_advance';

        await updateDoc(proposalRef, {
          proposalStatus: 'accepted',
          paymentStatus: nextPaymentStatus,
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
            newStatus: 'accepted',
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
              proposalStatus: 'accepted',
              paymentStatus: nextPaymentStatus,
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
    [user]
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
          const changeType: ProposalChangeType = updateData.proposalStatus === 'edited'
            ? 'proposal_edited'
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
            }, proposalDoc.exists() ? proposalDoc.data() : undefined)
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
