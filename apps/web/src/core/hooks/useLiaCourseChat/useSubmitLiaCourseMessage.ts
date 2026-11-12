import { useCallback } from 'react';
import { postLiaCourseMessage } from './api';
import { isAbortError, normalizeUnknownError } from './errors';
import { createAssistantErrorMessage, createMessageId, createUserMessage, normalizeCourseMessage } from './messages';
import { buildCourseChatRequestBody } from './request';
import { appendAssistantResponse } from './response';
import type { SubmitCourseMessageParams, UseSubmitLiaCourseMessageParams } from './types';

export function useSubmitLiaCourseMessage({
  onTurnStarted,
  isLoading,
  messages,
  userId,
  userName,
  userJobTitle,
  organizationId,
  conversationIdRef,
  abortControllerRef,
  setMessages,
  setIsLoading,
  setError,
}: UseSubmitLiaCourseMessageParams) {
  return useCallback(
    async ({
      message,
      courseContext,
      workshopContext,
      isSystemMessage = false,
      baseMessages,
      optimisticMessages,
    }: SubmitCourseMessageParams) => {
      const normalizedMessage = normalizeCourseMessage(message);

      if (!normalizedMessage || isLoading) {
        return;
      }

      const requestHistory = baseMessages ?? messages;
      if (!isSystemMessage) {
        setMessages(optimisticMessages ?? [...requestHistory, createUserMessage(normalizedMessage)]);
      }

      onTurnStarted?.();
      setIsLoading(true);
      setError(null);
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        conversationIdRef.current ??= createMessageId();
        const data = await postLiaCourseMessage(
          buildCourseChatRequestBody({
            conversationId: conversationIdRef.current,
            normalizedMessage,
            submitParams: { message, courseContext, workshopContext, isSystemMessage, baseMessages, optimisticMessages },
            runtime: { messages, userId, userName, userJobTitle, organizationId },
          }),
          abortControllerRef.current.signal
        );

        if (data.conversationId) {
          conversationIdRef.current = data.conversationId;
        }

        appendAssistantResponse(data, setMessages);
      } catch (error) {
        if (!isAbortError(error, abortControllerRef.current?.signal)) {
          setError(normalizeUnknownError(error));
          setMessages((prev) => [...prev, createAssistantErrorMessage(error)]);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [onTurnStarted, abortControllerRef, conversationIdRef, isLoading, messages, organizationId, setError, setIsLoading, setMessages, userId, userJobTitle, userName]
  );
}
