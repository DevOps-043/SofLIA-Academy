import { motion } from 'framer-motion';
import { RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SofliaAvatarBadge } from '@/core/components/SofliaAvatar/SofliaChatProvider';
import styles from '../CourseLiaPanel.module.css';

interface CourseLiaHeaderProps {
  isSpeaking: boolean;
  isVoiceEnabled: boolean;
  isVoiceTogglePending: boolean;
  onClearHistory: () => void;
  onClose: () => void;
  onToggleVoice: () => void;
  isMobile?: boolean;
}

export function CourseLiaHeader({
  isSpeaking,
  isVoiceEnabled,
  isVoiceTogglePending,
  onClearHistory,
  onClose,
  onToggleVoice,
  isMobile = false,
}: CourseLiaHeaderProps) {
  const { t } = useTranslation('learn');
  const { t: tc } = useTranslation('common');

  return (
    <header className={`${styles.header} ${isMobile ? styles.headerMobile : ''}`}>
      <div className={styles.identity}>
        <div className={styles.avatarWrap}>
          {isSpeaking ? (
            <motion.span
              className={styles.avatarPulse}
              aria-hidden="true"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : null}
          <SofliaAvatarBadge size={48} />
          <span className={styles.presence} aria-hidden="true" />
        </div>

        <div className={styles.identityCopy}>
          <h2 className={`lia-header-title ${styles.identityTitle}`}>
            {t('lia.title')}
          </h2>
          <p
            aria-live="polite"
            className={`${styles.identityStatus} ${isSpeaking ? styles.identityStatusSpeaking : ''}`}
          >
            {isSpeaking ? tc('lia.header.speaking') : tc('lia.header.subtitle')}
          </p>
        </div>
      </div>

      <div className={styles.headerActions}>
        <button
          type="button"
          onClick={onToggleVoice}
          disabled={isVoiceTogglePending}
          title={isVoiceEnabled ? tc('lia.voice.disable') : tc('lia.voice.enable')}
          aria-label={isVoiceEnabled ? tc('lia.voice.disable') : tc('lia.voice.enable')}
          aria-pressed={isVoiceEnabled}
          className={`${styles.iconButton} ${isVoiceEnabled ? styles.iconButtonActive : ''}`}
        >
          {isVoiceEnabled ? (
            <Volume2 size={16} aria-hidden="true" />
          ) : (
            <VolumeX size={16} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onClearHistory}
          title={t('lia.resetConversation')}
          aria-label={t('lia.resetConversation')}
          className={styles.iconButton}
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onClose}
          title={tc('actions.close')}
          aria-label={tc('actions.close')}
          className={styles.iconButton}
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
