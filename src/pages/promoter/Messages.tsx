// ============================================
// PROMOTER MESSAGES PAGE
// ============================================

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useChatStore } from '../../stores/chatStore';
import { useConversations } from '../../hooks/useChat';
import ChatList from '../../components/chat/ChatList';

export default function PromoterMessages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const reset = useChatStore((s) => s.reset);

  // Load conversations
  useConversations();

  // Reset state when unmounting
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Check if there's an active proposal from URL params
  const activeProposalId = searchParams.get('proposal');

  // If a proposal is selected, navigate to chat view
  useEffect(() => {
    if (activeProposalId) {
      navigate(`/messages/${activeProposalId}`, { replace: true });
    }
  }, [activeProposalId, navigate]);

  return (
    <div className="h-[calc(100vh-100px)] flex items-center justify-center">
      <div className="w-full max-w-6xl px-4">
        <ChatList activeProposalId={activeProposalId || undefined} />
      </div>
    </div>
  );
}
