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
import type { Message, Conversation, Proposal, User } from '../types';

// ============================================
// FETCH CONVERSATIONS
// ============================================

export function useConversations() {
  const { user } = useAuthStore();
  const setConversations = useChatStore((s) => s.setConversations);
  const setLoading = useChatStore((s) => s.setLoading);
  const setError = useChatStore((s) => s.setError);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    // Query proposals where user is either promoter or influencer
    const proposalsQuery = query(
      collection(db, 'proposals'),
      where('promoterId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      proposalsQuery,
      async (snapshot) => {
        try {
          const conversations: Conversation[] = [];

          for (const proposalDoc of snapshot.docs) {
            const proposalData = proposalDoc.data();

            // Skip if user is not part of this proposal
            if (proposalData.influencerId !== user.uid && proposalData.promoterId !== user.uid) {
              continue;
            }

            // Get the other user's data
            const otherUserId =
              user.uid === proposalData.promoterId
                ? proposalData.influencerId
                : proposalData.promoterId;

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
            };

            const proposal: Proposal = {
              id: proposalDoc.id,
              promoterId: proposalData.promoterId,
              influencerId: proposalData.influencerId,
              status: proposalData.status,
              createdAt: proposalData.createdAt?.toMillis?.() || proposalData.createdAt || 0,
              updatedAt: proposalData.updatedAt?.toMillis?.() || proposalData.updatedAt || 0,
              title: proposalData.title,
              description: proposalData.description,
              requirements: proposalData.requirements,
              deliverables: proposalData.deliverables || [],
              proposedBudget: proposalData.proposedBudget,
              finalAmount: proposalData.finalAmount,
              advancePaid: proposalData.advancePaid || false,
              advanceAmount: proposalData.advanceAmount,
              advancePercentage: proposalData.advancePercentage,
              remainingAmount: proposalData.remainingAmount,
              attachments: proposalData.attachments || [],
              deadline: proposalData.deadline?.toMillis?.() || proposalData.deadline,
              brandApproval: proposalData.brandApproval,
              influencerApproval: proposalData.influencerApproval,
              completionPercentage: proposalData.completionPercentage || 0,
            };

            // Get last message
            const messagesQuery = query(
              collection(db, 'messages'),
              where('proposalId', '==', proposalDoc.id),
              orderBy('timestamp', 'desc'),
              orderBy('createdAt', 'desc')
            );

            const messagesSnapshot = await getDocs(messagesQuery);
            const lastMessage = messagesSnapshot.empty
              ? undefined
              : {
                  id: messagesSnapshot.docs[0].id,
                  proposalId: messagesSnapshot.docs[0].data().proposalId,
                  senderId: messagesSnapshot.docs[0].data().senderId,
                  receiverId: messagesSnapshot.docs[0].data().receiverId,
                  content: messagesSnapshot.docs[0].data().content,
                  type: messagesSnapshot.docs[0].data().type,
                  attachmentUrl: messagesSnapshot.docs[0].data().attachmentUrl,
                  attachmentName: messagesSnapshot.docs[0].data().attachmentName,
                  timestamp:
                    messagesSnapshot.docs[0].data().timestamp?.toMillis?.() ||
                    messagesSnapshot.docs[0].data().timestamp ||
                    0,
                  read: messagesSnapshot.docs[0].data().read || false,
                };

            // Count unread messages
            const unreadQuery = query(
              collection(db, 'messages'),
              where('proposalId', '==', proposalDoc.id),
              where('receiverId', '==', user.uid),
              where('read', '==', false)
            );

            const unreadSnapshot = await getDocs(unreadQuery);

            conversations.push({
              proposalId: proposalDoc.id,
              proposal,
              otherUser,
              lastMessage,
              unreadCount: unreadSnapshot.size,
            });
          }

          // Sort by last message timestamp
          conversations.sort((a, b) => {
            const aTime = a.lastMessage?.timestamp || a.proposal.createdAt;
            const bTime = b.lastMessage?.timestamp || b.proposal.createdAt;
            return bTime - aTime;
          });

          setConversations(conversations);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching conversations:', err);
          setError('Failed to load conversations');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Conversations query error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, setConversations, setLoading, setError]);
}

// ============================================
// FETCH MESSAGES FOR A PROPOSAL
// ============================================

export function useMessages(proposalId: string | null) {
  const { user } = useAuthStore();
  const setCurrentMessages = useChatStore((s) => s.setCurrentMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const setLoadingMessages = useChatStore((s) => s.setLoadingMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!proposalId || !user?.uid) return;

    setLoadingMessages(true);

    const messagesQuery = query(
      collection(db, 'messages'),
      where('proposalId', '==', proposalId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages: Message[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
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
  }, [proposalId, user?.uid, setCurrentMessages, setLoadingMessages]);

  return { messagesEndRef };
}

// ============================================
// SEND MESSAGE
// ============================================

export function useSendMessage() {
  const { user } = useAuthStore();
  const addMessage = useChatStore((s) => s.addMessage);

  const sendTextMessage = useCallback(
    async (proposalId: string, receiverId: string, content: string) => {
      if (!user?.uid) throw new Error('Not authenticated');

      const messageData = {
        proposalId,
        senderId: user.uid,
        receiverId,
        content,
        type: 'text',
        timestamp: serverTimestamp(),
        read: false,
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

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
    async (proposalId: string, receiverId: string, file: File) => {
      if (!user?.uid) throw new Error('Not authenticated');

      // Upload image
      const imageRef = ref(
        storage,
        `messages/${proposalId}/${Date.now()}_${file.name}`
      );

      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);

      const messageData = {
        proposalId,
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
    async (proposalId: string, receiverId: string, file: File) => {
      if (!user?.uid) throw new Error('Not authenticated');

      // Upload file
      const fileRef = ref(
        storage,
        `messages/${proposalId}/${Date.now()}_${file.name}`
      );

      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const messageData = {
        proposalId,
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

  const markConversationAsRead = useCallback(
    async (proposalId: string) => {
      if (!user?.uid) return;

      // Update store
      markAsRead(proposalId);

      // Update Firestore
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

  return { markConversationAsRead };
}
