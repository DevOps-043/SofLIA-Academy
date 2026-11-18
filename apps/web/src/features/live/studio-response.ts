import type { z } from 'zod';
import type { studioResponseSchema } from './live-studio.contract';

/** Cada ampliación se negocia y el contenido reservado se entrega solo al instructor. */
export function projectStudioResponse(
  response: z.infer<typeof studioResponseSchema>,
  participation: boolean,
  preparation = false,
  documents = false,
) {
  if (!response.snapshot) return response;
  const { engine_preparation, engine_payload_hash, ...publicState } = response.snapshot.state;
  const { published_documents, ...snapshotFields } = response.snapshot;
  void engine_payload_hash;
  let visiblePreparation = engine_preparation;
  if (engine_preparation && !documents) {
    const { documents: reservedDocuments, ...legacyPreparation } = engine_preparation;
    void reservedDocuments;
    visiblePreparation = legacyPreparation;
  }
  const visible = {
    ...snapshotFields,
    ...(documents ? { published_documents: published_documents || [] } : {}),
    state: {
      ...publicState,
      ...(preparation && response.snapshot.can_manage && visiblePreparation ? { engine_preparation: visiblePreparation } : {}),
    },
  };
  if (participation) return { ...response, snapshot: { ...visible, participation_version: 1 as const } };
  const { reaction_events, participation: ledger, moderation, ...state } = visible.state;
  const { message_interval_seconds, ...legacyModeration } = moderation;
  const { participation_version, ...snapshot } = visible;
  void reaction_events; void ledger; void message_interval_seconds; void participation_version;
  return { ...response, snapshot: { ...snapshot, state: { ...state, moderation: legacyModeration } } };
}
