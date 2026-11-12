import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { LiveVoiceStage } from '../LiveVoiceStage';
import type { LiaThemeColors } from '../types';

const themeColors: LiaThemeColors = {
  panelBg: 'var(--color-bg-light)',
  headerBg: 'var(--color-bg-light)',
  borderColor: 'var(--color-gray-200)',
  messageBubbleAssistant: 'var(--color-gray-100)',
  messageBubbleUser: 'var(--color-primary)',
  textPrimary: 'var(--color-gray-900)',
  textSecondary: 'var(--color-gray-500)',
  inputBg: 'var(--color-gray-50)',
  inputBorder: 'var(--color-gray-200)',
  accentColor: 'var(--color-accent)',
};

describe('LiveVoiceStage', () => {
  it('renders the voice-only stage without chat input text', () => {
    const html = renderToStaticMarkup(
      <LiveVoiceStage
        themeColors={themeColors}
        isLightTheme
        isConnecting={false}
        isAssistantSpeaking
        onStop={vi.fn()}
      />,
    );

    expect(html).toContain('data-testid="lia-live-voice-stage"');
    expect(html).toContain('class="soflia-avatar');
    expect(html).not.toContain('/lia-avatar.webp');
    expect(html).toContain('aria-label="Detener conversación por voz"');
    expect(html).not.toContain('Escribe un mensaje');
  });

  it('does not claim SofLIA is speaking while ElevenLabs is still preparing audio', () => {
    const html = renderToStaticMarkup(
      <LiveVoiceStage
        themeColors={themeColors}
        isLightTheme
        isConnecting={false}
        isAssistantSpeaking={false}
        status="preparing-audio"
        onStop={vi.fn()}
      />,
    );

    expect(html).toContain('Preparando la voz de SofLIA…');
    expect(html).not.toContain('SofLIA está hablando…');
  });
});
