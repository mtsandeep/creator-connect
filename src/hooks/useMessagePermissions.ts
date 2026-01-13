// ============================================
// MESSAGE PERMISSIONS HOOK
// ============================================

import { useCallback } from 'react';
import { useAuthStore } from '../stores';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useMessagePermissions() {
  const { user } = useAuthStore();

  const hasDirectConversation = useCallback(async (otherUserId: string): Promise<boolean> => {
    if (!user?.uid) return false;

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('type', '==', 'direct'),
      where('participants', 'array-contains', user.uid)
    );

    const conversationsSnapshot = await getDocs(conversationsQuery);

    for (const docSnap of conversationsSnapshot.docs) {
      const convData = docSnap.data();
      if (Array.isArray(convData.participants) && convData.participants.includes(otherUserId)) {
        return true;
      }
    }

    return false;
  }, [user?.uid]);

  // Check if a promoter can message an influencer
  const canPromoterMessageInfluencer = useCallback(async (influencerId: string): Promise<boolean> => {
    if (!user?.uid || !user.activeRole) return false;

    // Only promoters can initiate messages
    if (user.activeRole !== 'promoter') return false;

    // Check if promoter is verified
    if (user.verificationBadges?.promoterVerified) {
      return true; // Verified promoters can message any influencer
    }

    // Check if there's already a conversation or proposal
    const existingContactQuery = query(
      collection(db, 'proposals'),
      where('promoterId', '==', user.uid),
      where('influencerId', '==', influencerId)
    );

    const proposalsSnapshot = await getDocs(existingContactQuery);
    if (!proposalsSnapshot.empty) {
      return true; // Already have a proposal
    }

    return await hasDirectConversation(influencerId);
  }, [user, hasDirectConversation]);

  // Check if an influencer can message a promoter
  const canInfluencerMessagePromoter = useCallback(async (promoterId: string): Promise<boolean> => {
    if (!user?.uid || !user.activeRole) return false;

    // Only influencers can use this function
    if (user.activeRole !== 'influencer') return false;

    // Influencers can only message promoters who have contacted them
    // Check for existing proposals
    const proposalsQuery = query(
      collection(db, 'proposals'),
      where('promoterId', '==', promoterId),
      where('influencerId', '==', user.uid)
    );

    const proposalsSnapshot = await getDocs(proposalsQuery);
    if (!proposalsSnapshot.empty) {
      return true; // Promoter has created a proposal
    }

    return await hasDirectConversation(promoterId);
  }, [user, hasDirectConversation]);

  // Generic permission check
  const canSendMessage = useCallback(async (otherUserId: string): Promise<{ can: boolean; reason?: string }> => {
    if (!user?.uid || !user.activeRole) {
      return { can: false, reason: 'Not authenticated or no active role' };
    }

    // Check if conversation already exists - allow replies in existing conversations
    const hasExistingConversation = await hasDirectConversation(otherUserId);
    if (hasExistingConversation) {
      return { can: true, reason: undefined };
    }

    // Get the other user's role
    const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
    if (!otherUserDoc.exists()) {
      return { can: false, reason: 'User not found' };
    }

    const otherUserData = otherUserDoc.data();
    const otherUserRoles = otherUserData.roles || [];

    if (user.activeRole === 'promoter' && otherUserRoles.includes('influencer')) {
      const can = await canPromoterMessageInfluencer(otherUserId);
      return { 
        can, 
        reason: can ? undefined : 'Promoters can only message verified influencers or those they have existing contact with' 
      };
    }

    if (user.activeRole === 'influencer' && otherUserRoles.includes('promoter')) {
      const can = await canInfluencerMessagePromoter(otherUserId);
      return { 
        can, 
        reason: can ? undefined : 'Influencers can only message promoters who have contacted them first' 
      };
    }

    return { can: false, reason: 'Invalid messaging combination' };
  }, [user, hasDirectConversation, canPromoterMessageInfluencer, canInfluencerMessagePromoter]);

  return {
    canSendMessage,
    canPromoterMessageInfluencer,
    canInfluencerMessagePromoter,
  };
}
