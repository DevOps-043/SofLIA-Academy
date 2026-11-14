'use client';

import { SofliaChatWelcome } from '@/core/components/SofliaAvatar/SofliaChatProvider';


import React from 'react';
import { motion } from 'framer-motion';
import type { AssistantTypewriterRevealState } from '@/core/hooks/useAssistantTypewriterReveal';
import { LiaQuickActionsChips } from './LiaQuickActionsChips';
import { LiaThemeColors, LiaQuickAction, LiaMessage } from './types';
import { parseMarkdownContent } from './utils/parseMarkdown';
import styles from './LiaSidePanel.module.css';

interface MessagesDisplayProps {
  messages: LiaMessage[];
  hideWelcome?: boolean;
  isLoading: boolean;
  /** Estado del revelado "máquina de escribir" gestionado por useLiaSidePanelLogic. */
  typewriterReveal: AssistantTypewriterRevealState;
  currentTip: string;
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
  isDarkMode: boolean;
  handleLinkClick: (url: string) => void;
  quickActions: LiaQuickAction[];
  handleQuickAction: (action: LiaQuickAction) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  handleChatScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function MessagesDisplay({
  messages,
  hideWelcome = false,
  isLoading,
  typewriterReveal,
  currentTip,
  themeColors,
  isLightTheme,
  isDarkMode,
  handleLinkClick,
  quickActions,
  handleQuickAction,
  messagesEndRef,
  chatContainerRef,
  handleChatScroll,
}: MessagesDisplayProps) {
  const isChatNearBottom = React.useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return true;

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceToBottom < 96;
  }, [chatContainerRef]);

  React.useEffect(() => {
    if (typewriterReveal.messageId && isChatNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [
    isChatNearBottom,
    messagesEndRef,
    typewriterReveal.isTyping,
    typewriterReveal.length,
    typewriterReveal.messageId,
  ]);

  const getVisibleAssistantContent = (message: LiaMessage) => {
    if (typewriterReveal.messageId !== message.id) {
      return message.content;
    }

    return message.content.slice(0, typewriterReveal.length);
  };

  const shouldShowTypewriterCursor = (message: LiaMessage) =>
    message.role === 'assistant' &&
    typewriterReveal.messageId === message.id &&
    typewriterReveal.isTyping;

  return (
    <>
      <div
        ref={chatContainerRef}
        onScroll={handleChatScroll}
        className={styles.messages}
      >
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <SofliaChatWelcome hidden={hideWelcome} />

            <motion.div
              key={currentTip}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.36 }}
            >
              <p className={styles.emptyEyebrow}>Asistente de aprendizaje</p>
              <h3 className={styles.emptyTitle}>SofLIA</h3>
              <p className={styles.emptyText}>{currentTip}</p>
            </motion.div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <motion.div
                key={message.id}
                className={`${styles.messageRow} ${isUser ? styles.messageRowUser : ''}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className={`${styles.messageBubble} ${
                    isUser
                      ? styles.messageBubbleUser
                      : styles.messageBubbleAssistant
                  }`}
                >
                  <div className={styles.messageText}>
                    {message.role === 'assistant' ? (
                      <>
                        {parseMarkdownContent(
                          getVisibleAssistantContent(message),
                          handleLinkClick,
                          isDarkMode,
                        )}
                        {shouldShowTypewriterCursor(message) && (
                          <motion.span
                            className={styles.typingCursor}
                            aria-hidden="true"
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 0.9, repeat: Infinity }}
                          />
                        )}
                      </>
                    ) : (
                      message.content
                    )}
                  </div>
                  <p className={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}

        {isLoading && (
          <div className={styles.messageRow} aria-label="SofLIA está respondiendo">
            <div className={styles.loadingBubble}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <LiaQuickActionsChips
        quickActions={quickActions}
        isLoading={false}
        isLightTheme={isLightTheme}
        themeColors={themeColors}
        onActionClick={handleQuickAction}
      />
    </>
  );
}
