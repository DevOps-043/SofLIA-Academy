-- Solo catálogo/agregados; no llama RPCs de escritura ni crea sesiones.
select jsonb_build_object(
 'video_provider',exists(select 1 from information_schema.columns where table_schema='public' and table_name='live_sessions' and column_name='video_provider'),
 'video_rls',(select relrowsecurity from pg_class where oid=to_regclass('public.live_video_credentials')),
 'video_rows',(select count(*) from public.live_video_credentials),
 'provider_counts',(select jsonb_object_agg(video_provider,amount) from (select video_provider,count(*) amount from public.live_sessions group by video_provider) counts),
 'session_counts',(select jsonb_object_agg(status,amount) from (select status,count(*) amount from public.live_sessions group by status) counts),
 'states',(select count(*) from public.live_studio_state),
 'new_state_rows',(select count(*) from public.live_studio_state where state ? 'reaction_events' or state ? 'participation'),
 'functions',(select jsonb_agg(jsonb_build_object(
   'name',p.proname,'security_definer',p.prosecdef,'anon',has_function_privilege('anon',p.oid,'EXECUTE'),
   'authenticated',has_function_privilege('authenticated',p.oid,'EXECUTE'),'service_role',has_function_privilege('service_role',p.oid,'EXECUTE'),
   'rate_limit',position('STUDIO_RATE_LIMITED' in p.prosrc)>0,'legacy_guard',position('Instalar la migración' in p.prosrc)>0))
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('live_studio_commit','live_studio_commit_core_v1','live_finalize_video_session')),
 'video_table_public_access',has_table_privilege('anon','public.live_video_credentials','SELECT') or has_table_privilege('authenticated','public.live_video_credentials','SELECT'),
 'realtime',exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='live_studio_revisions'),
 'private_buckets',(select count(*)=2 and bool_and(not public) from storage.buckets where id in ('live-studio-assets','live-recordings'))
) as postflight;
