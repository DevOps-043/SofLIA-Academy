import { engineSessionManifestSchema } from './engine-preparation.contract';
export { engineSessionManifestSchema } from './engine-preparation.contract';
import { z } from 'zod';
import { recordingOperationSchema,recordingResponseSchema,recordingSnapshotSchema } from './recordings/contract';

const id = z.string().uuid();
const text = (max: number) => z.string().trim().min(1).max(max);
export const studioReferenceSchema = z.object({ organization_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), session_id: id }).strict();
export const studioSceneSchema = z.object({ id, name: text(60), kind: z.enum(['slide', 'screen', 'image', 'video']), title: text(160), description: z.string().max(500), asset_path: z.string().max(500).optional() }).strict();
export const studioMaterialSchema = z.object({ id, name: text(160), kind: z.enum(['file', 'reading', 'quiz']), asset_path: text(500), mime: text(100), bytes: z.number().int().min(1).max(25 * 1024 * 1024) }).strict();
const quizBase = z.object({ id, question: text(300), options: z.array(text(120)).min(2).max(6).refine((items) => new Set(items).size === items.length), correct: z.number().int().min(0).max(5) }).strict();
export const studioQuizSchema = quizBase.refine((quiz) => quiz.correct < quiz.options.length);
const practice = z.object({ id, title: text(160), instructions: text(2000) }).strict();
export const studioClockSchema = z.object({ mode: z.enum(['timer', 'stopwatch']), seconds: z.number().int().min(0).max(86400), running: z.boolean(), updated_at: z.string().datetime() }).strict();
export const studioReactionSchema=z.enum(['👏','👍','💡','❤️','🎉','😂']);
export const studioCommandSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('reaction'),emoji:studioReactionSchema,room_id:id.nullable()}).strict(),
  z.object({type:z.literal('chat_interval'),seconds:z.number().int().min(0).max(300)}).strict(),
  z.object({ type: z.literal('post'), content: text(2000), question: z.boolean(), room_id: id.nullable() }).strict(),
  z.object({ type: z.literal('moderation'), locked: z.boolean(), reactions: z.boolean() }).strict(),
  z.object({ type: z.literal('restrict'), user_id: id, restriction: z.enum(['none', 'chat', 'blocked']) }).strict(),
  z.object({ type: z.literal('presence'), room_id: id.nullable(), leave: z.boolean().optional() }).strict(),
  z.object({ type: z.literal('rooms'), mode: z.enum(['size', 'count']), value: z.number().int().min(1).max(50) }).strict(),
  z.object({ type: z.literal('close_rooms') }).strict(),
  z.object({ type: z.literal('scene'), scene: studioSceneSchema }).strict(),
  z.object({ type: z.literal('remove_scene'), scene_id: id }).strict(),
  z.object({ type: z.literal('select_scene'), scene_id: id.nullable() }).strict(),
  z.object({ type: z.literal('material'), material: studioMaterialSchema }).strict(),
  z.object({ type: z.literal('remove_material'), material_id: id }).strict(),
  z.object({ type: z.literal('quiz'), quiz: studioQuizSchema }).strict(),
  z.object({ type: z.literal('publish_quiz'), quiz_id: id.nullable() }).strict(),
  z.object({ type: z.literal('answer_quiz'), quiz_id: id, answer: z.number().int().min(0).max(5) }).strict(),
  z.object({ type: z.literal('practice'), practice }).strict(),
  z.object({ type: z.literal('submit_practice'), practice_id: id, content: text(2000) }).strict(),
  z.object({ type: z.literal('clock'), clock: studioClockSchema.omit({ updated_at: true }) }).strict(),
  z.object({ type: z.literal('import_engine'), manifest: engineSessionManifestSchema }).strict(),
]);
export type StudioCommand = z.infer<typeof studioCommandSchema>;
export const STUDIO_RECORDING_NOTICE_VERSION = 1;
export const STUDIO_RECORDING_NOTICE_HEADER = 'X-Soflia-Studio-Recording-Notice';
export const STUDIO_RECORDING_NOTICE_REQUIRED = 'Se requiere aceptar el aviso vigente de grabación.';
export const studioOperationSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('recordings'),operation:recordingOperationSchema}).strict(),
  z.object({ type: z.literal('snapshot') }).strict(),
  z.object({ type: z.literal('command'), id, revision: z.number().int().nonnegative(), command: studioCommandSchema }).strict(),
  z.object({ type: z.literal('zoom'), recording_notice_version: z.literal(STUDIO_RECORDING_NOTICE_VERSION).optional() }).strict(),
  z.object({ type: z.literal('upload'), name: text(160), mime: text(100), bytes: z.number().int().min(1).max(25 * 1024 * 1024) }).strict(),
]);
export const studioRequestSchema = studioReferenceSchema.extend({ operation: studioOperationSchema, participation_version:z.literal(1).optional() }).strict();
export const studioStateSchema = z.object({
  version: z.literal(1), revision: z.number().int().nonnegative(), engine_revision: z.string().max(100).nullable(),
  moderation: z.object({ locked: z.boolean(), reactions: z.boolean(), message_interval_seconds:z.number().int().min(0).max(300).default(0), restrictions: z.record(id, z.enum(['chat', 'blocked'])) }).strict(),
  reaction_events:z.array(z.object({id,user_id:id,author:text(160),emoji:studioReactionSchema,room_id:id.nullable(),created_at:z.string().datetime()}).strict()).max(100).default([]),
  participation:z.record(id,z.object({last_message_at:z.string().datetime().optional(),last_reaction_at:z.string().datetime().optional()}).strict()).refine(items=>Object.keys(items).length<=5000).default({}),
  messages: z.array(z.object({ id, user_id: id, author: text(160), instructor: z.boolean(), content: text(2000), question: z.boolean(), room_id: id.nullable(), created_at: z.string().datetime() }).strict()).max(100),
  members: z.array(z.object({ user_id: id, name: text(160), instructor: z.boolean(), room_id: id.nullable(), seen_at: z.string().datetime() }).strict()).max(500),
  rooms: z.array(z.object({ id, name: text(60), user_ids: z.array(id).max(500) }).strict()).max(50),
  scenes: z.array(studioSceneSchema).max(12), active_scene_id: id.nullable(),
  materials: z.array(studioMaterialSchema).max(20),
  quizzes: z.array(studioQuizSchema).max(20), active_quiz_id: id.nullable(),
  answers: z.array(z.object({ quiz_id: id, user_id: id, answer: z.number().int().min(0).max(5) }).strict()).max(10000),
  practices: z.array(practice).max(20),
  submissions: z.array(z.object({ practice_id: id, user_id: id, content: text(2000), created_at: z.string().datetime() }).strict()).max(500),
  clock: studioClockSchema.nullable(),
}).strict();
export type StudioState = z.infer<typeof studioStateSchema>;
export const studioSnapshotSchema = z.object({
  participation_version:z.literal(1).optional(),
  session_id: id, user_id: id, can_manage: z.boolean(), title: text(160), server_time: z.string().datetime(),
  state: studioStateSchema.omit({ quizzes: true }).extend({ quizzes: z.array(quizBase.omit({ correct: true }).extend({ correct: z.number().int().min(0).max(5).optional() })).max(20) }),
  asset_urls: z.record(z.string(), z.string().url().max(4096)),
}).strict();
export type StudioSnapshot = z.infer<typeof studioSnapshotSchema>;
const meetingJoinSchema = z.object({ provider: z.literal("zoom-meeting").optional(), meetingNumber: z.string().regex(/^\d{9,11}$/), signature: text(4096), userName: text(160), password: z.string().max(100), zak: z.string().max(8192).optional(), userEmail:z.string().email().max(254).optional(), recording_required:z.literal(true).default(true), recording_recovery_allowed:z.boolean().default(false) }).strict();
export const videoJoinSchema = z.object({ provider: z.literal("zoom-video"), sessionName: text(200), token: text(4096), userName: text(160), password: z.string().min(1).max(10), recording_required: z.literal(true).default(true) }).strict();
export const zoomJoinSchema = z.union([meetingJoinSchema, videoJoinSchema]);
export type ZoomJoin = z.infer<typeof zoomJoinSchema>;
export const studioResponseSchema = z.object({ snapshot: studioSnapshotSchema.optional(), zoom: zoomJoinSchema.optional(), recording_snapshot: recordingSnapshotSchema.optional(), playback: recordingResponseSchema.shape.playback, upload: z.object({ path: text(500), token: text(8192), url: z.string().url().max(4096) }).strict().optional() }).strict();
export type StudioResult = ({ success: true } & z.infer<typeof studioResponseSchema>) | { success: false; code: 'not_ready' | 'access_denied' | 'conflict' | 'rate_limited' | 'unavailable'; error: string };
