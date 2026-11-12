import { useMemo } from 'react';

import { useActivityWelcomeMessage } from './useActivityWelcomeMessage';
import { useCourseLiaBase } from './useCourseLiaBase';
import { useCourseLiaNavigationAction } from './useCourseLiaNavigationAction';
import { useCourseLiaPanelEffects } from './useCourseLiaPanelEffects';
import { useCourseLiaRegistration } from './useCourseLiaRegistration';
import { useCourseLiaSpeechInput } from './useCourseLiaSpeechInput';
import { useCourseLiaSuggestions } from './useCourseLiaSuggestions';
import { useCourseLiaVoice } from './useCourseLiaVoice';
import { useMessageCopyAction } from './useMessageCopyAction';
import { useMessageEditActions } from './useMessageEditActions';
import { useMessageSendActions } from './useMessageSendActions';
import { useSuggestionClickAction } from './useSuggestionClickAction';
import { useTextareaAutosize } from './useTextareaAutosize';
import type { CourseLiaProps, PrimaryActionMode } from '../types';

export function useCourseLiaController(props: CourseLiaProps) {
  const base = useCourseLiaBase(props);
  const { messages, isLoading, sendMessage, editMessageAndRegenerate, stop, clearHistory } = base.liaChat;
  // Voz de salida (TTS en streaming): envía SIEMPRE a través de los wrappers
  // `*WithVoice` para que toda respuesta presenciada pueda locutarse.
  const voice = useCourseLiaVoice({
    messages,
    isLoading,
    isOpen: base.isOpen,
    sendMessage,
    editMessageAndRegenerate,
    stop,
  });
  const speech = useCourseLiaSpeechInput({
    inputRef: base.inputRef,
    isLoading,
    language: base.language,
    setInputValue: base.setInputValue,
    t: base.t,
  });
  const suggestions = useCourseLiaSuggestions({
    currentActivity: base.currentActivity,
    isOpen: base.isOpen,
    resolvedLessonContext: base.resolvedLessonContext,
  });

  // El chat registrado en el contexto del curso (triggers externos: actividades,
  // acciones de la lección) también debe armar la voz al enviar; de lo contrario
  // esas respuestas no se locutarían.
  const liaChatWithVoice = useMemo(
    () => ({
      ...base.liaChat,
      sendMessage: voice.sendMessageWithVoice,
      editMessageAndRegenerate: voice.editMessageAndRegenerateWithVoice,
      stop: voice.stopWithVoice,
    }),
    [base.liaChat, voice.sendMessageWithVoice, voice.editMessageAndRegenerateWithVoice, voice.stopWithVoice],
  );

  useTextareaAutosize(base);
  useCourseLiaRegistration({ ...base, liaChat: liaChatWithVoice });
  useCourseLiaPanelEffects({ ...base, messages, stop: voice.stopWithVoice });
  useActivityWelcomeMessage({
    clearHistory,
    currentActivity: base.currentActivity,
    isOpen: base.isOpen,
    prevActivityTriggerRef: base.prevActivityTriggerRef,
    resolvedLessonContext: base.resolvedLessonContext,
    sendMessage: voice.sendMessageWithVoice,
  });

  const handleLinkClick = useCourseLiaNavigationAction(base.router);
  const handleSuggestionClick = useSuggestionClickAction({
    isLoading,
    markSuggestionUsed: suggestions.markUsed,
    resolvedLessonContext: base.resolvedLessonContext,
    sendMessage: voice.sendMessageWithVoice,
  });
  const handleCopyMessage = useMessageCopyAction(base);
  const editActions = useMessageEditActions({
    ...base,
    editMessageAndRegenerate: voice.editMessageAndRegenerateWithVoice,
    isLoading,
  });
  const sendActions = useMessageSendActions({
    ...base,
    isListening: speech.isListening,
    isLoading,
    liaChat: base.liaChat,
    sendMessage: voice.sendMessageWithVoice,
    stop: voice.stopWithVoice,
    toggleListening: speech.toggleListening,
  });
  const hasInputText = Boolean(base.inputValue.trim());
  const primaryActionMode: PrimaryActionMode = isLoading ? 'stop' : hasInputText ? 'send' : 'voice';
  const primaryActionLabel = isLoading
    ? base.t('lia.stopGeneration')
    : hasInputText
      ? base.t('lia.send')
      : speech.isListening
        ? base.t('lia.voice.stopDictation')
        : base.t('lia.voice.startDictation');

  return {
    ...base,
    avatarTurn: base.liaChat.avatarTurn,
    avatarScope: base.liaChat.avatarScope,
    chatError: base.liaChat.error,
    ...speech,
    ...editActions,
    ...sendActions,
    clearHistory,
    handleCopyMessage,
    handleLinkClick,
    handleSuggestionClick,
    isLoading,
    isLoadingSuggestions: suggestions.isLoading,
    isSpeaking: voice.isSpeaking,
    isVoiceEnabled: voice.isVoiceEnabled,
    isVoiceTogglePending: voice.isVoiceTogglePending,
    lessonSuggestions: suggestions.suggestions,
    messages,
    primaryActionLabel,
    primaryActionMode,
    stop: voice.stopWithVoice,
    toggleVoiceEnabled: voice.toggleVoiceEnabled,
  };
}
