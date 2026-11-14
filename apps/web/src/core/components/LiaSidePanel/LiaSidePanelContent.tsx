'use client';

import React from 'react';
import { SofliaChatProvider, SofliaChatAvatar } from '@/core/components/SofliaAvatar/SofliaChatProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { chooseReadableTextColor } from '@/core/theme/color-engine';
import { SofLIAPersonalizationSettings } from '../../../features/lia/components/SofLIAPersonalizationSettings';
import { useLiaSidePanelLogic } from './hooks/useLiaSidePanelLogic';
import { PanelHeader } from './PanelHeader';
import { MessagesDisplay } from './MessagesDisplay';
import { InputArea } from './InputArea';
import { LiveVoiceStage } from './LiveVoiceStage';
import { HistoryOverlay } from './HistoryOverlay';
import { DeleteConversationModal } from './DeleteConversationModal';
import styles from './LiaSidePanel.module.css';

function LiaSidePanelContent() {
  const {
    t, user, isOpen, closePanel,
    isDarkMode, isLightTheme, themeColors,
    messages, isLoading, clearHistory, currentConversationId, avatarTurn, avatarScope, chatError,
    inputValue, setInputValue, inputRef, messagesEndRef, chatContainerRef,
    handleChatScroll, handleSendMessage, handleQuickAction, handleLinkClick, quickActions,
    currentTip, tips,
    typewriterReveal, isResponding,
    isSpeaking, isVoiceEnabled, toggleVoiceEnabled, isVoiceTogglePending,
    isDictationEnabled, isDictating, isProcessingDictation, interimTranscript, finalTranscript, dictationError, setDictationError, toggleDictation, stopDictation,
    liveVoiceStatus, isLiveVoiceActive, isAssistantLiveSpeaking, toggleLiveVoice, stopLiveVoice,
    isOptionsMenuOpen, setIsOptionsMenuOpen, optionsMenuRef,
    isPersonalizationOpen, setIsPersonalizationOpen,
    isAvatarExpanded, setIsAvatarExpanded,
    showHistory, setShowHistory, closeHistory, historyList, isHistoryLoading,
    editingConversationId, editingTitle, setEditingTitle, deletingConversationId, showDeleteConfirm, conversationToDelete,
    deleteError, setDeleteError,
    currentPage, totalConversations, hasMore,
    handleNextPage, handlePrevPage, handleSelectConversation, handleStartEdit, handleSaveEdit, handleCancelEdit, handleDeleteClick, handleConfirmDelete, handleCancelDelete,
  } = useLiaSidePanelLogic();

  React.useEffect(() => {
    if (!isLiveVoiceActive) return;
    setShowHistory(false);
    setIsOptionsMenuOpen(false);
  }, [isLiveVoiceActive, setIsOptionsMenuOpen, setShowHistory]);

  const setShowHistoryFromHeader = React.useCallback(
    (value: boolean) => {
      if (isLiveVoiceActive) return;
      setShowHistory(value);
    },
    [isLiveVoiceActive, setShowHistory],
  );

  const setOptionsMenuFromHeader = React.useCallback(
    (value: boolean) => {
      if (isLiveVoiceActive) return;
      setIsOptionsMenuOpen(value);
    },
    [isLiveVoiceActive, setIsOptionsMenuOpen],
  );

  const panelStyle = {
    '--lia-panel-bg': themeColors.panelBg,
    '--lia-header-bg': themeColors.headerBg,
    '--lia-border': themeColors.borderColor,
    '--lia-accent': themeColors.accentColor,
    '--lia-text': themeColors.textPrimary,
    '--lia-muted': themeColors.textSecondary,
    '--lia-user-bubble': themeColors.messageBubbleUser,
    '--lia-assistant-bubble': themeColors.messageBubbleAssistant,
    '--lia-on-user': chooseReadableTextColor(themeColors.messageBubbleUser),
    '--lia-input-bg': themeColors.inputBg,
    '--lia-input-border': themeColors.inputBorder,
  } as React.CSSProperties;

  const latestResponse = [...messages].reverse().find(message => message.role === 'assistant');
  return (
    <SofliaChatProvider scope={`general:${avatarScope ?? user?.id ?? ''}`} conversationId={currentConversationId}
      active={isOpen} turn={avatarTurn} loading={isLoading} revealing={typewriterReveal.isTyping}
      speaking={isSpeaking || isAssistantLiveSpeaking} listening={isDictating || (isLiveVoiceActive && liveVoiceStatus === 'listening')}
      processing={isProcessingDictation || liveVoiceStatus === 'connecting' || liveVoiceStatus === 'processing' || liveVoiceStatus === 'preparing-audio'}
      error={Boolean(chatError || dictationError || deleteError || liveVoiceStatus === 'error')}
      permission={showDeleteConfirm} draft={inputValue} response={latestResponse}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            className={`lia-side-panel-shell ${styles.panel}`}
            data-tour-id="soflia-side-panel"
            data-theme={isLightTheme ? 'light' : 'dark'}
            initial={{ opacity: 0, x: 28, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.99 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={panelStyle}
          >
            <PanelHeader
              t={t}
              themeColors={themeColors}
              isLightTheme={isLightTheme}
              isSpeaking={isSpeaking}
              isVoiceEnabled={isVoiceEnabled}
              toggleVoiceEnabled={toggleVoiceEnabled}
              isVoiceTogglePending={isVoiceTogglePending}
              showHistory={showHistory && !isLiveVoiceActive}
              closeHistory={closeHistory}
              setShowHistory={setShowHistoryFromHeader}
              isOptionsMenuOpen={isOptionsMenuOpen && !isLiveVoiceActive}
              setIsOptionsMenuOpen={setOptionsMenuFromHeader}
              optionsMenuRef={optionsMenuRef}
              setIsPersonalizationOpen={setIsPersonalizationOpen}
              clearHistory={clearHistory}
              messages={messages}
              closePanel={closePanel}
              setIsAvatarExpanded={setIsAvatarExpanded}
              avatarExpanded={isAvatarExpanded}
            />

            {isLiveVoiceActive ? (
              <LiveVoiceStage
                themeColors={themeColors}
                isLightTheme={isLightTheme}
                isConnecting={liveVoiceStatus === 'connecting'}
                isAssistantSpeaking={isAssistantLiveSpeaking}
                status={liveVoiceStatus}
                onStop={stopLiveVoice}
              />
            ) : (
              <>
                <MessagesDisplay
                  messages={messages}
                  isLoading={isLoading}
                  typewriterReveal={typewriterReveal}
                  currentTip={currentTip}
                  themeColors={themeColors}
                  isLightTheme={isLightTheme}
                  isDarkMode={isDarkMode}
                  handleLinkClick={handleLinkClick}
                  quickActions={quickActions}
                  handleQuickAction={handleQuickAction}
                  messagesEndRef={messagesEndRef}
                  chatContainerRef={chatContainerRef}
                  handleChatScroll={handleChatScroll}
                />

                <InputArea
                  t={t}
                  themeColors={themeColors}
                  isLightTheme={isLightTheme}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  inputRef={inputRef}
                  isDictating={isDictating}
                  isDictationEnabled={isDictationEnabled}
                  isVoiceEnabled={isVoiceEnabled}
                  isLiveVoiceConnecting={liveVoiceStatus === 'connecting'}
                  isProcessingDictation={isProcessingDictation}
                  interimTranscript={interimTranscript}
                  finalTranscript={finalTranscript}
                  stopDictation={stopDictation}
                  toggleDictation={toggleDictation}
                  toggleLiveVoice={toggleLiveVoice}
                  handleSendMessage={handleSendMessage}
                  isResponding={isResponding}
                />
              </>
            )}

            {!isLiveVoiceActive && dictationError && (
              <div className={styles.inlineAlert} role="alert">
                <span>{dictationError}</span>
                <button
                  type="button"
                  aria-label="Cerrar aviso"
                  onClick={() => setDictationError(null)}
                  className={styles.alertClose}
                >
                  ×
                </button>
              </div>
            )}

            {/* History Overlay */}
            <AnimatePresence>
              {showHistory && !isLiveVoiceActive && (
                <HistoryOverlay
                  themeColors={themeColors}
                  isHistoryLoading={isHistoryLoading}
                  historyList={historyList}
                  closeHistory={closeHistory}
                  editingConversationId={editingConversationId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  deletingConversationId={deletingConversationId}
                  handleSelectConversation={handleSelectConversation}
                  handleStartEdit={handleStartEdit}
                  handleSaveEdit={handleSaveEdit}
                  handleCancelEdit={handleCancelEdit}
                  handleDeleteClick={handleDeleteClick}
                  currentPage={currentPage}
                  totalConversations={totalConversations}
                  hasMore={hasMore}
                  handleNextPage={handleNextPage}
                  handlePrevPage={handlePrevPage}
                />
              )}
            </AnimatePresence>

            {/* Delete Error */}
            {!isLiveVoiceActive && deleteError && (
              <div className={styles.inlineAlert} role="alert">
                <span>{deleteError}</span>
                <button
                  type="button"
                  aria-label="Cerrar aviso"
                  onClick={() => setDeleteError(null)}
                  className={styles.alertClose}
                >
                  ×
                </button>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
              {!isLiveVoiceActive && showDeleteConfirm && conversationToDelete && (
                <DeleteConversationModal
                  themeColors={themeColors}
                  conversationToDelete={conversationToDelete}
                  deletingConversationId={deletingConversationId}
                  handleCancelDelete={handleCancelDelete}
                  handleConfirmDelete={handleConfirmDelete}
                />
              )}
            </AnimatePresence>

            {/* Expanded Avatar Overlay */}
            <AnimatePresence>
              {isAvatarExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAvatarExpanded(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'zoom-out',
                    backdropFilter: 'blur(5px)',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ position: 'relative' }}
                  >
                    <SofliaChatAvatar size={320} />
                    <div style={{ marginTop: '20px', textAlign: 'center', color: 'white' }}>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>SofLIA</h3>
                      <p style={{ opacity: 0.8, margin: 0 }}>Learning Intelligence Assistant</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Personalización Modal */}
      {isPersonalizationOpen && (
        <SofLIAPersonalizationSettings
          isOpen={isPersonalizationOpen}
          onClose={() => setIsPersonalizationOpen(false)}
        />
      )}
    </SofliaChatProvider>
  );
}

export { LiaSidePanelContent };
