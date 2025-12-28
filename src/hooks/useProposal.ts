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
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuthStore } from '../stores';
import type { Proposal, ProposalAttachment, CreateProposalData } from '../types';

// ============================================
// FETCH PROPOSALS
// ============================================

export function useProposals() {
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

    // Helper to convert doc to Proposal
    const convertDocToProposal = (doc: any): Proposal => {
      const data = doc.data();
      return {
        id: doc.id,
        promoterId: data.promoterId,
        influencerId: data.influencerId,
        status: data.status,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || 0,
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        deliverables: data.deliverables || [],
        proposedBudget: data.proposedBudget,
        finalAmount: data.finalAmount,
        advancePaid: data.advancePaid || false,
        advanceAmount: data.advanceAmount,
        advancePercentage: data.advancePercentage,
        remainingAmount: data.remainingAmount,
        attachments: data.attachments || [],
        deadline: data.deadline?.toMillis?.() || data.deadline,
        brandApproval: data.brandApproval,
        influencerApproval: data.influencerApproval,
        completionPercentage: data.completionPercentage || 0,
      } as Proposal;
    };

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
  }, [user?.uid]);

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

        const data = doc.data();
        setProposal({
          id: doc.id,
          promoterId: data.promoterId,
          influencerId: data.influencerId,
          status: data.status,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || 0,
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          deliverables: data.deliverables || [],
          proposedBudget: data.proposedBudget,
          finalAmount: data.finalAmount,
          advancePaid: data.advancePaid || false,
          advanceAmount: data.advanceAmount,
          advancePercentage: data.advancePercentage,
          remainingAmount: data.remainingAmount,
          attachments: data.attachments || [],
          deadline: data.deadline?.toMillis?.() || data.deadline,
          brandApproval: data.brandApproval,
          influencerApproval: data.influencerApproval,
          completionPercentage: data.completionPercentage || 0,
        } as Proposal);

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
          status: 'pending',
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
          advancePaid: false,
          brandApproval: false,
          influencerApproval: false,
          completionPercentage: 0,
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
    async (proposalId: string, status: Proposal['status']) => {
      setLoading(true);
      setError(null);

      try {
        await updateDoc(doc(db, 'proposals', proposalId), {
          status,
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
        status: 'discussing',
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
  }, []);

  const declineProposal = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        status: 'cancelled',
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
        const advancePercentage = proposalData.advancePercentage || 20;
        const advanceAmount = (finalAmount * advancePercentage) / 100;
        const remainingAmount = finalAmount - advanceAmount;

        await updateDoc(proposalRef, {
          status: 'finalized',
          finalAmount,
          advanceAmount,
          remainingAmount,
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
    async (proposalId: string, updates: Partial<Proposal>) => {
      if (!user?.uid) {
        setError('Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      setLoading(true);
      setError(null);

      try {
        const updateData: any = {
          ...updates,
          updatedAt: serverTimestamp(),
        };

        // Convert deadline to Timestamp if provided
        if (updates.deadline) {
          updateData.deadline = new Date(updates.deadline);
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
