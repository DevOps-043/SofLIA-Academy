'use client';

import { SofliaChatProfile } from '@/core/components/SofliaAvatar/SofliaChatProvider';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock3,
  MoreHorizontal,
  Settings2,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { LiaThemeColors, LiaMessage } from './types';
import styles from './LiaSidePanel.module.css';

interface PanelHeaderProps {
  t: (key: string) => string;
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
  isSpeaking: boolean;
  avatarExpanded?: boolean;
  isVoiceEnabled: boolean;
  toggleVoiceEnabled: () => void;
  isVoiceTogglePending: boolean;
  showHistory: boolean;
  closeHistory: () => void;
  setShowHistory: (v: boolean) => void;
  isOptionsMenuOpen: boolean;
  setIsOptionsMenuOpen: (v: boolean) => void;
  optionsMenuRef: React.RefObject<HTMLDivElement>;
  setIsPersonalizationOpen: (v: boolean) => void;
  clearHistory: () => void;
  messages: LiaMessage[];
  closePanel: () => void;
  setIsAvatarExpanded: (v: boolean) => void;
}

export function PanelHeader({
  t,
  isSpeaking,
  avatarExpanded = false,
  isVoiceEnabled,
  toggleVoiceEnabled,
  isVoiceTogglePending,
  showHistory,
  closeHistory,
  setShowHistory,
  isOptionsMenuOpen,
  setIsOptionsMenuOpen,
  optionsMenuRef,
  setIsPersonalizationOpen,
  clearHistory,
  messages,
  closePanel,
  setIsAvatarExpanded,
}: PanelHeaderProps) {
  const toggleHistory = () => {
    if (showHistory) {
      closeHistory();
      return;
    }

    setShowHistory(true);
  };

  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <button
          type="button"
          className={styles.avatarButton}
          onClick={() => setIsAvatarExpanded(true)}
          aria-label="Ampliar avatar de SofLIA"
        >
          {isSpeaking && (
            <motion.span
              className={styles.avatarPulse}
              aria-hidden="true"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {!avatarExpanded && <SofliaChatProfile />}
          <span className={styles.presence} aria-hidden="true" />
        </button>

        <div className={styles.identityCopy}>
          <h2 className={styles.identityTitle}>{t('lia.header.title')}</h2>
          <p className={styles.identityStatus} aria-live="polite">
            {isSpeaking ? t('lia.header.speaking') : t('lia.header.subtitle')}
          </p>
        </div>
      </div>

      <div className={styles.headerActions}>
        <button
          type="button"
          className={`${styles.iconButton} ${isVoiceEnabled ? styles.iconButtonActive : ''}`}
          onClick={toggleVoiceEnabled}
          disabled={isVoiceTogglePending}
          title={isVoiceEnabled ? t('lia.voice.disable') : t('lia.voice.enable')}
          aria-label={isVoiceEnabled ? t('lia.voice.disable') : t('lia.voice.enable')}
          aria-pressed={isVoiceEnabled}
        >
          {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button
          type="button"
          className={`${styles.iconButton} ${showHistory ? styles.iconButtonActive : ''}`}
          onClick={toggleHistory}
          title={showHistory ? 'Volver al chat' : 'Ver historial'}
          aria-label={showHistory ? 'Volver al chat' : 'Ver historial'}
          aria-pressed={showHistory}
        >
          <Clock3 size={16} />
        </button>

        <div ref={optionsMenuRef} className={styles.optionsWrap}>
          <button
            type="button"
            className={`${styles.iconButton} ${isOptionsMenuOpen ? styles.iconButtonActive : ''}`}
            onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
            title="Opciones"
            aria-label="Abrir opciones de SofLIA"
            aria-expanded={isOptionsMenuOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal size={17} />
          </button>

          <AnimatePresence>
            {isOptionsMenuOpen && (
              <motion.div
                className={styles.optionsMenu}
                role="menu"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  type="button"
                  className={styles.optionButton}
                  role="menuitem"
                  onClick={() => {
                    setIsPersonalizationOpen(true);
                    setIsOptionsMenuOpen(false);
                  }}
                >
                  <Settings2 size={15} aria-hidden="true" />
                  <span>Personalización</span>
                </button>

                <button
                  type="button"
                  className={`${styles.optionButton} ${styles.optionButtonDanger}`}
                  role="menuitem"
                  onClick={() => {
                    clearHistory();
                    setIsOptionsMenuOpen(false);
                  }}
                  disabled={messages.length === 0}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  <span>{t('lia.chat.cleanHistory')}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          className={styles.iconButton}
          onClick={closePanel}
          title="Cerrar SofLIA"
          aria-label="Cerrar panel de SofLIA"
        >
          <X size={17} />
        </button>
      </div>
    </header>
  );
}
