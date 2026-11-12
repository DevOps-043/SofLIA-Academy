import { NextRequest } from 'next/server';
import { handleLive,json,checked,LiveError } from '@/features/live/server';
import { hubActorContext,readWorkspaceBody } from '@/features/live/hub-auth.server';
import { enginePreparationSchema,engineTargetsRequestSchema,engineTargetsSchema } from '@/features/live/engine-preparation.contract';
import { verifyEnginePreparation,deliverEnginePreparation } from '@/features/live/engine-preparation.server';
import { rateLimitMiddleware,RateLimitTier } from '@/lib/rate-limit/advanced-rate-limit';

export async function POST(request:NextRequest){
  return handleLive(async()=>{
    // Reutiliza el lector acotado antes de procesar contenido externo.
    const body=await readWorkspaceBody(request);
    const raw=JSON.stringify(body);
    verifyEnginePreparation(raw,request.headers.get('X-Soflia-Timestamp'),request.headers.get('X-Soflia-Signature'),process.env.COURSEFORGE_API_KEY);
    const catalog=engineTargetsRequestSchema.safeParse(body);
    if(catalog.success){
      const limited=rateLimitMiddleware(request,RateLimitTier.API_READ,catalog.data.actor_id);if(limited)return limited;
      const context=await hubActorContext(catalog.data.actor_id,catalog.data.organization_slug);
      if(!context.canTeach)throw new LiveError(403,'Se requiere permiso docente para preparar una sesión.');
      let query=context.db.from('live_sessions').select('id,course_id,title,starts_at').eq('organization_id',context.orgId).eq('status','scheduled').order('starts_at').limit(100);
      if(!context.isAdmin)query=query.eq('instructor_id',context.userId);
      const rows=checked(await query)??[];
      return json({targets:engineTargetsSchema.parse(rows.map(({id,...row})=>({session_id:id,...row})))});
    }
    const input=enginePreparationSchema.parse(body);
    const limited=rateLimitMiddleware(request,RateLimitTier.API_MUTATION,input.actor_id);
    if(limited)return limited;
    const context=await hubActorContext(input.actor_id,input.organization_slug);
    return json(await deliverEnginePreparation(context,input));
  });
}
