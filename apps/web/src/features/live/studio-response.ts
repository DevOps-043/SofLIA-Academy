import type { z } from 'zod';
import type { studioResponseSchema } from './live-studio.contract';

/** La ampliación se confirma explícitamente; los clientes strict antiguos conservan su forma. */
export function projectStudioResponse(response: z.infer<typeof studioResponseSchema>, participation: boolean) {
  if (!response.snapshot) return response;
  if (participation) return { ...response, snapshot: { ...response.snapshot, participation_version: 1 as const } };
  const { reaction_events, participation: ledger, moderation, ...state } = response.snapshot.state;
  const { message_interval_seconds, ...legacyModeration } = moderation;
  const { participation_version, ...snapshot } = response.snapshot;
  void reaction_events; void ledger; void message_interval_seconds; void participation_version;
  return { ...response, snapshot: { ...snapshot, state: { ...state, moderation: legacyModeration } } };
}
