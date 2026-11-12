'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { SofLIAMessage } from '../types/lia.types';
import { useOrganizationStore } from '../stores/organizationStore';
import { createInitialCourseMessages } from './useLiaCourseChat/messages';
import { useLiaConversationLifecycle } from './useLiaCourseChat/useLiaConversationLifecycle';
import { useLiaCourseMessageActions } from './useLiaCourseChat/useLiaCourseMessageActions';
import { useSubmitLiaCourseMessage } from './useLiaCourseChat/useSubmitLiaCourseMessage';
import type {
  LiaCourseChatUserProfile,
  UseLiaCourseChatReturn,
} from './useLiaCourseChat/types';

export type { UseLiaCourseChatReturn } from './useLiaCourseChat/types';

export function useLiaCourseChat(
  initialMessage?: string | null
): UseLiaCourseChatReturn {
  const { user } = useAuth();
  const currentOrganization = useOrganizationStore((state) => state.currentOrganization);
  const avatarScope = JSON.stringify([user?.id, currentOrganization?.id]);
  const userProfile = user as (typeof user & LiaCourseChatUserProfile) | null;
  const [messages, setMessages] = useState<SofLIAMessage[]>(() =>
    createInitialCourseMessages(initialMessage)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [avatarTurn, setAvatarTurn] = useState(0);
  const onTurnStarted = useCallback(() => setAvatarTurn(value => value + 1), []);
  const [error, setError] = useState<Error | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userName = userProfile?.first_name
    ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
    : userProfile?.display_name || userProfile?.nombre;

  const submitMessage = useSubmitLiaCourseMessage({
    onTurnStarted,
    isLoading,
    messages,
    userId: user?.id,
    userName,
    userJobTitle: userProfile?.job_title,
    organizationId: currentOrganization?.id,
    conversationIdRef,
    abortControllerRef,
    setMessages,
    setIsLoading,
    setError,
  });

  const { sendMessage, editMessageAndRegenerate, stop } = useLiaCourseMessageActions({
    isLoading,
    messages,
    abortControllerRef,
    setIsLoading,
    submitMessage,
  });

  const getCurrentConversationId = useCallback(() => conversationIdRef.current, []);
  const { loadConversation, clearHistory } = useLiaConversationLifecycle({
    user,
    initialMessage,
    conversationIdRef,
    setMessages,
    setIsLoading,
    setError,
  });

  return useMemo(
    () => ({
      avatarScope,
      avatarTurn,
      messages,
      isLoading,
      error,
      sendMessage,
      editMessageAndRegenerate,
      stop,
      clearHistory,
      loadConversation,
      currentConversationId: conversationIdRef.current,
      getCurrentConversationId,
    }),
    [
      avatarScope,
      avatarTurn,
      messages,
      isLoading,
      error,
      sendMessage,
      editMessageAndRegenerate,
      stop,
      clearHistory,
      loadConversation,
      getCurrentConversationId,
    ]
  );
}
