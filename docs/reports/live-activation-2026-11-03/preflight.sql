-- Solo catálogo y agregados. Instancia SOFIA/Learning. No modifica datos.
select jsonb_build_object(
 'commit_body_md5',(select md5(prosrc) from pg_proc where oid=to_regprocedure('public.live_studio_commit(uuid,uuid,uuid,uuid,text,bigint,text,jsonb)')),
 'video_provider',exists(select 1 from information_schema.columns where table_schema='public' and table_name='live_sessions' and column_name='video_provider'),
 'video_credentials',to_regclass('public.live_video_credentials') is not null,
 'session_counts',(select jsonb_object_agg(status,amount) from (select status,count(*) amount from public.live_sessions group by status) counts),
 'states',(select count(*) from public.live_studio_state),
 'realtime',exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='live_studio_revisions'),
 'private_buckets',(select count(*)=2 and bool_and(not public) from storage.buckets where id in ('live-studio-assets','live-recordings'))
) as preflight;
