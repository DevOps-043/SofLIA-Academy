import 'server-only';
import {recordingDb} from './database';
import {checked} from '../errors';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {LiveDatabase} from '../database.types';

export async function recordingQueueHealth(db:SupabaseClient<LiveDatabase>,now=new Date()){
  const client=recordingDb(db);
  const results=await Promise.all([
    client.from('live_recording_jobs').select('run_id',{count:'exact',head:true}).eq('status','queued'),
    client.from('live_recording_jobs').select('run_id',{count:'exact',head:true}).eq('status','running'),
    client.from('live_recording_jobs').select('run_id',{count:'exact',head:true}).eq('status','failed'),
    client.from('live_recording_jobs').select('run_id',{count:'exact',head:true}).eq('status','running').lt('lease_until',now.toISOString()),
    client.from('live_recording_jobs').select('updated_at').order('updated_at',{ascending:false}).limit(1).maybeSingle(),
  ]);
  for(const result of results)checked<unknown>(result);
  return {queued:results[0].count??0,running:results[1].count??0,failed:results[2].count??0,expired_leases:results[3].count??0,last_job_activity:results[4].data?.updated_at??null,worker_liveness:'unknown' as const};
}
