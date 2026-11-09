import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import type { Json } from '@/lib/supabase/types';
import { checked, liveSession, liveActorContext, LiveError, type LiveContext } from './server';
import { applyStudioCommand, emptyStudioState, projectStudioState, StudioDomainError, type StudioActor } from './live-studio-domain';
import { studioResponseSchema, studioStateSchema, type studioOperationSchema } from './live-studio.contract';
import type { z } from 'zod';
import { createZoomStudioJoin } from './studio-zoom.server';
import { verifyStudioAssets, studioAssetMime, STUDIO_ASSET_BUCKET } from './studio-assets.server';
import { recordingOperation } from './recordings/service.server';

const bucket = STUDIO_ASSET_BUCKET;
async function revalidateStudioAccess(context: LiveContext, sessionId: string) {
  const fresh = await liveActorContext(context.userId, context.orgId);
  const organization = checked(await fresh.db.from('organizations').select('is_active').eq('id', context.orgId).maybeSingle());
  if (!organization?.is_active) throw new LiveError(403, 'Organización sin acceso');
  return liveSession(fresh, sessionId);
}

export async function executeStudio(context: LiveContext, sessionId: string, operation: z.infer<typeof studioOperationSchema>) {
  if(operation.type==='recordings')return recordingOperation(context,sessionId,operation.operation);
  const { session, canManage } = await liveSession(context, sessionId);
  const user = checked(await context.db.from('users').select('display_name,first_name').eq('id', context.userId).single());
  const actor: StudioActor = { id: context.userId, name: (user?.display_name || user?.first_name || 'Participante').slice(0, 160), canManage, courseId: session.course_id, status: session.status };
  const row = checked(await context.db.from('live_studio_state').select('state').eq('session_id', sessionId).maybeSingle());
  const state = row ? studioStateSchema.parse(row.state) : emptyStudioState();
  projectStudioState(state, actor, new Date().toISOString());
  if (operation.type === 'zoom') {
    const zoom = await createZoomStudioJoin(context, session, actor, operation.recording_notice_version);
    const finalAccess = await revalidateStudioAccess(context, sessionId);
    const latest = checked(await context.db.from('live_studio_state').select('state').eq('session_id', sessionId).maybeSingle());
    if (finalAccess.canManage !== canManage || ['ended', 'cancelled'].includes(finalAccess.session.status)) throw new LiveError(403, 'Los permisos de la sesión cambiaron');
    projectStudioState(latest ? studioStateSchema.parse(latest.state) : emptyStudioState(), actor, new Date().toISOString());
    return { zoom };
  }
  if (operation.type === 'upload') {
    if (!canManage || ['ended','cancelled'].includes(session.status)) throw new LiveError(403, 'No puedes publicar material en esta sesión');
    if (!studioAssetMime.has(operation.mime)) throw new LiveError(400, 'Formato de archivo no permitido');
    const path = `${context.orgId}/${sessionId}/${randomUUID()}`;
    const upload = checked(await context.db.storage.from(bucket).createSignedUploadUrl(path, { upsert: false }));
    if (!upload) throw new LiveError(503, 'No se pudo preparar la subida');
    checked(await context.db.from('live_studio_assets').insert({ path, session_id: sessionId, status: 'staged' }));
    return { upload: { path, token: upload.token, url: upload.signedUrl } };
  }
  let next = state;
  if (operation.type === 'command') {
    const hash = createHash('sha256').update(JSON.stringify(operation.command)).digest('hex');
    const duplicate = checked(await context.db.from('live_studio_commands').select('payload_hash').eq('session_id', sessionId).eq('user_id', context.userId).eq('id', operation.id).maybeSingle());
    if (duplicate && duplicate.payload_hash !== hash) throw new LiveError(409, 'El identificador de operación ya fue utilizado');
    if (!duplicate) {
      // SQL fusiona presencia sobre el estado vigente bajo bloqueo, sin perder otros actores.
      if (operation.command.type !== 'presence' && operation.revision !== state.revision) throw new LiveError(409, 'El estado cambió. Actualiza antes de repetir la acción');
      try { next = applyStudioCommand(state, operation.command, actor, operation.id, new Date().toISOString(), randomUUID); }
      catch (error) {
        if (error instanceof StudioDomainError) throw new LiveError(error.code === 'forbidden' ? 403 : error.code === 'closed' ? 409 : 400, error.message);
        throw error;
      }
      await verifyStudioAssets(context, sessionId, state, next);
      const committed = await context.db.rpc('live_studio_commit', { p_org: context.orgId, p_user: context.userId, p_session: sessionId, p_id: operation.id, p_hash: hash, p_expected: operation.revision, p_type: operation.command.type, p_state: next as unknown as Json });
      if (committed.error) {
        if (/STUDIO_(CONFLICT|ID_CONFLICT)/.test(committed.error.message)) throw new LiveError(409, 'El estado cambió. Actualiza antes de repetir la acción');
        if (committed.error.message.includes('LIVE_FORBIDDEN')) throw new LiveError(403, 'El acceso a la sesión cambió');
        if (committed.error.message.includes('STUDIO_INVALID_ASSET')) throw new LiveError(409, 'El archivo caducó. Vuelve a subirlo antes de publicar');
        throw new LiveError(503, 'No se pudo guardar el estado de la sesión');
      }
    }
  }
  if (operation.type === 'command') {
    const latest = checked(await context.db.from('live_studio_state').select('state').eq('session_id', sessionId).maybeSingle());
    next = latest ? studioStateSchema.parse(latest.state) : emptyStudioState();
  }
  const now = new Date().toISOString();
  const visible = projectStudioState(next, actor, now);
  const paths = [...new Set([...visible.materials.map((item) => item.asset_path), ...visible.scenes.flatMap((scene) => scene.asset_path ? [scene.asset_path] : [])])];
  const asset_urls: Record<string, string> = {};
  if (paths.length) {
    const urls = checked(await context.db.storage.from(bucket).createSignedUrls(paths, 900));
    for (const item of urls || []) if (item.path && item.signedUrl && !item.error) asset_urls[item.path] = item.signedUrl;
  }
  // Revalidar membresía tras llamadas al proveedor antes de entregar contenido.
  const finalAccess = await revalidateStudioAccess(context, sessionId);
  if (finalAccess.canManage !== canManage) throw new LiveError(403, 'Los permisos de la sesión cambiaron');
  return studioResponseSchema.parse({ snapshot: { session_id: sessionId, user_id: actor.id, can_manage: actor.canManage, title: session.title, server_time: now, state: visible, asset_urls } });
}
