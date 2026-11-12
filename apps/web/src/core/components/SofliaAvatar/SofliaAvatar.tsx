'use client';

import { forwardRef, useImperativeHandle, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { canTrackGaze, normalizeGaze, resolveExpression, unit, type AvatarExpression, type AvatarState, type GazeConfig } from './avatar-model';
import { AvatarFace } from './AvatarFace';
import { useAvatarMotion } from './useAvatarMotion';
import type { AvatarVoiceRefs } from './avatar-voice';
import './avatar.css';

const body = '/assets/soflia-avatar/body.webp';
const light = '/assets/soflia-avatar/light.webp';

export interface SofliaAvatarHandle {
  setState(state: AvatarState): void;
  setExpression(expression: AvatarExpression): void;
  setAudioLevel(level: number): void;
  setGazeTarget(x: number, y: number): void;
  blink(): void;
  nod(): void;
  reset(): void;
}
export interface SofliaAvatarProps {
  state?: AvatarState;
  expression?: AvatarExpression;
  audioLevel?: RefObject<number>;
  audioFeatures?: AvatarVoiceRefs;
  motionEnabled?: boolean;
  /** Gesto de conversación durante streaming escrito; no representa audio. */
  textActivity?: boolean;
  gaze?: Partial<GazeConfig>;
  className?: string;
}

export const SofliaAvatar = forwardRef<SofliaAvatarHandle, SofliaAvatarProps>(function SofliaAvatar({
  state = 'idle', expression, audioLevel, audioFeatures, motionEnabled = true, textActivity = false, gaze, className = '',
}, ref) {
  const { t } = useTranslation('common');
  // Un cambio declarativo de estado invalida cualquier acción imperativa anterior.
  const [override, setOverride] = useState<{ source: AvatarState; state?: AvatarState; expression?: AvatarExpression }>({ source: state });
  if (override.source !== state) setOverride({ source: state });
  const current = override.source === state ? override : undefined;
  const resolved = resolveExpression(current?.state ?? state, current?.expression ?? expression);
  const { root, signals } = useAvatarMotion(resolved, audioLevel, motionEnabled, gaze, audioFeatures, textActivity);
  useImperativeHandle(ref, () => ({
    setState: next => setOverride({ source: state, state: next }),
    setExpression: next => setOverride(previous => ({ ...(previous.source === state ? previous : { source: state }), expression: next })),
    setAudioLevel: level => { signals.current.audio = unit(level); },
    setGazeTarget: (x, y) => { signals.current.gaze = normalizeGaze(x, y); },
    blink: () => { if (canTrackGaze(resolved)) signals.current.blinkAt = performance.now(); },
    nod: () => { if (canTrackGaze(resolved)) signals.current.nodAt = performance.now(); },
    reset: () => {
      signals.current = { gaze: { x: 0, y: 0 }, audio: null, blinkAt: null, nodAt: null, resetToken: signals.current.resetToken + 1 };
      setOverride({ source: state });
    },
  }), [state, resolved, signals]);
  return <div ref={root} className={`soflia-avatar ${className}`} data-expression={resolved} data-running="false"
    role="img" aria-label={`${t('sofliaAvatar.label')}: ${t(`sofliaAvatar.expressions.${resolved}`)}`}>
    <div className="soflia-avatar__shadow" aria-hidden="true" />
    <div className="soflia-avatar__rig" aria-hidden="true">
      <img className="soflia-avatar__layer" src={body} alt="" draggable={false} decoding="async" />
      <div className="soflia-avatar__expression">
        <div className="soflia-avatar__gaze">
          <AvatarFace key={resolved} expression={resolved} />
        </div>
      </div>
      <img className="soflia-avatar__layer soflia-avatar__light" src={light} alt="" draggable={false} decoding="async" />
    </div>
    {resolved === 'sleeping' && <div className="soflia-avatar__sleep-cues" aria-hidden="true"><span>Z</span><span>z</span><span>z</span></div>}
  </div>;
});
