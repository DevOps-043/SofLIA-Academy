import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import type { SofLIAMessage } from '@/core/types/lia.types';
import { SofliaChatAvatar } from '@/core/components/SofliaAvatar/SofliaChatProvider';
import styles from '../CourseLiaPanel.module.css';
import type { NormalizedLiaLink } from '../lia-link.utils';
import type { CourseLiaProps, CourseLiaThemeColors } from '../types';

import { CourseLiaMessageItem } from './CourseLiaMessageItem';
import { CourseLiaTypingIndicator } from './CourseLiaTypingIndicator';

interface CourseLiaMessagesProps {
  copiedMessageId: string | null;
  editInputRef: RefObject<HTMLTextAreaElement>;
  editingMessageId: string | null;
  editingValue: string;
  isDarkMode: boolean;
  isLoading: boolean;
  lessonTitle?: string;
  messages: SofLIAMessage[];
  messagesEndRef: RefObject<HTMLDivElement>;
  onCancelEditing: () => void;
  onCopyMessage: (messageId: string, content: string) => void | Promise<void>;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onLinkClick: (link: NormalizedLiaLink) => void;
  onSaveNote?: CourseLiaProps['onSaveNote'];
  onStartEditing: (message: SofLIAMessage) => void;
  onSubmitEditedMessage: () => void | Promise<void>;
  setEditingValue: (value: string) => void;
  stop: () => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaMessages(props: CourseLiaMessagesProps) {
  const { t } = useTranslation('learn');
  const { t: tc } = useTranslation('common');
  const isEmpty = props.messages.length === 0 && !props.isLoading;

  return (
    <div className={styles.messages}>
      {isEmpty ? (
        <div className={styles.emptyState}>
          <motion.div
            className={styles.emptyVisual}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <SofliaChatAvatar size={176} />
          </motion.div>
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.36 }}
          >
            <p className={styles.emptyEyebrow}>{tc('lia.header.subtitle')}</p>
            <h3 className={styles.emptyTitle}>{t('lia.title')}</h3>
            <p className={styles.emptyText}>{t('lia.subtitle')}</p>
            {props.lessonTitle ? (
              <p className={styles.lessonContext}>{props.lessonTitle}</p>
            ) : null}
          </motion.div>
        </div>
      ) : null}
      {props.messages.map((message, index) => (
        <CourseLiaMessageItem
          key={message.id}
          {...props}
          isEditingThisMessage={props.editingMessageId === message.id && message.role === 'user'}
          message={message}
          precedingUserMessage={
            message.role === 'assistant'
              ? [...props.messages.slice(0, index)]
                  .reverse()
                  .find((candidate) => candidate.role === 'user')?.content
              : undefined
          }
        />
      ))}
      {props.isLoading ? (
        <CourseLiaTypingIndicator stop={props.stop} />
      ) : null}
      <div ref={props.messagesEndRef} />
    </div>
  );
}
