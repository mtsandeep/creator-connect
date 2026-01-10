// ============================================
// MESSAGE PERMISSIONS HOOK
// ============================================

import { useCallback } from 'react';
import { useAuthStore } from '../stores';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useMessagePermissions() {
  const { user } = useAuthStore();

  // Check if a promoter can message an influencer
  const canPromoterMessageInfluencer = useCallback(async (influencerId: string): Promise<boolean> => {
    if (!user?.uid || !user.activeRole) return false;

    // Only promoters can initiate messages
    if (user.activeRole !== 'promoter') return false;

    // Check if promoter is verified or has permission to contact this influencer
    if (user.verificationBadges?.promoterVerified) {
      return true; // Verified promoters can message any influencer
    }

    // Check if this influencer is in the allowed list (from link-in-bio contacts)
    if (user.allowedInfluencerIds?.includes(influencerId)) {
      return true;
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

    // Check for existing direct conversation
    // Since Firebase doesn't allow multiple != filters, we need to query differently
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('type', '==', 'direct'),
      where(`participants.${user.uid}`, '!=', null)
    );

    const conversationsSnapshot = await getDocs(conversationsQuery);
    
    // Check if any of these conversations also include the influencer
    for (const doc of conversationsSnapshot.docs) {
      const convData = doc.data();
      if (convData.participants[influencerId] !== null) {
        return true; // Found a conversation with both participants
      }
    }

    return false;
  }, [user]);

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

    // Check for existing direct conversation
    // Since Firebase doesn't allow multiple != filters, we need to query differently
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('type', '==', 'direct'),
      where(`participants.${user.uid}`, '!=', null)
    );

    const conversationsSnapshot = await getDocs(conversationsQuery);
    
    // Check if any of these conversations also include the promoter
    for (const doc of conversationsSnapshot.docs) {
      const convData = doc.data();
      if (convData.participants[promoterId] !== null) {
        return true; // Found a conversation with both participants
      }
    }

    // Check for any messages from this promoter
    const messagesQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', promoterId),
      where('receiverId', '==', user.uid)
    );

    const messagesSnapshot = await getDocs(messagesQuery);
    if (!messagesSnapshot.empty) {
      return true; // Promoter has sent a message before
    }

    return false;
  }, [user]);

  // Generic permission check
  const canSendMessage = useCallback(async (otherUserId: string): Promise<{ can: boolean; reason?: string }> => {
    if (!user?.uid || !user.activeRole) {
      return { can: false, reason: 'Not authenticated or no active role' };
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
  }, [user, canPromoterMessageInfluencer, canInfluencerMessagePromoter]);

  return {
    canSendMessage,
    canPromoterMessageInfluencer,
    canInfluencerMessagePromoter,
  };
}
