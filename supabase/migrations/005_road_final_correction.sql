-- Correction collective uniquement à la fin de la série.
alter table public.road_sessions drop constraint if exists road_sessions_status_check;
alter table public.road_sessions add constraint road_sessions_status_check check(status in ('lobby','question','between','correction','finished','cancelled'));
create or replace function public.road_correct(p_session uuid)
returns void language plpgsql security definer set search_path=public as $$
declare g public.road_sessions%rowtype;
begin
  select * into g from public.road_sessions where id=p_session for update;
  if not found or g.status <> 'question' or g.opened_at is null then
    raise exception 'Question non ouverte';
  end if;
  if clock_timestamp() < g.opened_at + interval '15 seconds' then
    raise exception 'Attendre la fin des 15 secondes';
  end if;
  update public.road_players p set
    score=(select count(*) from public.road_answers a
      where a.player_id=p.id and not exists (
        select 1 from jsonb_array_elements(g.slides -> a.slide_index -> 'questions') with ordinality as q(value,n)
        where not (
          (case when jsonb_typeof(a.answers -> ((q.n-1)::integer))='array'
            then a.answers -> ((q.n-1)::integer)
            else jsonb_build_array(a.answers -> ((q.n-1)::integer)) end)
          @> (case when jsonb_typeof(q.value -> 'correct')='array'
            then q.value -> 'correct' else jsonb_build_array(q.value -> 'correct') end)
          and
          (case when jsonb_typeof(q.value -> 'correct')='array'
            then q.value -> 'correct' else jsonb_build_array(q.value -> 'correct') end)
          @> (case when jsonb_typeof(a.answers -> ((q.n-1)::integer))='array'
            then a.answers -> ((q.n-1)::integer)
            else jsonb_build_array(a.answers -> ((q.n-1)::integer)) end)
        ))),
    speed_ms=coalesce((select sum(case when a.validated_at is null then 15000 else least(15000,greatest(0,extract(epoch from (a.validated_at-a.opened_at))*1000)) end)::bigint
      from public.road_answers a join public.road_sessions s on s.id=a.session_id
      where a.player_id=p.id and not exists (
        select 1 from jsonb_array_elements(s.slides -> a.slide_index -> 'questions') with ordinality as q(value,n)
        where not (
          (case when jsonb_typeof(a.answers -> ((q.n-1)::integer))='array'
            then a.answers -> ((q.n-1)::integer)
            else jsonb_build_array(a.answers -> ((q.n-1)::integer)) end)
          @> (case when jsonb_typeof(q.value -> 'correct')='array'
            then q.value -> 'correct' else jsonb_build_array(q.value -> 'correct') end)
          and
          (case when jsonb_typeof(q.value -> 'correct')='array'
            then q.value -> 'correct' else jsonb_build_array(q.value -> 'correct') end)
          @> (case when jsonb_typeof(a.answers -> ((q.n-1)::integer))='array'
            then a.answers -> ((q.n-1)::integer)
            else jsonb_build_array(a.answers -> ((q.n-1)::integer)) end)
        ))),0)
  where p.session_id=p_session;
  update public.road_sessions set status=case when g.slide_index+1>=jsonb_array_length(g.slides) then 'correction' else 'between' end where id=p_session;
end; $$;
revoke all on function public.road_correct(uuid) from public, anon, authenticated;
grant execute on function public.road_correct(uuid) to service_role;
