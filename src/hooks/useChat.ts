// ============================================
// CHAT HOOKS
// ============================================

import { useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuthStore } from '../stores';
import { useChatStore } from '../stores/chatStore';
import type { Message, ChatConversation, Proposal, User } from '../types';

// ============================================
// CREATE OR GET DIRECT CONVERSATION
// ============================================

export function useDirectConversation() {
  const { user } = useAuthStore();

  const getOrCreateDirectConversation = useCallback(async (otherUserId: string): Promise<string> => {
    if (!user?.uid) throw new Error('Not authenticated');

    // Query all direct conversations and filter for the one with both users as participants
    // We can't query by participants directly since it's a nested map
    const q = query(
      collection(db, 'conversations'),
      where('type', '==', 'direct')
    );

    const snapshot = await getDocs(q);

    // Find if any of these conversations has both users as participants
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.participants[user.uid] && data.participants[otherUserId]) {
        return docSnap.id;
      }
    }

    // Create new direct conversation if none exists
    const now = Date.now();
    const conversationRef = await addDoc(collection(db, 'conversations'), {
      type: 'direct',
      participants: {
        [user.uid]: { lastReadAt: now, hasLeft: false },
        [otherUserId]: { lastReadAt: now, hasLeft: false },
      },
      createdAt: now,
      updatedAt: now,
    });

    return conversationRef.id;
  }, [user?.uid]);

  return { getOrCreateDirectConversation };
}

// ============================================
// FETCH CONVERSATIONS
// ============================================

export type ChatRole = 'promoter' | 'influencer';

export function useConversations(role: ChatRole) {
  const { user } = useAuthStore();
  const setConversations = useChatStore((s) => s.setConversations);
  const setLoading = useChatStore((s) => s.setLoading);
  const setError = useChatStore((s) => s.setError);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    // Query proposals based on the role in the current context
    // This ensures influencers only see proposals where they are the influencer
    // and promoters only see proposals where they are the promoter
    const proposalsField = role === 'promoter' ? 'promoterId' : 'influencerId';
    const otherUserIdField = role === 'promoter' ? 'influencerId' : 'promoterId';
    const proposalsQuery = query(
      collection(db, 'proposals'),
      where(proposalsField, '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      proposalsQuery,
      async (snapshot) => {
        const conversations: ChatConversation[] = [];

        for (const proposalDoc of snapshot.docs) {
          const proposalData = proposalDoc.data();

          // Get the other user's data
          const otherUserId = proposalData[otherUserIdField];

          const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
          if (!otherUserDoc.exists()) continue;

          const otherUserData = otherUserDoc.data();

          const otherUser: User = {
            uid: otherUserDoc.id,
            email: otherUserData.email || '',
            roles: otherUserData.roles || [],
            activeRole: otherUserData.activeRole || null,
            createdAt: otherUserData.createdAt || 0,
            profileComplete: otherUserData.profileComplete || false,
            influencerProfile: otherUserData.influencerProfile,
            promoterProfile: otherUserData.promoterProfile,
            avgRating: otherUserData.avgRating || 0,
            totalReviews: otherUserData.totalReviews || 0,
            isBanned: otherUserData.isBanned || false,
            verificationBadges: otherUserData.verificationBadges || { verified: false, trusted: false },
          };

          if (!proposalData.proposalStatus || !proposalData.paymentStatus || !proposalData.workStatus) {
            throw new Error('Proposal document is missing proposalStatus/paymentStatus/workStatus');
          }

          const proposal: Proposal = {
            id: proposalDoc.id,
            promoterId: proposalData.promoterId,
            influencerId: proposalData.influencerId,

            proposalStatus: proposalData.proposalStatus,
            paymentStatus: proposalData.paymentStatus,
            workStatus: proposalData.workStatus,

            createdAt: proposalData.createdAt?.toMillis?.() || proposalData.createdAt || 0,
            updatedAt: proposalData.updatedAt?.toMillis?.() || proposalData.updatedAt || 0,
            title: proposalData.title,
            description: proposalData.description,
            requirements: proposalData.requirements,
            deliverables: proposalData.deliverables || [],
            proposedBudget: proposalData.proposedBudget,
            finalAmount: proposalData.finalAmount,
            advanceAmount: proposalData.advanceAmount,
            advancePercentage: proposalData.advancePercentage || 30,
            remainingAmount: proposalData.remainingAmount,
            paymentSchedule: proposalData.paymentSchedule,
            attachments: proposalData.attachments || [],
            deadline: proposalData.deadline?.toMillis?.() || proposalData.deadline,
            influencerAcceptedTerms: proposalData.influencerAcceptedTerms,
            influencerSubmittedWork: proposalData.influencerSubmittedWork,
            brandApprovedWork: proposalData.brandApprovedWork,
            completionPercentage: proposalData.completionPercentage || 0,
            declineReason: proposalData.declineReason,
            fees: proposalData.fees,
          };

          // Try to find the conversation document for this proposal
          const convQuery = query(
            collection(db, 'conversations'),
            where('type', '==', 'proposal'),
            where('proposalId', '==', proposalDoc.id)
          );
          const convSnapshot = await getDocs(convQuery);

          let conversationId: string | undefined;
          let lastMessage: Message | undefined;

          if (!convSnapshot.empty) {
            const convDoc = convSnapshot.docs[0];
            const convData = convDoc.data();
            conversationId = convDoc.id;

            // Get last message from conversation metadata
            if (convData.lastMessage) {
              lastMessage = {
                id: 'last',
                conversationId: convDoc.id,
                senderId: convData.lastMessage.senderId,
                receiverId: '',
                content: convData.lastMessage.content,
                type: convData.lastMessage.type,
                timestamp: convData.lastMessage.timestamp,
                read: false,
              };
            }
          }

          // Count unread messages for this proposal
          const unreadQuery = query(
            collection(db, 'messages'),
            where('proposalId', '==', proposalDoc.id),
            where('receiverId', '==', user.uid),
            where('read', '==', false)
          );
          const unreadSnapshot = await getDocs(unreadQuery);

          const conversation: ChatConversation = {
            conversationId: conversationId || proposalDoc.id,
            proposalId: proposalDoc.id,
            proposal,
            otherUser,
            lastMessage,
            unreadCount: unreadSnapshot.size,
          };

          conversations.push(conversation);
        }

        // Sort by last message timestamp
        conversations.sort((a, b) => {
          const aTime = a.lastMessage?.timestamp || (a.proposal?.updatedAt ?? 0);
          const bTime = b.lastMessage?.timestamp || (b.proposal?.updatedAt ?? 0);
          return bTime - aTime;
        });

        setConversations(conversations);
        setLoading(false);
      },
      (error) => {
        console.error('Proposals query error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, role, setConversations, setLoading, setError]);
}

// ============================================
// FETCH MESSAGES FOR A PROPOSAL OR DIRECT CONVERSATION
// ============================================

export function useMessages(proposalId: string | null, conversationId?: string | null) {
  const { user } = useAuthStore();
  const setCurrentMessages = useChatStore((s) => s.setCurrentMessages);
  const setLoadingMessages = useChatStore((s) => s.setLoadingMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // If no ID provided, clear messages
    if (!proposalId && !conversationId) {
      setCurrentMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);

    // For proposal chats, query by proposalId; for direct chats, query by conversationId
    const queryField = proposalId ? 'proposalId' : 'conversationId';
    const queryValue = proposalId || conversationId;

    const messagesQuery = query(
      collection(db, 'messages'),
      where(queryField, '==', queryValue),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages: Message[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            conversationId: data.conversationId,
            proposalId: data.proposalId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            type: data.type,
            attachmentUrl: data.attachmentUrl,
            attachmentName: data.attachmentName,
            timestamp: data.timestamp?.toMillis?.() || data.timestamp || 0,
            read: data.read || false,
          };
        });

        setCurrentMessages(messages);
        setLoadingMessages(false);

        // Scroll to bottom when new messages arrive
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (error) => {
        console.error('Messages query error:', error);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [proposalId, conversationId, user?.uid, setCurrentMessages, setLoadingMessages]);

  return { messagesEndRef };
}

// ============================================
// SEND MESSAGE
// ============================================

export function useSendMessage() {
  const { user } = useAuthStore();
  const addMessage = useChatStore((s) => s.addMessage);

  const sendTextMessage = useCallback(
    async (chatId: string, receiverId: string, content: string, isProposal: boolean = true, proposalId?: string) => {
      if (!user?.uid) throw new Error('Not authenticated');

      // For proposal chats, include both proposalId and conversationId
      // For direct chats, only include conversationId
      const messageData = isProposal
        ? {
            proposalId: proposalId || chatId,
            conversationId: chatId,
            senderId: user.uid,
            receiverId,
            content,
            type: 'text',
            timestamp: serverTimestamp(),
            read: false,
          }
        : {
            conversationId: chatId,
            senderId: user.uid,
            receiverId,
            content,
            type: 'text',
            timestamp: serverTimestamp(),
            read: false,
          };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      // Only update conversation metadata for direct chats (not proposal chats)
      if (!isProposal) {
        await updateDoc(doc(db, 'conversations', chatId), {
          lastMessage: {
            content,
            type: 'text',
            timestamp: Date.now(),
            senderId: user.uid,
          },
          updatedAt: Date.now(),
        });
      }

      // Optimistically add to store
      addMessage({
        id: docRef.id,
        ...messageData,
        timestamp: Date.now(),
      } as Message);

      return docRef.id;
    },
    [user?.uid, addMessage]
  );

  const sendImageMessage = useCallback(
    async (chatId: string, receiverId: string, file: File, isProposal: boolean = true, proposalId?: string) => {
      if (!user?.uid) throw new Error('Not authenticated');

      // Upload image
      const imageRef = ref(
        storage,
        `messages/${chatId}/${Date.now()}_${file.name}`
      );

      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);

      const messageData = isProposal
        ? {
            proposalId: proposalId || chatId,
            conversationId: chatId, // Always include conversationId for proposal chats
            senderId: user.uid,
            receiverId,
            content: '', // Image messages have empty content
            type: 'image',
            attachmentUrl: imageUrl,
            attachmentName: file.name,
            timestamp: serverTimestamp(),
            read: false,
          }
        : {
            conversationId: chatId,
            senderId: user.uid,
            receiverId,
            content: '', // Image messages have empty content
            type: 'image',
            attachmentUrl: imageUrl,
            attachmentName: file.name,
            timestamp: serverTimestamp(),
            read: false,
          };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      // Only update conversation metadata for direct chats
      if (!isProposal) {
        await updateDoc(doc(db, 'conversations', chatId), {
          lastMessage: {
            content: '📷 Image',
            type: 'image',
            timestamp: Date.now(),
            senderId: user.uid,
          },
          updatedAt: Date.now(),
        });
      }

      addMessage({
        id: docRef.id,
        ...messageData,
        timestamp: Date.now(),
      } as Message);

      return docRef.id;
    },
    [user?.uid, addMessage]
  );

  const sendFileMessage = useCallback(
    async (chatId: string, receiverId: string, file: File, isProposal: boolean = true, proposalId?: string) => {
      if (!user?.uid) throw new Error('Not authenticated');

      // Upload file
      const fileRef = ref(
        storage,
        `messages/${chatId}/${Date.now()}_${file.name}`
      );

      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const messageData = isProposal
        ? {
            proposalId: proposalId || chatId,
            conversationId: chatId, // Always include conversationId for proposal chats
            senderId: user.uid,
            receiverId,
            content: `Sent a file: ${file.name}`,
            type: 'file',
            attachmentUrl: fileUrl,
            attachmentName: file.name,
            timestamp: serverTimestamp(),
            read: false,
          }
        : {
            conversationId: chatId,
            senderId: user.uid,
            receiverId,
            content: `Sent a file: ${file.name}`,
            type: 'file',
            attachmentUrl: fileUrl,
            attachmentName: file.name,
            timestamp: serverTimestamp(),
            read: false,
          };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      // Only update conversation metadata for direct chats
      if (!isProposal) {
        await updateDoc(doc(db, 'conversations', chatId), {
          lastMessage: {
            content: `📎 ${file.name}`,
            type: 'file',
            timestamp: Date.now(),
            senderId: user.uid,
          },
          updatedAt: Date.now(),
        });
      }

      addMessage({
        id: docRef.id,
        ...messageData,
        timestamp: Date.now(),
      } as Message);

      return docRef.id;
    },
    [user?.uid, addMessage]
  );

  return { sendTextMessage, sendImageMessage, sendFileMessage };
}

// ============================================
// MARK MESSAGES AS READ
// ============================================

export function useMarkAsRead() {
  const { user } = useAuthStore();
  const markAsRead = useChatStore((s) => s.markAsRead);

  const markProposalAsRead = useCallback(
    async (proposalId: string) => {
      if (!user?.uid) return;

      // Update store
      markAsRead(proposalId);

      // Update Firestore - query by proposalId for proposal chats
      const messagesQuery = query(
        collection(db, 'messages'),
        where('proposalId', '==', proposalId),
        where('receiverId', '==', user.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(messagesQuery);

      const batch = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(batch);
    },
    [user?.uid, markAsRead]
  );

  const markDirectAsRead = useCallback(
    async (conversationId: string) => {
      if (!user?.uid) return;

      // Update Firestore - query by conversationId for direct chats
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('receiverId', '==', user.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(messagesQuery);

      const batch = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(batch);
    },
    [user?.uid]
  );

  const markConversationAsRead = useCallback(
    async (conversationId: string, isProposal: boolean = false) => {
      if (isProposal) {
        await markProposalAsRead(conversationId);
      } else {
        await markDirectAsRead(conversationId);
      }
    },
    [markProposalAsRead, markDirectAsRead]
  );

  return { markConversationAsRead, markProposalAsRead, markDirectAsRead };
}
