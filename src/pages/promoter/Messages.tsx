// ============================================
// PROMOTER MESSAGES PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, getDocs, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../stores';

export default function PromoterMessages() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Get selected proposal from URL params
  useEffect(() => {
    const proposalId = searchParams.get('proposal');
    if (proposalId) {
      setSelectedProposalId(proposalId);
    }
  }, [searchParams]);

  // Fetch conversations (proposals with messages)
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    const proposalsQuery = query(
      collection(db, 'proposals'),
      where('promoterId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(proposalsQuery, async (snapshot) => {
      const proposalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // For each proposal, get the last message and unread count
      const conversationsWithMessages = await Promise.all(
        proposalsData.map(async (proposal) => {
          const messagesQuery = query(
            collection(db, 'messages'),
            where('proposalId', '==', proposal.id),
            orderBy('timestamp', 'desc')
          );

          const messagesSnapshot = await getDocs(messagesQuery);
          const messagesList = messagesSnapshot.docs.map(doc => doc.data());

          const unreadCount = messagesList.filter(
            (m: any) => !m.read && m.senderId !== user.uid
          ).length;

          return {
            ...proposal,
            lastMessage: messagesList[0] || null,
            unreadCount,
          };
        })
      );

      // Sort by last message time, then by proposal updated time
      conversationsWithMessages.sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || a.updatedAt;
        const bTime = b.lastMessage?.timestamp || b.updatedAt;
        return bTime - aTime;
      });

      setConversations(conversationsWithMessages);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch messages for selected proposal
  useEffect(() => {
    if (!selectedProposalId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'messages'),
      where('proposalId', '==', selectedProposalId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);

      // Mark messages as read
      messagesData.forEach((message) => {
        if (!message.read && message.senderId !== user?.uid) {
          updateDoc(doc(db, 'messages', message.id), { read: true });
        }
      });
    }, (error) => {
      console.error('Error fetching messages:', error);
    });

    return () => unsubscribe();
  }, [selectedProposalId, user?.uid]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedProposalId || !user?.uid) return;

    try {
      const proposal = conversations.find(c => c.id === selectedProposalId);
      if (!proposal) return;

      await addDoc(collection(db, 'messages'), {
        proposalId: selectedProposalId,
        senderId: user.uid,
        receiverId: proposal.influencerId,
        content: newMessage.trim(),
        type: 'text',
        timestamp: serverTimestamp(),
        read: false,
      });

      // Update proposal updated time
      await updateDoc(doc(db, 'proposals', selectedProposalId), {
        updatedAt: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedProposalId);

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className={`w-full lg:w-96 border-r border-white/10 flex flex-col ${selectedProposalId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-gray-400 text-sm mt-1">Chat with influencers about collaborations</p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8FF00]"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-white font-semibold mb-2">No messages yet</h3>
              <p className="text-gray-400 text-sm">
                Start chatting when influencers respond to your proposals
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedProposalId(conversation.id)}
                className={`w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/10 ${
                  selectedProposalId === conversation.id ? 'bg-[#B8FF00]/10 border-l-2 border-l-[#B8FF00]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#00D9FF]/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {(conversation.influencerName || 'Creator')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-medium truncate">
                        {conversation.influencerName || 'Creator'}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-[#B8FF00] text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">{conversation.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500 truncate flex-1">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conversation.lastMessage?.timestamp && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedProposalId ? 'hidden lg:flex' : 'flex'}`}>
        {selectedProposalId && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#00D9FF]/50 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {(selectedConversation.influencerName || 'Creator')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-medium">{selectedConversation.influencerName || 'Creator'}</h3>
                  <p className="text-xs text-gray-400">{selectedConversation.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProposalId(null);
                  navigate('/promoter/messages');
                }}
                className="text-gray-400 hover:text-white lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-white font-semibold mb-2">Start the conversation</h3>
                    <p className="text-gray-400 text-sm">Send a message to discuss this collaboration</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === user?.uid;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-[#B8FF00] text-gray-900'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Sending...'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 disabled:bg-white/10 disabled:text-gray-500 text-gray-900 font-semibold p-3 rounded-xl transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-white font-semibold mb-2">Select a conversation</h3>
              <p className="text-gray-400 text-sm">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
