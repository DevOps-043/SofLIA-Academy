import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { readJwtBearerToken } from '@/lib/auth/bearer-token';
import { liveActorContext, LiveError } from './server';

/** El actor siempre proviene de Auth; el escritorio no envía rol ni user_id. */
export async function verifiedHubUser(request: Request): Promise<string> {
  const token = readJwtBearerToken(request.headers.get('authorization'));
  if (!token) throw new LiveError(401, 'Inicia sesión en Soflia Hub');
  const { data, error } = await createAdminClient().auth.getUser(token);
  if (error || !data.user) throw new LiveError(401, 'La sesión de Soflia Hub no es válida');
  return data.user.id;
}
export async function hubActorContext(userId: string, orgSlug: string) {
  const { data, error } = await createAdminClient().from('organizations').select('id,is_active').eq('slug', orgSlug).maybeSingle();
  if (error) throw new LiveError(503, 'No se pudo verificar la organización');
  if (!data?.is_active) throw new LiveError(403, 'Organización sin acceso');
  return liveActorContext(userId, data.id);
}

/** Acota bytes reales incluso sin Content-Length; no acepta streams ilimitados. */
export async function readWorkspaceBody(request: Request, maxBytes = 32768): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new LiveError(400, 'Falta el cuerpo de la solicitud');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      const value = chunk.value;
      length += value.byteLength;
      if (length > maxBytes) { await reader.cancel(); throw new LiveError(413, 'La solicitud supera el límite del aula'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
