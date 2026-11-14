'use client';


import React from 'react';
import { motion } from 'framer-motion';
import { AudioLines, MicOff } from 'lucide-react';
import type { LiaThemeColors } from './types';

interface LiveVoiceStageProps {
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
  isConnecting: boolean;
  isAssistantSpeaking: boolean;
  status?:
    | 'idle'
    | 'connecting'
    | 'listening'
    | 'processing'
    | 'preparing-audio'
    | 'speaking'
    | 'error';
  onStop: () => void;
}

const RING_SIZES = [164, 238];

export function LiveVoiceStage({
  themeColors,
  isLightTheme,
  isConnecting,
  isAssistantSpeaking,
  status = 'listening',
  onStop,
}: LiveVoiceStageProps) {
  const ringDuration = isAssistantSpeaking ? 1.8 : 3.2;
  const ringOpacity = isAssistantSpeaking ? [0.12, 0.34, 0.12] : [0.05, 0.16, 0.05];
  const ringScale = isAssistantSpeaking ? [0.9, 1.18, 0.9] : [0.96, 1.05, 0.96];
  const statusLabel = isConnecting || status === 'connecting'
    ? 'Preparando micrófono…'
    : status === 'processing'
    ? 'SofLIA está pensando…'
    : status === 'preparing-audio'
    ? 'Preparando la voz de SofLIA…'
    : isAssistantSpeaking || status === 'speaking'
    ? 'SofLIA está hablando…'
    : 'Te escucho…';

  return (
    <section
      aria-label={isConnecting ? 'Conectando conversación por voz con SofLIA' : 'Conversación por voz con SofLIA activa'}
      data-testid="lia-live-voice-stage"
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '32px 24px calc(32px + env(safe-area-inset-bottom, 0px))',
        background: `radial-gradient(circle at center, color-mix(in srgb, ${themeColors.accentColor} 16%, transparent) 0%, transparent 48%)`,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          width: 'min(68vw, 260px)',
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {RING_SIZES.map((size, index) => (
          <motion.div
            key={size}
            animate={{
              opacity: ringOpacity,
              scale: ringScale,
            }}
            transition={{
              duration: ringDuration + index * 0.35,
              repeat: Infinity,
              delay: index * 0.18,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              width: `${size}px`,
              height: `${size}px`,
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: '50%',
              border: `1px solid ${themeColors.accentColor}`,
              boxShadow: `0 0 ${isAssistantSpeaking ? 36 : 18}px color-mix(in srgb, ${themeColors.accentColor} 36%, transparent)`,
            }}
          />
        ))}

        <AudioLines size={48} color={themeColors.accentColor} aria-hidden="true" />
      </div>

      <p
        aria-live="polite"
        style={{
          margin: '20px 0 0',
          color: themeColors.textPrimary,
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        {statusLabel}
      </p>

      <button
        type="button"
        onClick={onStop}
        aria-label="Detener conversación por voz"
        title="Detener conversación por voz"
        style={{
          position: 'absolute',
          bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: `1px solid ${themeColors.inputBorder}`,
          backgroundColor: isLightTheme ? 'var(--color-bg-light)' : themeColors.inputBg,
          color: themeColors.textPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isLightTheme
            ? '0 12px 24px color-mix(in srgb, var(--color-gray-900) 12%, transparent)'
            : '0 12px 24px color-mix(in srgb, var(--color-bg-dark) 28%, transparent)',
        }}
      >
        <MicOff aria-hidden="true" style={{ width: '20px', height: '20px' }} />
      </button>
    </section>
  );
}
