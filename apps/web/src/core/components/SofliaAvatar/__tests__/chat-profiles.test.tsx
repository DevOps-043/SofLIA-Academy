import { cleanup, render, waitFor } from '@testing-library/react';
import { cloneElement, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SofliaChatAvatar, SofliaChatProvider } from '../SofliaChatProvider';
import { PanelHeader } from '../../LiaSidePanel/PanelHeader';
import { LiveVoiceStage } from '../../LiaSidePanel/LiveVoiceStage';
import type { LiaThemeColors } from '../../LiaSidePanel/types';
import { CourseLiaHeader } from '@/features/courses/components/CourseLia/components/CourseLiaHeader';
import { DialogueHeader } from '@/features/courses/components/learn/activities/soflia-dialogue/DialogueHeader';
import { DialogueMessagesList } from '@/features/courses/components/learn/activities/soflia-dialogue/DialogueMessagesList';
import { QuizFeedbackInline } from '@/features/courses/components/learn/quiz-feedback/QuizFeedbackInline';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../useAvatarPlaybackAudio', () => ({ useAvatarPlaybackAudio: () => ({ available: false }) }));
afterEach(cleanup);
const noop = () => {};
const theme = { accentColor: 'var(--color-accent)', textPrimary: 'var(--color-primary)' } as LiaThemeColors;
const general = <PanelHeader t={key => key} themeColors={theme} isLightTheme={false} isSpeaking={false} isVoiceEnabled={false}
  toggleVoiceEnabled={noop} isVoiceTogglePending={false} showHistory={false} closeHistory={noop} setShowHistory={noop}
  isOptionsMenuOpen={false} setIsOptionsMenuOpen={noop} optionsMenuRef={createRef<HTMLDivElement>()}
  setIsPersonalizationOpen={noop} clearHistory={noop} messages={[]} closePanel={noop} setIsAvatarExpanded={noop} />;
const course = <CourseLiaHeader isSpeaking={false} isVoiceEnabled={false} isVoiceTogglePending={false}
  onClearHistory={noop} onClose={noop} onToggleVoice={noop} />;
const dialogue = <DialogueHeader canPracticeAgain={false} canRetry={false} criteriaProgress={0} scoreValue={0}
  session={null} stateLabel="En espera" totalCriteria={0} />;

describe('perfil superior único de Academy', () => {
  it.each([['general', general], ['curso', course], ['actividad', dialogue]] as const)('muestra las reacciones reales en la cabecera del chat %s', async (_, header) => {
    const view = render(<SofliaChatProvider scope="prueba" draft="No entiendo??">{header}</SofliaChatProvider>);
    await waitFor(() => expect(document.querySelector('header .soflia-avatar')).toHaveAttribute('data-expression', 'confused'));
    expect(document.querySelectorAll('.soflia-avatar')).toHaveLength(1);
    view.rerender(<SofliaChatProvider scope="prueba" listening>{header}</SofliaChatProvider>);
    await waitFor(() => expect(document.querySelector('header .soflia-avatar')).toHaveAttribute('data-expression', 'listening'));
    view.rerender(<SofliaChatProvider scope="prueba" error>{header}</SofliaChatProvider>);
    await waitFor(() => expect(document.querySelector('header .soflia-avatar')).toHaveAttribute('data-expression', 'concerned'));
    expect(document.querySelectorAll('.soflia-avatar')).toHaveLength(1);
  });
  it('conserva un único personaje al entrar en conversación por voz', async () => {
    render(<SofliaChatProvider scope="voz" speaking>{general}<LiveVoiceStage themeColors={theme}
      isLightTheme={false} isConnecting={false} isAssistantSpeaking onStop={noop} /></SofliaChatProvider>);
    await waitFor(() => expect(document.querySelector('header .soflia-avatar')).toHaveAttribute('data-expression', 'speaking'));
    expect(document.querySelectorAll('.soflia-avatar')).toHaveLength(1);
    expect(document.querySelector('[data-testid="lia-live-voice-stage"] .soflia-avatar')).toBeNull();
  });
  it('el diálogo vacío o enviando conserva las expresiones sólo en la cabecera', () => {
    const body = (sending: boolean) => <SofliaChatProvider scope="actividad">{dialogue}
      <DialogueMessagesList messagesEndRef={createRef<HTMLDivElement>()} sending={sending} session={null}
        userDisplayName="Estudiante" userInitials="E" /></SofliaChatProvider>;
    const view = render(body(false));
    expect(document.querySelectorAll('.soflia-avatar')).toHaveLength(1);
    view.rerender(body(true));
    expect(document.querySelectorAll('.soflia-avatar')).toHaveLength(1);
    expect(document.querySelectorAll('header .soflia-avatar')).toHaveLength(1);
  });
  it('al ampliar el avatar oculta el perfil original para no duplicarlo', () => {
    render(<SofliaChatProvider scope="ampliado">{cloneElement(general, { avatarExpanded: true })}
      <SofliaChatAvatar size={320} /></SofliaChatProvider>);
    expect(document.querySelectorAll('header .soflia-avatar')).toHaveLength(0);
    expect(document.querySelectorAll('.soflia-avatar')).toHaveLength(1);
  });
  it('la retroalimentación del quiz conserva el estado en su perfil ampliado', () => {
    const view = render(<QuizFeedbackInline content={null} error={null} isLoading isOpen onClose={noop} />);
    expect(document.querySelector('header .soflia-avatar')).toHaveAttribute('data-expression', 'thinking');
    view.rerender(<QuizFeedbackInline content={null} error="No disponible" isLoading={false} isOpen onClose={noop} />);
    expect(document.querySelector('header .soflia-avatar')).toHaveAttribute('data-expression', 'concerned');
    expect(document.querySelectorAll('.soflia-avatar')).toHaveLength(1);
  });
});
