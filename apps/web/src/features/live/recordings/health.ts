/** Diagnóstico sin valores de secretos. Configurado no acredita una prueba real. */
export function recordingConfigurationHealth(environment:Record<string,string|undefined>){
  const provider=environment.LIVE_VIDEO_PROVIDER||'zoom-meeting';
  const common=['SUPABASE_SERVICE_ROLE_KEY','RECORDING_S3_ENDPOINT','RECORDING_S3_ACCESS_KEY','RECORDING_S3_SECRET_KEY'];
  const required=provider==='zoom-video'?['ZOOM_VIDEO_SDK_KEY','ZOOM_VIDEO_SDK_SECRET','ZOOM_VIDEO_API_KEY','ZOOM_VIDEO_ACCOUNT_ID']:['ZOOM_ACCOUNT_ID','ZOOM_CLIENT_ID','ZOOM_CLIENT_SECRET','ZOOM_PLATFORM_HOST_IDS','ZOOM_MEETING_SDK_CLIENT_ID','ZOOM_MEETING_SDK_CLIENT_SECRET'];
  const missing=[...common,...required].filter(name=>!environment[name]?.trim());
  if(!environment.NEXT_PUBLIC_SUPABASE_URL&&!environment.SUPABASE_URL)missing.push('SUPABASE_URL');
  if(provider!=='zoom-video'&&provider!=='zoom-meeting')missing.push('LIVE_VIDEO_PROVIDER válido');
  const privacy=environment[provider==='zoom-video'?'ZOOM_VIDEO_RECORDING_PRIVACY_APPROVED':'ZOOM_RECORDING_PRIVACY_APPROVED']==='true';
  return {provider,configuration_complete:missing.length===0,privacy_approved:privacy,missing,requires_real_pilot:true};
}
