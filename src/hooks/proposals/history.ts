import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ProposalHistoryEntry, ProposalChangeType, ProposalHistoryTrack } from '../../types';

const removeUndefinedDeep = (value: any): any => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value
      .map((v) => removeUndefinedDeep(v))
      .filter((v) => v !== undefined);
  }

  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    Object.keys(value).forEach((key) => {
      const cleaned = removeUndefinedDeep(value[key]);
      if (cleaned !== undefined) out[key] = cleaned;
    });
    return out;
  }

  return value;
};

export const writeProposalHistoryEntry = async (
  proposalId: string,
  entry: Omit<ProposalHistoryEntry, 'id'>
) => {
  try {
    const safeEntry = removeUndefinedDeep(entry);
    await addDoc(collection(db, 'proposals', proposalId, 'history'), safeEntry);
  } catch (e) {
    console.error('Error writing proposal history entry:', e);
  }
};

const inferChangedByRole = (user: any, proposalData?: any): ProposalHistoryEntry['changedByRole'] => {
  // If we have proposal context, determine role based on relationship to proposal
  if (proposalData && user) {
    if (user.uid === proposalData.promoterId) {
      return 'promoter';
    }
    if (user.uid === proposalData.influencerId) {
      return 'influencer';
    }
  }
  
  // Fall back to active role if no proposal context
  const activeRole = user?.activeRole;
  if (activeRole === 'promoter' || activeRole === 'influencer') return activeRole;
  return 'system';
};

const inferChangedByName = (user: any, role?: ProposalHistoryEntry['changedByRole']): string | undefined => {
  if (!user) return undefined;
  
  // Use the determined role to pick the correct name
  if (role === 'promoter') return user.promoterProfile?.name;
  if (role === 'influencer') return user.influencerProfile?.displayName;
  
  // Fall back to active role if no role specified
  if (user.activeRole === 'promoter') return user.promoterProfile?.name;
  if (user.activeRole === 'influencer') return user.influencerProfile?.displayName;
  return undefined;
};

export const buildHistoryEntry = (
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
  },
  proposalData?: any
): Omit<ProposalHistoryEntry, 'id'> => {
  const determinedRole = inferChangedByRole(user, proposalData);
  
  return {
    proposalId,
    changedBy: user?.uid || 'system',
    changedByRole: determinedRole,
    changedByName: inferChangedByName(user, determinedRole),
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
