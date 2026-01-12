// ============================================
// CHAT HOOKS
// ============================================

import { useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, collection, getDocs, query, where, orderBy, getDoc, onSnapshot, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuthStore } from '../stores';
import { useChatStore } from '../stores/chatStore';
import type { Message, ChatConversation, Proposal, User } from '../types';

// ============================================
// CREATE OR GET DIRECT CONVERSATION
// ============================================

export const useDirectConversation = () => {
  const { user } = useAuthStore();

  const getOrCreateDirectConversation = useCallback(
    async (otherUserId: string): Promise<string> => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      // Prevent users from creating conversations with themselves
      if (user.uid === otherUserId) {
        throw new Error('You cannot start a chat with yourself');
      }

      // Check if user has promoter role (required for chat)
      if (!user.roles || !user.roles.includes('promoter')) {
        throw new Error('Only promoters can start conversations');
      }

      // Find existing direct conversation (user is guaranteed participant; filter client-side for the other user)
      const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'direct'),
        where('participants', 'array-contains', user.uid)
      );

      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (
          data.participants &&
          data.participants.includes(user.uid) &&
          data.participants.includes(otherUserId)
        ) {
          return docSnap.id;
        }
      }

      // Create new direct conversation if none exists.
      // Use a deterministic document id to prevent duplicates if this is invoked twice concurrently.
      const now = Date.now();
      const conversationId = [user.uid, otherUserId].sort().join('_');
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationData = {
        type: 'direct',
        participants: [user.uid, otherUserId], // Use array instead of nested map
        participantData: {
          [user.uid]: { lastReadAt: now, hasLeft: false },
          [otherUserId]: { lastReadAt: now, hasLeft: false },
        },
        createdAt: now,
        updatedAt: now,
      };
      
      try {
        await setDoc(conversationRef, conversationData);
        return conversationId;
      } catch (error: any) {
        console.error('Error creating conversation:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        throw error;
      }
    }, [user?.uid]);

  return { getOrCreateDirectConversation };
}

// ============================================
// FETCH CONVERSATIONS
// ============================================

export type ChatRole = 'promoter' | 'influencer';

export function useConversations(role: ChatRole) {
  const { user } = useAuthStore();
  const conversations = useChatStore((s) => s.conversations);
  const loading = useChatStore((s) => s.isLoading);
  const error = useChatStore((s) => s.error);
  const setConversations = useChatStore((s) => s.setConversations);
  const setLoading = useChatStore((s) => s.setLoading);
  const setError = useChatStore((s) => s.setError);

  const proposalsDocsRef = useRef<any[]>([]);
  const directConversationDocsRef = useRef<any[]>([]);
  const hasInitialSnapshotsRef = useRef(false);
  const rebuildTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rebuildConversations = useCallback(async () => {
    if (!user?.uid) return;

    // Only show the global conversations loader on the initial load.
    // Subsequent snapshot-driven refreshes should avoid flickering the sidebar.
    if (!hasInitialSnapshotsRef.current && conversations.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      const allConversations: ChatConversation[] = [];
      const processedUserIds = new Set<string>();
      const processedDirectUserIds = new Set<string>();

      const proposalDocs = proposalsDocsRef.current;
      const directConvDocs = directConversationDocsRef.current;

      // 1) Proposal-based conversations
      const otherUserIdField = role === 'promoter' ? 'influencerId' : 'promoterId';

      for (const proposalDoc of proposalDocs) {
        const proposalData = proposalDoc.data();
        const otherUserId = proposalData[otherUserIdField];
        if (!otherUserId) continue;

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
          completionPercentage: proposalData.completionPercentage || 0,
          declineReason: proposalData.declineReason,
          fees: proposalData.fees,
        };

        // Try to find the conversation document for this proposal
        const convQuery = query(
          collection(db, 'conversations'),
          where('type', '==', 'proposal'),
          where('proposalId', '==', proposalDoc.id),
          where('participants', 'array-contains', user.uid)
        );
        const convSnapshot = await getDocs(convQuery);

        let conversationId: string | undefined;
        let lastMessage: Message | undefined;

        if (!convSnapshot.empty) {
          const convDoc = convSnapshot.docs[0];
          const convData = convDoc.data();
          conversationId = convDoc.id;

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

        const unreadQuery = query(
          collection(db, 'proposals', proposalDoc.id, 'messages'),
          where('receiverId', '==', user.uid),
          where('read', '==', false)
        );
        const unreadSnapshot = await getDocs(unreadQuery);

        allConversations.push({
          conversationId: conversationId || proposalDoc.id,
          proposalId: proposalDoc.id,
          proposal,
          otherUser,
          lastMessage,
          unreadCount: unreadSnapshot.size,
        });
      }

      // 2) Direct conversations
      for (const convDoc of directConvDocs) {
        const convData = convDoc.data();

        const participants = (convData.participants || []).filter((id: string) => id !== user.uid);
        if (participants.length === 0) continue;

        const otherUserId = participants[0];
        if (!otherUserId) continue;

        // Allow showing a direct conversation even if we already added a proposal conversation
        // for the same user. Only dedupe within direct conversations themselves.
        if (processedDirectUserIds.has(otherUserId)) continue;
        processedDirectUserIds.add(otherUserId);

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

        const unreadQuery = query(
          collection(db, 'conversations', convDoc.id, 'messages'),
          where('receiverId', '==', user.uid),
          where('read', '==', false)
        );
        const unreadSnapshot = await getDocs(unreadQuery);

        allConversations.push({
          conversationId: convDoc.id,
          proposalId: undefined,
          otherUser,
          lastMessage,
          unreadCount: unreadSnapshot.size,
        });
      }

      allConversations.sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || (a.proposal?.updatedAt ?? 0);
        const bTime = b.lastMessage?.timestamp || (b.proposal?.updatedAt ?? 0);
        return bTime - aTime;
      });

      setConversations(allConversations);
      setLoading(false);
      hasInitialSnapshotsRef.current = true;
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversations');
      setLoading(false);
      hasInitialSnapshotsRef.current = true;
    }
  }, [user?.uid, role, setConversations, setLoading, setError, conversations.length]);

  const scheduleRebuild = useCallback(() => {
    if (rebuildTimeoutRef.current) {
      clearTimeout(rebuildTimeoutRef.current);
    }
    rebuildTimeoutRef.current = setTimeout(() => {
      void rebuildConversations();
    }, 50);
  }, [rebuildConversations]);

  useEffect(() => {
    if (!user?.uid) return;

    // Start loading for the initial snapshot load
    if (conversations.length === 0) {
      setLoading(true);
    }
    setError(null);

    const proposalsField = role === 'promoter' ? 'promoterId' : 'influencerId';

    const proposalsQuery = query(
      collection(db, 'proposals'),
      where(proposalsField, '==', user.uid)
    );

    const directConversationsQuery = query(
      collection(db, 'conversations'),
      where('type', '==', 'direct'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeProposals = onSnapshot(
      proposalsQuery,
      (snapshot) => {
        proposalsDocsRef.current = snapshot.docs;
        scheduleRebuild();
      },
      (err) => {
        console.error('Error loading proposals conversations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
        setLoading(false);
      }
    );

    const unsubscribeDirect = onSnapshot(
      directConversationsQuery,
      (snapshot) => {
        directConversationDocsRef.current = snapshot.docs;
        scheduleRebuild();
      },
      (err) => {
        console.error('Error loading direct conversations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeProposals();
      unsubscribeDirect();
      if (rebuildTimeoutRef.current) {
        clearTimeout(rebuildTimeoutRef.current);
        rebuildTimeoutRef.current = null;
      }
      proposalsDocsRef.current = [];
      directConversationDocsRef.current = [];
      hasInitialSnapshotsRef.current = false;
    };
  }, [user?.uid, role, setError, setLoading, conversations.length, scheduleRebuild]);

  const refetch = useCallback(() => {
    scheduleRebuild();
  }, [scheduleRebuild]);

  return { conversations, loading, error, refetch };
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

    const messagesCollectionRef = proposalId
      ? collection(db, 'proposals', proposalId, 'messages')
      : collection(db, 'conversations', conversationId as string, 'messages');

    const messagesQuery = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages: Message[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
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
              console.warn('Invalid timestamp for message:', docSnap.id, data.timestamp);
            }
            timestamp = Date.now();
          }
          
          return {
            id: docSnap.id,
            conversationId: proposalId ? undefined : (conversationId as string),
            proposalId: proposalId || undefined,
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

      const now = Date.now();
      const messageData = {
        senderId: user.uid,
        receiverId,
        content,
        type: 'text',
        timestamp: serverTimestamp(),
        read: false,
      };

      const messagesCollectionRef = isProposal
        ? collection(db, 'proposals', (proposalId || chatId), 'messages')
        : collection(db, 'conversations', chatId, 'messages');

      const docRef = await addDoc(messagesCollectionRef, messageData);

      // Update metadata for both direct and proposal conversation docs
      await updateDoc(doc(db, 'conversations', chatId), {
        lastMessage: {
          content,
          type: 'text',
          timestamp: now,
          senderId: user.uid,
        },
        updatedAt: now,
      });

      // Optimistically add to store
      addMessage({
        id: docRef.id,
        ...(messageData as any),
        conversationId: chatId,
        proposalId: isProposal ? (proposalId || chatId) : undefined,
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

      const now = Date.now();
      const messageData = {
        senderId: user.uid,
        receiverId,
        content: '',
        type: 'image',
        attachmentUrl: imageUrl,
        attachmentName: file.name,
        timestamp: serverTimestamp(),
        read: false,
      };

      const messagesCollectionRef = isProposal
        ? collection(db, 'proposals', (proposalId || chatId), 'messages')
        : collection(db, 'conversations', chatId, 'messages');

      const docRef = await addDoc(messagesCollectionRef, messageData);

      await updateDoc(doc(db, 'conversations', chatId), {
        lastMessage: {
          content: '📷 Image',
          type: 'image',
          timestamp: now,
          senderId: user.uid,
        },
        updatedAt: now,
      });

      addMessage({
        id: docRef.id,
        ...(messageData as any),
        conversationId: chatId,
        proposalId: isProposal ? (proposalId || chatId) : undefined,
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

      const now = Date.now();
      const messageData = {
        senderId: user.uid,
        receiverId,
        content: `Sent a file: ${file.name}`,
        type: 'file',
        attachmentUrl: fileUrl,
        attachmentName: file.name,
        timestamp: serverTimestamp(),
        read: false,
      };

      const messagesCollectionRef = isProposal
        ? collection(db, 'proposals', (proposalId || chatId), 'messages')
        : collection(db, 'conversations', chatId, 'messages');

      const docRef = await addDoc(messagesCollectionRef, messageData);

      await updateDoc(doc(db, 'conversations', chatId), {
        lastMessage: {
          content: `📎 ${file.name}`,
          type: 'file',
          timestamp: now,
          senderId: user.uid,
        },
        updatedAt: now,
      });

      addMessage({
        id: docRef.id,
        ...(messageData as any),
        conversationId: chatId,
        proposalId: isProposal ? (proposalId || chatId) : undefined,
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

      // Update Firestore - proposal messages live under proposals/{proposalId}/messages
      const messagesQuery = query(
        collection(db, 'proposals', proposalId, 'messages'),
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

      // Update Firestore - direct messages live under conversations/{conversationId}/messages
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
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
