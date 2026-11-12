'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { SofLIAMessage } from '../types/lia.types';
import { useLanguage } from '../providers/I18nProvider';
import { useOrganizationStore } from '../stores/organizationStore';
import {
  consumeLiaChatStreamBuffer,
  isSafeLiaDownloadRequest,
  isSafeLiaNavigationTarget,
  type LiaDownloadRequest,
} from '../services/lia-chat-stream.service';
import { extractVisibleScreenContent } from '../components/LiaSidePanel/services/visible-screen-content.service';
import { getLiaChatErrorMessage, readLiaChatRequestError } from '../services/lia-chat-error.service';


type LegacyAuthUser = {
  id?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  platform_role?: string;
  job_title?: string;
  nombre?: string;
  type_rol?: string;
};

export interface UseLiaGeneralChatReturn {
  avatarTurn?: number;
  avatarScope?: string;
  messages: SofLIAMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (
    message: string,
    isSystemMessage?: boolean,
    pageContext?: Record<string, unknown>
  ) => Promise<void>;
  clearHistory: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
}

function normalizeGeneralMessage(
  message: string
): string {
  return message.trim();
}

function getClientNowMs(): number {
  return globalThis.performance?.now() ?? Date.now();
}

async function executeLiaDownload(request: LiaDownloadRequest): Promise<void> {
  const response = await fetch(request.url, {
    method: request.method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request.body),
  });
  if (!response.ok) throw new Error(`La descarga de SofLIA falló (${response.status})`);

  const blobUrl = window.URL.createObjectURL(await response.blob());
  const disposition = response.headers.get('content-disposition') || '';
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'soflia-reporte.pdf';
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function useLiaGeneralChat(
  initialMessage?: string | null
): UseLiaGeneralChatReturn {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const legacyUser = user as LegacyAuthUser | null;
  const [messages, setMessages] = useState<SofLIAMessage[]>(
    initialMessage !== null && initialMessage !== undefined && initialMessage !== ''
      ? [
          {
            id: 'initial',
            role: 'assistant',
            content: initialMessage,
            timestamp: new Date(),
          },
        ]
      : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [avatarTurn, setAvatarTurn] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const conversationIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (
      message: string,
      isSystemMessage: boolean = false,
      pageContext?: Record<string, unknown>
    ) => {
      const normalizedMessage = normalizeGeneralMessage(message);

      if (!normalizedMessage || isLoading) return;

      const requestStartedAtMs = getClientNowMs();

      if (!isSystemMessage) {
        const userMessage: SofLIAMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: normalizedMessage,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
      }

      setAvatarTurn(value => value + 1);
      setIsLoading(true);
      setError(null);

      try {
        if (!conversationIdRef.current) {
          conversationIdRef.current = crypto.randomUUID();
        }

        // Captura lo que el usuario ve AHORA (incluye modales/paneles de
        // estadísticas) para que SofLIA pueda explicar los datos en pantalla.
        const visibleScreen = extractVisibleScreenContent();

        const response = await fetch('/api/lia/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversationIdRef.current,
            messages: [
              ...messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              {
                role: 'user',
                content: normalizedMessage,
              },
            ],
            context: {
              userName: legacyUser?.first_name 
                ? `${legacyUser.first_name} ${legacyUser.last_name || ''}`.trim() 
                : (legacyUser?.display_name || legacyUser?.nombre),
              userRole:
                legacyUser?.job_title ||
                legacyUser?.platform_role ||
                legacyUser?.type_rol,
              ...(pageContext || {}),
              userId: user?.id,
              organizationId: currentOrganization?.id,
              currentPage:
                typeof window !== 'undefined'
                  ? window.location.pathname
                  : undefined,
              pageTitle: visibleScreen.title || undefined,
              pageHeadings: visibleScreen.headings.length > 0 ? visibleScreen.headings : undefined,
              pageVisibleText: visibleScreen.text || undefined,
              pageContentSource: visibleScreen.source,
            },
            stream: true,
          }),
        });

        if (!response.ok) {
          throw await readLiaChatRequestError(response);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        const assistantId = (Date.now() + 1).toString();
        const appendAssistantContent = (content: string) => {
          assistantContent += content;
          setMessages((prev) =>
            prev.map((entry) =>
              entry.id === assistantId
                ? { ...entry, content: assistantContent }
                : entry
            )
          );
        };

        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            clientTurnStartedAtMs: requestStartedAtMs,
          },
        ]);

        if (reader) {
          let streamBuffer = '';
          let navigationPath: string | undefined;
          const downloadRequests = new Map<string, LiaDownloadRequest>();
          // Lectura del stream SSE: el corte real es `done` desde `reader.read()`.
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            streamBuffer += decoder.decode(value, { stream: true });
            const parsed = consumeLiaChatStreamBuffer(streamBuffer);
            streamBuffer = parsed.remainingBuffer;

            for (const data of parsed.events) {
              if (data.content) {
                appendAssistantContent(data.content);
              }
              if (isSafeLiaNavigationTarget(data.navigateTo)) {
                navigationPath = data.navigateTo;
              }
              data.downloads?.forEach((download) => {
                if (isSafeLiaDownloadRequest(download)) {
                  downloadRequests.set(`${download.method}:${download.url}:${JSON.stringify(download.body)}`, download);
                }
              });
            }
          }

          streamBuffer += decoder.decode();
          const parsed = consumeLiaChatStreamBuffer(`${streamBuffer}\n\n`);
          for (const data of parsed.events) {
            if (data.content) {
              appendAssistantContent(data.content);
            }
            if (isSafeLiaNavigationTarget(data.navigateTo)) {
              navigationPath = data.navigateTo;
            }
            data.downloads?.forEach((download) => {
              if (isSafeLiaDownloadRequest(download)) {
                downloadRequests.set(`${download.method}:${download.url}:${JSON.stringify(download.body)}`, download);
              }
            });
          }

          if (downloadRequests.size > 0) {
            const results = await Promise.allSettled(
              [...downloadRequests.values()].map(executeLiaDownload),
            );
            if (results.some((result) => result.status === 'rejected')) {
              techDebtLogger.error('[SofLIA Actions] No se pudo completar una descarga autorizada');
            }
          }

          if (navigationPath) {
            router.push(navigationPath);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err : new Error('Error desconocido');
        setError(errorMessage);

        const errorResponse: SofLIAMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: getLiaChatErrorMessage(err),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrganization?.id, isLoading, legacyUser, messages, user, language, router]
  );

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/lia/conversations/${conversationId}/messages`
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error cargando conversación');
      }

      const data = (await response.json()) as {
        messages?: Array<{
          id: string;
          role: 'user' | 'assistant';
          content: string;
          timestamp: string;
        }>;
      };

      const formattedMessages: SofLIAMessage[] = (data.messages || []).map(
        (msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        })
      );

      setMessages(formattedMessages);
      conversationIdRef.current = conversationId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err : new Error('Error desconocido');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    // Capture and clear the ref before any async work
    const conversationIdToClose = conversationIdRef.current;
    conversationIdRef.current = null;

    // Optimistic update: reset UI instantly, no waiting for the network
    setMessages(
      initialMessage !== null &&
        initialMessage !== undefined &&
        initialMessage !== ''
        ? [
            {
              id: 'initial',
              role: 'assistant',
              content: initialMessage,
              timestamp: new Date(),
            },
          ]
        : []
    );
    setError(null);

    // Fire analytics update in background — purely for DB bookkeeping, not UI-critical
    if (conversationIdToClose && user) {
      fetch('/api/lia/end-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversationIdToClose, completed: true }),
      }).catch((closeError: unknown) => {
        techDebtLogger.error('[SofLIA Analytics] Error cerrando conversación:', closeError);
      });
    }
  }, [initialMessage, user]);

  useEffect(() => {
    return () => {
      if (conversationIdRef.current && user) {
        const data = JSON.stringify({
          conversationId: conversationIdRef.current,
          completed: false,
        });

        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/lia/end-conversation', data);
        }
      }
    };
  }, [user]);

  return {
    avatarTurn,
    avatarScope: JSON.stringify([user?.id, currentOrganization?.id]),
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    loadConversation,
    currentConversationId: conversationIdRef.current,
  };
}
