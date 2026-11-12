import {recordingConfigurationHealth} from '../apps/web/src/features/live/recordings/health';
async function main(){
  if(process.argv.includes('--help')){console.log('Uso: npm run recordings:health -- [--database]. Por defecto comprueba solo nombres de configuración, sin leer .env ni contactar servicios. --database consulta contadores y última actividad; no demuestra que el worker esté vivo.');return;}
  const configuration=recordingConfigurationHealth(process.env);
  let queue:unknown=null;
  if(process.argv.includes('--database')){
    const {createAdminClient}=await import('../apps/web/src/lib/supabase/admin');
    const {recordingQueueHealth}=await import('../apps/web/src/features/live/recordings/health.server');
    queue=await recordingQueueHealth(createAdminClient() as Parameters<typeof recordingQueueHealth>[0]);
  }
  console.log(JSON.stringify({configuration,queue}));
  if(!configuration.configuration_complete||!configuration.privacy_approved)process.exitCode=1;
}
void main().catch(()=>{console.error('[Grabaciones] No se pudo completar el diagnóstico; revisa conectividad y esquema.');process.exitCode=1;});
