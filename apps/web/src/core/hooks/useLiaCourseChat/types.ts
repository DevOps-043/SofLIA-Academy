import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { CourseLessonContext, SofLIAMessage } from '../../types/lia.types';
import type { LiaImageAttachment } from '../../reporting/report-problem.contract';

export interface LiaCourseChatUserProfile {
  nombre?: string;
  job_title?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
}

export interface LiaChatResponsePayload {
  chat_provenance?: {
    assistant_message_id?: string | null;
    conversation_id: string;
    user_message_id?: string;
  };
  conversationId?: string;
  response?: string;
  generatedNanoBanana?: SofLIAMessage['generatedNanoBanana'];
  message?: {
    content?: string;
    attachments?: LiaImageAttachment[];
  };
}

export interface LoadedLiaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: LiaImageAttachment[];
}

export interface UseLiaCourseChatReturn {
  avatarTurn?: number;
  avatarScope?: string;
  messages: SofLIAMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (
    message: string,
    courseContext?: CourseLessonContext,
    workshopContext?: CourseLessonContext,
    isSystemMessage?: boolean
  ) => Promise<void>;
  editMessageAndRegenerate: (
    messageId: string,
    message: string,
    courseContext?: CourseLessonContext,
    workshopContext?: CourseLessonContext
  ) => Promise<void>;
  stop: () => void;
  clearHistory: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
  getCurrentConversationId: () => string | null;
}

export interface SubmitCourseMessageParams {
  message: string;
  courseContext?: CourseLessonContext;
  workshopContext?: CourseLessonContext;
  isSystemMessage?: boolean;
  baseMessages?: SofLIAMessage[];
  optimisticMessages?: SofLIAMessage[];
}

export interface UseSubmitLiaCourseMessageParams {
  onTurnStarted?: () => void;
  isLoading: boolean;
  messages: SofLIAMessage[];
  userId?: string;
  userName?: string;
  userJobTitle?: string;
  organizationId?: string;
  conversationIdRef: MutableRefObject<string | null>;
  abortControllerRef: MutableRefObject<AbortController | null>;
  setMessages: Dispatch<SetStateAction<SofLIAMessage[]>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<Error | null>>;
}
