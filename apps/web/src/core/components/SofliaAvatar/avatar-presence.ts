import type { AvatarExpression } from './avatar-model';
import { draftExpression } from './avatar-reactions';

export interface PresenceInput {
  scope?: string;
  activation?: number;
  mode?: AvatarExpression;
  draft?: string;
  permission?: boolean;
  error?: boolean;
  busy?: boolean;
  activityKey?: string;
  outcome?: { key: string; expression: AvatarExpression };
}

/** Reloj de presencia por superficie; sus cambios son eventos, no fotogramas. */
export function createAvatarPresence() {
  let input: PresenceInput = {};
  let activated = Date.now(); let touched = activated; let workSince = 0;
  let outcomeUntil = 0; let outcomeExpression: AvatarExpression = 'idle';
  let snapshot: AvatarExpression = 'happy';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const resolve = (now: number): AvatarExpression => {
    if (input.permission) return 'warning';
    if (input.error || input.mode === 'concerned') return 'concerned';
    if (input.mode === 'focused') return 'focused';
    if (input.mode === 'thinking') return workSince && now - workSince >= 6000 ? 'focused' : 'thinking';
    if (input.mode === 'speaking') return 'speaking';
    if (outcomeUntil > now) return outcomeExpression;
    if (input.draft?.trim()) return draftExpression(input.draft);
    if (now - activated < 900) return 'happy';
    if (now - activated < 1200) return 'idle';
    if (!input.busy && now - touched >= 20_000) return 'sleeping';
    return input.mode ?? 'idle';
  };
  const refresh = () => {
    if (timer) clearTimeout(timer);
    const now = Date.now(); const next = resolve(now);
    if (next !== snapshot) { snapshot = next; listeners.forEach(listener => listener()); }
    if (!listeners.size) return;
    const deadlines = [activated + 900, activated + 1200, outcomeUntil, touched + 20_000, workSince ? workSince + 6000 : 0].filter(deadline => deadline > now);
    if (deadlines.length) timer = setTimeout(refresh, Math.max(1, Math.min(...deadlines) - now));
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); refresh(); return () => { listeners.delete(listener); if (!listeners.size && timer) clearTimeout(timer); }; },
    touch: () => { touched = Date.now(); outcomeUntil = 0; refresh(); },
    update: (next: PresenceInput) => {
      const now = Date.now();
      if (next.scope !== input.scope || next.activation !== input.activation) { activated = now; touched = now; outcomeUntil = 0; }
      // Terminar la captura por silencio no es una nueva interacción del usuario.
      const silenceEnded = input.mode === 'listening' && next.mode === 'idle' && !input.busy && !next.busy;
      if (next.draft !== input.draft || (next.mode !== input.mode && !silenceEnded) || next.activityKey !== input.activityKey) touched = now;
      if (next.mode === 'thinking' && input.mode !== 'thinking') workSince = now;
      else if (next.mode !== 'thinking') workSince = 0;
      if (next.outcome && next.outcome.key !== input.outcome?.key) { outcomeExpression = next.outcome.expression; outcomeUntil = now + 2400; touched = now; }
      if (next.mode === 'thinking' || next.mode === 'focused') outcomeUntil = 0;
      input = next; refresh();
    },
  };
}
