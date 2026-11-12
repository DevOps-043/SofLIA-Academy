import { useEffect, useState, useSyncExternalStore } from 'react';
import { createAvatarPresence, type PresenceInput } from './avatar-presence';

export function useAvatarPresence(input: PresenceInput) {
  const [presence] = useState(createAvatarPresence);
  const { scope, activation, mode, draft, permission, error, busy, activityKey, outcome } = input;
  const outcomeKey = outcome?.key; const outcomeExpression = outcome?.expression;
  const expression = useSyncExternalStore(presence.subscribe, presence.getSnapshot, presence.getSnapshot);
  useEffect(() => {
    presence.update({ scope, activation, mode, draft, permission, error, busy, activityKey, outcome: outcomeKey && outcomeExpression ? { key: outcomeKey, expression: outcomeExpression } : undefined });
  }, [presence, scope, activation, mode, draft, permission, error, busy, activityKey, outcomeKey, outcomeExpression]);
  return { expression, touch: presence.touch };
}
