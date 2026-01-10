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

    // Load both proposal conversations and direct conversations
    const loadAllConversations = async () => {
      try {
        const conversations: ChatConversation[] = [];
        const processedUserIds = new Set<string>(); // Track to avoid duplicates

        // 1. Load proposal-based conversations
        const proposalsField = role === 'promoter' ? 'promoterId' : 'influencerId';
        const otherUserIdField = role === 'promoter' ? 'influencerId' : 'promoterId';
        const proposalsQuery = query(
          collection(db, 'proposals'),
          where(proposalsField, '==', user.uid)
        );

        const proposalsSnapshot = await getDocs(proposalsQuery);

        for (const proposalDoc of proposalsSnapshot.docs) {
          const proposalData = proposalDoc.data();
          const otherUserId = proposalData[otherUserIdField];

          // Skip if we've already processed this user (avoid duplicates)
          if (processedUserIds.has(otherUserId)) continue;
          processedUserIds.add(otherUserId);

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
            console.warn('Proposal document is missing required fields:', proposalDoc.id);
            continue;
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
              let timestamp: number;
              const lastMsgTimestamp = convData.lastMessage.timestamp;
              
              if (lastMsgTimestamp && typeof lastMsgTimestamp.toMillis === 'function') {
                timestamp = lastMsgTimestamp.toMillis();
              } else if (lastMsgTimestamp && typeof lastMsgTimestamp.getTime === 'function') {
                timestamp = lastMsgTimestamp.getTime();
              } else if (typeof lastMsgTimestamp === 'number') {
                timestamp = lastMsgTimestamp;
              } else {
                timestamp = Date.now();
              }
              
              lastMessage = {
                id: 'last',
                conversationId: convDoc.id,
                senderId: convData.lastMessage.senderId,
                receiverId: '',
                content: convData.lastMessage.content,
                type: convData.lastMessage.type,
                timestamp,
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

        // 2. Load direct conversations (messages without proposals)
        const directConversationsQuery = query(
          collection(db, 'conversations'),
          where('type', '==', 'direct'),
          where(`participants.${user.uid}`, '!=', null) // User is a participant
        );

        const directConvSnapshot = await getDocs(directConversationsQuery);

        for (const convDoc of directConvSnapshot.docs) {
          const convData = convDoc.data();
          
          // Find the other participant
          const participants = Object.keys(convData.participants).filter(id => id !== user.uid);
          if (participants.length === 0) continue;
          
          const otherUserId = participants[0];
          
          // Skip if we've already processed this user from proposals
          if (processedUserIds.has(otherUserId)) continue;
          processedUserIds.add(otherUserId);

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

          // Get last message from conversation metadata
          let lastMessage: Message | undefined;
          if (convData.lastMessage) {
            let timestamp: number;
            const lastMsgTimestamp = convData.lastMessage.timestamp;
            
            if (lastMsgTimestamp && typeof lastMsgTimestamp.toMillis === 'function') {
              timestamp = lastMsgTimestamp.toMillis();
            } else if (lastMsgTimestamp && typeof lastMsgTimestamp.getTime === 'function') {
              timestamp = lastMsgTimestamp.getTime();
            } else if (typeof lastMsgTimestamp === 'number') {
              timestamp = lastMsgTimestamp;
            } else {
              timestamp = Date.now();
            }
            
            lastMessage = {
              id: 'last',
              conversationId: convDoc.id,
              senderId: convData.lastMessage.senderId,
              receiverId: '',
              content: convData.lastMessage.content,
              type: convData.lastMessage.type,
              timestamp,
              read: false,
            };
          }

          // Count unread messages for this direct conversation
          const unreadQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', convDoc.id),
            where('receiverId', '==', user.uid),
            where('read', '==', false)
          );
          const unreadSnapshot = await getDocs(unreadQuery);

          const directConversation: ChatConversation = {
            conversationId: convDoc.id,
            proposalId: undefined, // No proposal for direct conversations
            otherUser,
            lastMessage,
            unreadCount: unreadSnapshot.size,
          };

          conversations.push(directConversation);
        }

        // Sort by last message timestamp
        conversations.sort((a, b) => {
          const aTime = a.lastMessage?.timestamp || (a.proposal?.updatedAt ?? 0);
          const bTime = b.lastMessage?.timestamp || (b.proposal?.updatedAt ?? 0);
          return bTime - aTime;
        });

        setConversations(conversations);
        setLoading(false);
      } catch (error) {
        console.error('Error loading conversations:', error);
        setError(error instanceof Error ? error.message : 'Failed to load conversations');
        setLoading(false);
      }
    };

    loadAllConversations();
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
          let timestamp: number;
          
          // Handle Firebase server timestamp properly
          if (data.timestamp && typeof data.timestamp.toMillis === 'function') {
            timestamp = data.timestamp.toMillis();
          } else if (data.timestamp && typeof data.timestamp.getTime === 'function') {
            // Handle JavaScript Date object
            timestamp = data.timestamp.getTime();
          } else if (typeof data.timestamp === 'number') {
            timestamp = data.timestamp;
          } else {
            // Fallback to current time if timestamp is invalid
            // Note: serverTimestamp() can be null briefly before server processes it
            // This is normal Firebase behavior, so we only warn for truly invalid timestamps
            if (data.timestamp !== null && data.timestamp !== undefined) {
              console.warn('Invalid timestamp for message:', doc.id, data.timestamp);
            }
            timestamp = Date.now();
          }
          
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
            timestamp,
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
