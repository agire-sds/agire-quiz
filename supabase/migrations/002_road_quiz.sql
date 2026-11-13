-- Mode Code de la route. Les parties gardent leur propre copie de la série.
create table public.road_series (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 160),
  slide_count integer not null check (slide_count between 1 and 40),
  slides jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(slides) = 'array')
);
create table public.road_sessions (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.road_series(id) on delete set null,
  host_id uuid not null references public.profiles(id),
  title text not null,
  slides jsonb not null,
  pin text not null unique check(pin ~ '^[0-9]{6}$'),
  status text not null default 'lobby' check(status in ('lobby','question','correction','finished','cancelled')),
  slide_index integer not null default -1,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.road_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.road_sessions(id) on delete cascade,
  nickname text not null check(length(nickname) between 1 and 24),
  token_hash text not null,
  score integer not null default 0,
  speed_ms bigint not null default 0,
  joined_at timestamptz not null default now(),
  unique(session_id,nickname)
);
create table public.road_answers (
  session_id uuid not null references public.road_sessions(id) on delete cascade,
  player_id uuid not null references public.road_players(id) on delete cascade,
  slide_index integer not null,
  answers jsonb not null,
  opened_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  primary key(player_id,slide_index)
);
create index road_players_session_idx on public.road_players(session_id);
create index road_answers_session_idx on public.road_answers(session_id,slide_index);
alter table public.road_series enable row level security;
alter table public.road_sessions enable row level security;
alter table public.road_players enable row level security;
alter table public.road_answers enable row level security;
create policy road_series_admin on public.road_series for all to authenticated
  using (exists(select 1 from public.profiles where id=auth.uid()))
  with check (created_by=auth.uid());
-- Les parties et réponses passent exclusivement par road-api.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('road-media','road-media',true,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do nothing;
create policy road_media_read on storage.objects for select to public using (bucket_id='road-media');
create policy road_media_insert on storage.objects for insert to authenticated
  with check (bucket_id='road-media' and exists(select 1 from public.profiles where id=auth.uid()));
create policy road_media_update on storage.objects for update to authenticated
  using (bucket_id='road-media' and exists(select 1 from public.profiles where id=auth.uid()));
create policy road_media_delete on storage.objects for delete to authenticated
  using (bucket_id='road-media' and exists(select 1 from public.profiles where id=auth.uid()));

-- Une seule transaction pour la correction et le score, même si l'animateur reclique.
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
        where (a.answers ->> ((q.n-1)::integer))::integer <> (q.value ->> 'correct')::integer)),
    speed_ms=coalesce((select sum(greatest(0,extract(epoch from (a.submitted_at-a.opened_at))*1000))::bigint
      from public.road_answers a join public.road_sessions s on s.id=a.session_id
      where a.player_id=p.id and not exists (
        select 1 from jsonb_array_elements(s.slides -> a.slide_index -> 'questions') with ordinality as q(value,n)
        where (a.answers ->> ((q.n-1)::integer))::integer <> (q.value ->> 'correct')::integer)),0)
  where p.session_id=p_session;
  update public.road_sessions set status='correction' where id=p_session;
end $$;
revoke all on function public.road_correct(uuid) from public, anon, authenticated;
grant execute on function public.road_correct(uuid) to service_role;

