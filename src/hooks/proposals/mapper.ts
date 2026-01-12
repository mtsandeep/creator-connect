import type { Proposal } from '../../types';

export const convertDocToProposal = (doc: any): Proposal => {
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
