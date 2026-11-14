'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SofliaAvatar } from './SofliaAvatar';
import { createChatAvatarActor, type ChatAvatarInput } from './chat-avatar-model';
import type { AvatarExpression } from './avatar-model';
import styles from './SofliaAvatarSlot.module.css';
import { useAvatarPlaybackAudio } from './useAvatarPlaybackAudio';
import type { AvatarVoiceRefs } from './avatar-voice';
import type { RefObject } from 'react';

const WelcomeContext = createContext(false);
const ChatAvatarContext = createContext<AvatarExpression>('idle');
const ChatAudioContext = createContext<{ level: RefObject<number>; features: AvatarVoiceRefs } | undefined>(undefined);

export function SofliaChatProvider({ children, ...input }: ChatAvatarInput & { children: ReactNode }) {
  const audio = useAvatarPlaybackAudio(input.active !== false && input.speaking === true);
  const [actor] = useState(createChatAvatarActor);
  const welcomeKey = JSON.stringify([input.scope, input.conversationId]);
  const engaged = Boolean(input.draft?.length || input.loading || input.speaking || input.listening || input.processing || input.error || input.permission || input.response);
  const [welcome, setWelcome] = useState({ key: welcomeKey, used: engaged });
  const used = welcome.key === welcomeKey ? welcome.used || engaged : engaged;
  if (welcome.key !== welcomeKey || welcome.used !== used) setWelcome({ key: welcomeKey, used });
  const expression = useSyncExternalStore(actor.subscribe, actor.getSnapshot, actor.getSnapshot);
  const { scope, conversationId, active, turn, loading, revealing, speaking, listening, processing, draft, error, permission } = input;
  const responseId = input.response?.id; const responseContent = input.response?.content;
  const resultKey = input.result?.key; const resultExpression = input.result?.expression;
  useEffect(() => {
    actor.update({ scope, conversationId, active, turn, loading, revealing, speaking, listening, processing, draft, error, permission,
      response: responseId !== undefined ? { id: responseId, content: responseContent ?? '' } : undefined,
      result: resultKey && resultExpression ? { key: resultKey, expression: resultExpression } : undefined });
  }, [actor, scope, conversationId, active, turn, loading, revealing, speaking, listening, processing, draft, error, permission, responseId, responseContent, resultKey, resultExpression]);
  return <WelcomeContext.Provider value={!used}><ChatAudioContext.Provider value={audio.available ? { level: audio.level, features: audio.features } : undefined}><ChatAvatarContext.Provider value={expression}>{children}</ChatAvatarContext.Provider></ChatAudioContext.Provider></WelcomeContext.Provider>;
}

export function SofliaChatAvatar({ size = 168, className = '', expression: override }: { size?: number; className?: string; expression?: AvatarExpression }) {
  const current = useContext(ChatAvatarContext);
  const expression = override ?? current;
  const audio = useContext(ChatAudioContext);
  return <div className={`${styles.slot} ${className}`} style={{ width: size, height: size }}>
    <SofliaAvatar state={expression} audioLevel={audio?.level} audioFeatures={audio?.features} textActivity={expression === 'speaking' && !audio} />
  </div>;
}

/** Una presencia reactiva en la cabecera, compartida por todas las superficies. */
export function SofliaChatProfile({ expression }: { expression?: AvatarExpression }) {
  return <SofliaChatAvatar size={88} className={styles.profile} expression={expression} />;
}

export function SofliaAvatarBadge({ size = 40, className = '' }: { size?: number; className?: string }) {
  const { t } = useTranslation('common');
  return <img src="/assets/soflia-avatar/badge-idle.webp" width={size} height={size} className={`${styles.badge} ${className}`} alt={t('sofliaAvatar.label')} decoding="async" />;
}

/** Bienvenida inicial: desaparece al primer borrador y no vuelve al borrarlo. */
export function SofliaChatWelcome({ hidden = false }: { hidden?: boolean }) {
  const available = useContext(WelcomeContext);
  if (!available || hidden) return null;
  return <div className={styles.welcome} data-soflia-welcome="true"><SofliaChatAvatar size={260} /></div>;
}
