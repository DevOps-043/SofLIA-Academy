import { createAvatarPresence } from './avatar-presence';
import { responseExpression } from './avatar-reactions';
import type { AvatarExpression } from './avatar-model';

export interface ChatAvatarInput {
  scope: string;
  conversationId?: string | null;
  active?: boolean;
  turn?: number;
  loading?: boolean;
  revealing?: boolean;
  speaking?: boolean;
  listening?: boolean;
  processing?: boolean;
  draft?: string;
  error?: boolean;
  permission?: boolean;
  response?: { id: string; content: string };
  result?: { key: string; expression: AvatarExpression };
}

/** Sólo celebra turnos observados; cargar historial no equivale a responder. */
export function createChatAvatarActor() {
  const presence = createAvatarPresence();
  let previous: ChatAvatarInput | undefined;
  let inTurn = false;
  let before = '';
  let outcome: ChatAvatarInput['result'];
  return {
    ...presence,
    update(input: ChatAvatarInput) {
      const changedScope = previous && (input.scope !== previous.scope
        || Boolean(previous.conversationId && previous.conversationId !== input.conversationId));
      const activated = input.active !== false && previous?.active === false;
      if (!previous || changedScope || activated) {
        inTurn = Boolean(input.loading && input.turn && !changedScope);
        before = input.response?.content ?? ''; outcome = undefined;
      } else if (input.turn !== previous.turn && input.active !== false) {
        inTurn = true; before = previous.response?.content ?? ''; outcome = undefined;
      }
      const changedResponse = Boolean(input.response?.content.trim() && input.response.content !== before);
      if (inTurn && !input.loading && !input.revealing && !input.speaking) {
        if (input.error) outcome = { key: `turn:${input.turn}`, expression: 'concerned' };
        else if (changedResponse) outcome = { key: `turn:${input.turn}`, expression: responseExpression(input.response!.content) };
        inTurn = false;
      }
      if (input.active === false) { inTurn = false; outcome = undefined; }
      const mode: AvatarExpression = input.listening ? 'listening'
        : input.speaking || input.revealing || (input.loading && inTurn && changedResponse) ? 'speaking'
          : input.loading || input.processing ? 'thinking' : 'idle';
      presence.update({
        scope: JSON.stringify([input.scope, input.conversationId, input.active !== false]),
        mode, busy: Boolean(input.loading || input.speaking || input.listening || input.revealing || input.processing),
        draft: input.draft, permission: input.permission, error: input.error,
        activityKey: String(input.turn ?? 0), outcome: input.result ?? outcome,
      });
      previous = input;
    },
  };
}
