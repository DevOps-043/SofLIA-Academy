'use client';

import { SofliaChatProvider } from '@/core/components/SofliaAvatar/SofliaChatProvider';

import { ChatSuggestionsChips } from './chat-suggestions';
import { CourseLiaHeader } from './components/CourseLiaHeader';
import { CourseLiaInput } from './components/CourseLiaInput';
import { CourseLiaMessages } from './components/CourseLiaMessages';
import { CourseLiaPanelShell } from './components/CourseLiaPanelShell';
import { CourseLiaStyleTag } from './components/CourseLiaStyleTag';
import { useCourseLiaController } from './hooks/useCourseLiaController';
import type { CourseLiaProps } from './types';

export function CourseLiaPanelContent(props: CourseLiaProps) {
  const controller = useCourseLiaController(props);
  const isPanelOpen = controller.isOpen && (!controller.isInteractionBlocked || controller.currentActivity !== null);

  const latestResponse = [...controller.messages].reverse().find(message => message.role === 'assistant');
  return (
    <SofliaChatProvider scope={`course:${controller.avatarScope ?? ''}:${props.lessonId ?? ''}`} conversationId={controller.liaChat.currentConversationId}
      active={isPanelOpen} turn={controller.avatarTurn} loading={controller.isLoading}
      speaking={controller.isSpeaking} listening={controller.isListening}
      error={Boolean(controller.chatError || controller.voiceError)} draft={controller.inputValue} response={latestResponse}>
    <CourseLiaPanelShell
      isMobile={controller.isMobile}
      isOpen={isPanelOpen}
      panelRef={controller.panelRef}
      themeColors={controller.themeColors}
    >
      <CourseLiaHeader
        isSpeaking={controller.isSpeaking}
        isVoiceEnabled={controller.isVoiceEnabled}
        isVoiceTogglePending={controller.isVoiceTogglePending}
        onClearHistory={controller.clearHistory}
        onClose={controller.closeLia}
        onToggleVoice={controller.toggleVoiceEnabled}
        isMobile={controller.isMobile}
      />
      <CourseLiaMessages
        copiedMessageId={controller.copiedMessageId}
        editInputRef={controller.editInputRef}
        editingMessageId={controller.editingMessageId}
        editingValue={controller.editingValue}
        isDarkMode={controller.isDarkMode}
        isLoading={controller.isLoading}
        lessonTitle={props.lessonTitle}
        messages={controller.messages}
        messagesEndRef={controller.messagesEndRef}
        onCancelEditing={controller.handleCancelEditingMessage}
        onCopyMessage={controller.handleCopyMessage}
        onEditKeyDown={controller.handleEditKeyDown}
        onLinkClick={controller.handleLinkClick}
        onSaveNote={controller.onSaveNote}
        onStartEditing={controller.handleStartEditingMessage}
        onSubmitEditedMessage={controller.handleSubmitEditedMessage}
        setEditingValue={controller.setEditingValue}
        stop={controller.stop}
        themeColors={controller.themeColors}
      />
      <ChatSuggestionsChips
        suggestions={controller.lessonSuggestions}
        isLoading={controller.isLoadingSuggestions}
        onSuggestionClick={controller.handleSuggestionClick}
        forceCollapse={controller.currentActivity?.timestamp || false}
      />
      <CourseLiaInput
        inputRef={controller.inputRef}
        inputValue={controller.inputValue}
        isInteractionBlocked={controller.isInteractionBlocked && controller.currentActivity === null}
        isLightTheme={controller.isLightTheme}
        isListening={controller.isListening}
        isMobile={controller.isMobile}
        onInputChange={controller.setInputValue}
        onKeyDown={controller.handleKeyDown}
        onPrimaryAction={controller.handlePrimaryAction}
        primaryActionLabel={controller.primaryActionLabel}
        primaryActionMode={controller.primaryActionMode}
        setVoiceError={controller.setVoiceError}
        themeColors={controller.themeColors}
        voiceError={controller.voiceError}
      />
      <CourseLiaStyleTag
        forceDarkText={controller.forceDarkText}
        isLightTheme={controller.isLightTheme}
        themeColors={controller.themeColors}
      />
    </CourseLiaPanelShell>
    </SofliaChatProvider>
  );
}
