import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { HiXMark } from 'react-icons/hi2';
import { FiUser } from 'react-icons/fi';
import { LuPaperclip, LuSend, LuFile, LuDownload } from 'react-icons/lu';
import { db, storage } from '../../lib/firebase';
import { useAuthStore } from '../../stores';
import FileUpload from '../chat/FileUpload';

interface ProposalChatProps {
  proposalId: string;
  promoterId: string;
  influencerId: string;
  isInfluencer?: boolean;
  onClose?: () => void;
}

type ProposalChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: any;
  read: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
};

export default function ProposalChat({
  proposalId,
  promoterId,
  influencerId,
  isInfluencer = false,
  onClose,
}: ProposalChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ProposalChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const [promoterAvatar, setPromoterAvatar] = useState<string | null>(null);
  const [influencerAvatar, setInfluencerAvatar] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const receiverId = useMemo(() => {
    if (isInfluencer) return promoterId;
    return influencerId;
  }, [influencerId, isInfluencer, promoterId]);

  useEffect(() => {
    if (!promoterId || !influencerId) return;

    const loadAvatars = async () => {
      try {
        const [promoterSnap, influencerSnap] = await Promise.all([
          getDoc(doc(db, 'users', promoterId)),
          getDoc(doc(db, 'users', influencerId)),
        ]);

        const promoterData: any = promoterSnap.exists() ? promoterSnap.data() : null;
        const influencerData: any = influencerSnap.exists() ? influencerSnap.data() : null;

        const promoterLogo = typeof promoterData?.promoterProfile?.logo === 'string'
          ? promoterData.promoterProfile.logo
          : null;
        const influencerProfileImage = typeof influencerData?.influencerProfile?.profileImage === 'string'
          ? influencerData.influencerProfile.profileImage
          : null;

        setPromoterAvatar(promoterLogo);
        setInfluencerAvatar(influencerProfileImage);
      } catch (err) {
        // Silent fallback to icons
        setPromoterAvatar(null);
        setInfluencerAvatar(null);
      }
    };

    void loadAvatars();
  }, [promoterId, influencerId]);

  const getDicebearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || 'User')}`;
  };

  const myAvatarUrl = useMemo(() => {
    if (isInfluencer) {
      return influencerAvatar || (typeof (user as any)?.influencerProfile?.profileImage === 'string' ? (user as any).influencerProfile.profileImage : null);
    }
    return promoterAvatar || (typeof (user as any)?.promoterProfile?.logo === 'string' ? (user as any).promoterProfile.logo : null);
  }, [influencerAvatar, isInfluencer, promoterAvatar, user]);

  const otherAvatarUrl = useMemo(() => {
    return isInfluencer ? promoterAvatar : influencerAvatar;
  }, [influencerAvatar, isInfluencer, promoterAvatar]);

  const markUnreadAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const unreadQuery = query(
        collection(db, 'proposals', proposalId, 'messages'),
        where('receiverId', '==', user.uid),
        where('read', '==', false)
      );

      const snap = await getDocs(unreadQuery);
      if (snap.empty) return;

      await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
    }
  }, [proposalId, user?.uid]);

  useEffect(() => {
    if (!proposalId || !user?.uid) return;

    setLoading(true);
    setError(null);

    const messagesQuery = query(
      collection(db, 'proposals', proposalId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as any),
          }))
        );
        setLoading(false);
        void markUnreadAsRead();
      },
      (err) => {
        console.error('Error loading proposal chat messages:', err);
        setError(err?.message || 'Failed to load messages');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [proposalId, user?.uid, markUnreadAsRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;

    // Reset height so scrollHeight reflects the full content size
    el.style.height = 'auto';

    const maxPx = 160;
    const next = Math.min(el.scrollHeight, maxPx);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxPx ? 'auto' : 'hidden';
  }, [draft]);

  const sendMessage = useCallback(async () => {
    if (!user?.uid) return;

    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setError(null);

    try {
      await addDoc(collection(db, 'proposals', proposalId, 'messages'), {
        senderId: user.uid,
        receiverId,
        content,
        type: 'text',
        timestamp: serverTimestamp(),
        read: false,
      });

      setDraft('');
    } catch (err: any) {
      console.error('Error sending proposal message:', err);
      setError(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [draft, proposalId, receiverId, user?.uid]);

  const sendImageMessage = useCallback(
    async (file: File) => {
      if (!user?.uid) return;
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setSending(true);
      setError(null);

      try {
        const imageRef = ref(storage, `messages/${proposalId}/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);

        await addDoc(collection(db, 'proposals', proposalId, 'messages'), {
          senderId: user.uid,
          receiverId,
          content: '',
          type: 'image',
          attachmentUrl: imageUrl,
          attachmentName: file.name,
          timestamp: serverTimestamp(),
          read: false,
        });

        setShowFileUpload(false);
      } catch (err: any) {
        console.error('Error sending proposal image message:', err);
        setError(err?.message || 'Failed to send image');
      } finally {
        setSending(false);
      }
    },
    [proposalId, receiverId, user?.uid]
  );

  const sendFileMessage = useCallback(
    async (file: File) => {
      if (!user?.uid) return;

      setSending(true);
      setError(null);

      try {
        const fileRef = ref(storage, `messages/${proposalId}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);

        await addDoc(collection(db, 'proposals', proposalId, 'messages'), {
          senderId: user.uid,
          receiverId,
          content: `Sent a file: ${file.name}`,
          type: 'file',
          attachmentUrl: fileUrl,
          attachmentName: file.name,
          timestamp: serverTimestamp(),
          read: false,
        });

        setShowFileUpload(false);
      } catch (err: any) {
        console.error('Error sending proposal file message:', err);
        setError(err?.message || 'Failed to send file');
      } finally {
        setSending(false);
      }
    },
    [proposalId, receiverId, user?.uid]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="bg-white/5 overflow-hidden flex flex-col h-full">
      <div className="px-5 py-2 border-b border-white/10 flex items-center justify-between h-[64px]">
        <div>
          <h2 className="text-white font-semibold">Proposal Chat</h2>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {loading ? (
          <div className="text-sm text-gray-400">Loading messages...</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-gray-400">No messages yet. Start the conversation.</div>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === user?.uid;
            const ts = (m as any).timestamp?.toMillis?.() || (m as any).timestamp?.getTime?.() || (m as any).timestamp || 0;
            return (
              <div key={m.id} className={isMine ? 'flex justify-end' : 'flex justify-start'}>
                <div className="flex max-w-[80%] items-end gap-2">
                  {!isMine ? (
                    otherAvatarUrl ? (
                      <img
                        src={otherAvatarUrl}
                        alt="User"
                        className="w-8 h-8 rounded-full object-cover bg-white/10 border border-white/10 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = getDicebearAvatar(isInfluencer ? 'Promoter' : 'Influencer');
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-4 h-4 text-gray-300" />
                      </div>
                    )
                  ) : null}

                  <div className={isMine ? 'flex flex-col items-end min-w-0 flex-1' : 'flex flex-col items-start min-w-0 flex-1'}>
                    <div
                      className={
                        isMine
                          ? 'max-w-full w-fit bg-[#B8FF00] text-gray-900 rounded-xl rounded-br-md px-4 py-3'
                          : 'max-w-full w-fit bg-white/10 text-white rounded-xl rounded-bl-md px-4 py-3'
                      }
                    >
                    {m.type === 'text' ? (
                      <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                    ) : null}

                  {m.type === 'image' && m.attachmentUrl ? (
                    <div className="space-y-2">
                      <img
                        src={m.attachmentUrl}
                        alt="Sent image"
                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(m.attachmentUrl, '_blank')}
                      />
                      {m.content ? <div className="text-sm whitespace-pre-wrap">{m.content}</div> : null}
                    </div>
                  ) : null}

                  {m.type === 'file' && m.attachmentUrl ? (
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                      <LuFile className="w-8 h-8 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.attachmentName}</p>
                        <p className="text-xs text-gray-400">Click to download</p>
                      </div>
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Download"
                      >
                        <LuDownload className="w-5 h-5 text-gray-400" />
                      </a>
                    </div>
                  ) : null}

                    </div>

                    <div className={isMine ? 'flex items-center justify-end gap-1 text-[10px] text-gray-400 mt-1' : 'flex items-center justify-start gap-1 text-[10px] text-gray-400 mt-1'}>
                      {ts ? (
                        <span
                          title={new Date(ts).toLocaleString()}
                          className="cursor-default"
                        >
                          {formatDistanceToNow(new Date(ts), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="inline-block h-[10px] w-[120px] bg-white/20 rounded animate-pulse" />
                      )}
                      {isMine ? (
                        <span className={m.read ? 'text-[#B8FF00]' : 'text-gray-500'}>{m.read ? '✓✓' : '✓'}</span>
                      ) : null}
                    </div>
                  </div>

                  {isMine ? (
                    myAvatarUrl ? (
                      <img
                        src={myAvatarUrl}
                        alt="You"
                        className="w-8 h-8 rounded-full object-cover bg-[#B8FF00] border border-[#B8FF00]/30 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = getDicebearAvatar('You');
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#B8FF00] border border-[#B8FF00]/30 flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-4 h-4 text-gray-900" />
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {showFileUpload ? (
        <div className="px-5 pb-2">
          <FileUpload
            onFileSelect={(file) => {
              if (file.type.startsWith('image/')) {
                void sendImageMessage(file);
              } else {
                void sendFileMessage(file);
              }
            }}
            accept="image/*,.pdf,.doc,.docx,.txt"
            disabled={sending}
          />
        </div>
      ) : null}

      <div className="bg-white/5 border-t border-white/10 p-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${showFileUpload ? 'bg-[#B8FF00] text-gray-900' : 'text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer'
              }`}
            title="Attach file"
          >
            <LuPaperclip className="w-5 h-5" />
          </button>

          <textarea
            ref={composerRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message..."
            className="w-full bg-transparent border-0 px-2 py-2 text-white placeholder-gray-500 resize-none focus:outline-none overflow-y-auto"
            disabled={sending}
            style={{ minHeight: '40px' }}
          />

          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || !draft.trim()}
            className={`p-2 rounded-lg cursor-pointer transition-colors flex-shrink-0 ${draft.trim() && !sending
                ? 'bg-[#B8FF00] text-gray-900'
                : 'text-gray-500 cursor-not-allowed'
              }`}
            title="Send message"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            ) : (
              <LuSend className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 mt-1">
          <p className="text-[11px] text-gray-500 pl-2">Press Enter to send, Shift + Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
