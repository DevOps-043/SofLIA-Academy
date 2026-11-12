// @vitest-environment node
import {describe,expect,it} from 'vitest';
import {recordingConfigurationHealth} from '../recordings/health';
describe('diagnóstico seguro de grabaciones',()=>{
  it('informa campos faltantes sin valores ni éxito de captura inventado',()=>{
    const result=recordingConfigurationHealth({ZOOM_VIDEO_SDK_SECRET:'NO_DEBE_APARECER',LIVE_VIDEO_PROVIDER:'zoom-video'});
    expect(JSON.stringify(result)).not.toContain('NO_DEBE_APARECER');
    expect(result).toMatchObject({configuration_complete:false,requires_real_pilot:true,privacy_approved:false});
    expect(result.missing).toContain('RECORDING_S3_ENDPOINT');
    expect(result.missing).not.toContain('ZOOM_VIDEO_SDK_SECRET');
  });
  it('mantiene la aprobación de privacidad y validación real separadas de presencia de variables',()=>{
    const environment=Object.fromEntries(['SUPABASE_SERVICE_ROLE_KEY','RECORDING_S3_ENDPOINT','RECORDING_S3_ACCESS_KEY','RECORDING_S3_SECRET_KEY','SUPABASE_URL','ZOOM_VIDEO_SDK_KEY','ZOOM_VIDEO_SDK_SECRET','ZOOM_VIDEO_API_KEY','ZOOM_VIDEO_ACCOUNT_ID'].map(key=>[key,'presente']));
    expect(recordingConfigurationHealth({...environment,LIVE_VIDEO_PROVIDER:'zoom-video'})).toMatchObject({configuration_complete:true,privacy_approved:false,requires_real_pilot:true});
    expect(recordingConfigurationHealth({...environment,LIVE_VIDEO_PROVIDER:'zoom-video',ZOOM_VIDEO_RECORDING_PRIVACY_APPROVED:'true'})).toMatchObject({privacy_approved:true,requires_real_pilot:true});
  });
});
