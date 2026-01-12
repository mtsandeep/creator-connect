import { useCallback, useState } from 'react';
import { doc, getDoc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuthStore } from '../../stores';
import type { PaymentScheduleItem } from '../../types';
import { buildHistoryEntry, writeProposalHistoryEntry } from './history';

export function useMarkAsPaid() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureInvoiceRecord = useCallback(async (
    params: {
      proposalId: string;
      proposalData: any;
      invoiceType: 'advance' | 'final';
      amount: number;
      paidAt: number;
      proof?: { method?: string; transactionId?: string; notes?: string; screenshotUrl?: string };
    }
  ) => {
    const proposalId = params.proposalId;
    const data = params.proposalData;
    const influencerId = data?.influencerId;
    const promoterId = data?.promoterId;

    if (!proposalId || !influencerId || !promoterId) return;

    const invoiceRef = doc(db, 'proposals', proposalId, 'invoices', params.invoiceType);
    const influencerRef = doc(db, 'users', influencerId);

    await runTransaction(db, async (tx) => {
      const existingInvoice = await tx.get(invoiceRef);
      if (existingInvoice.exists()) return;

      const influencerSnap = await tx.get(influencerRef);
      const influencerData = influencerSnap.exists() ? influencerSnap.data() : undefined;
      const invoiceSetup = influencerData?.influencerProfile?.invoiceSetup;

      const prefix: string = typeof invoiceSetup?.prefix === 'string' ? invoiceSetup.prefix : '';
      const datePart = new Date(params.paidAt).toISOString().slice(0, 10).replace(/-/g, '');
      const suffix = params.invoiceType === 'advance' ? 'ADV' : 'FIN';
      const invoiceNumber = `${prefix}${datePart}-${proposalId.slice(0, 6).toUpperCase()}-${suffix}`;

      tx.set(invoiceRef, {
        type: params.invoiceType,
        invoiceNumber,
        proposalId,
        influencerId,
        promoterId,
        amount: Math.round(Number(params.amount) || 0),
        currency: 'INR',
        paidAt: params.paidAt,
        paymentProof: params.proof ? params.proof : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }, []);

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

          await ensureInvoiceRecord({
            proposalId,
            proposalData: data,
            invoiceType: 'advance',
            amount: Math.round(Number(computedAdvanceAmount) || 0),
            paidAt,
            proof: {
              ...(details?.method ? { method: details.method } : {}),
              ...(details?.transactionId ? { transactionId: details.transactionId } : {}),
              ...(details?.notes ? { notes: details.notes } : {}),
              ...(screenshotUrl ? { screenshotUrl } : {}),
            },
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

          await ensureInvoiceRecord({
            proposalId,
            proposalData: data,
            invoiceType: 'final',
            amount: remainingAmount,
            paidAt,
            proof: {
              ...(details?.method ? { method: details.method } : {}),
              ...(details?.transactionId ? { transactionId: details.transactionId } : {}),
              ...(details?.notes ? { notes: details.notes } : {}),
              ...(screenshotUrl ? { screenshotUrl } : {}),
            },
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
    },
    [user]
  );

  return { markAsPaid, loading, error };
}
