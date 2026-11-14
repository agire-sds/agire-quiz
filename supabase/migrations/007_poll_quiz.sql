-- Modèle Sondage : séries éditables, parties figées et réponses privées.
create table public.poll_series (
  id uuid primary key default gen_random_uuid(),
  title text not null check(length(title) between 1 and 160),
  question_count integer not null check(question_count between 1 and 40),
  questions jsonb not null default '[]'::jsonb check(jsonb_typeof(questions)='array'),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.poll_sessions (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.poll_series(id) on delete set null,
  host_id uuid not null references public.profiles(id),
  title text not null,
  questions jsonb not null,
  pin text not null unique check(pin ~ '^[0-9]{6}$'),
  status text not null default 'lobby' check(status in ('lobby','question','results','finished','cancelled')),
  question_index integer not null default -1,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.poll_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.poll_sessions(id) on delete cascade,
  nickname text not null check(length(nickname) between 1 and 24),
  token_hash text not null,
  joined_at timestamptz not null default now(),
  unique(session_id,nickname)
);
create table public.poll_answers (
  session_id uuid not null references public.poll_sessions(id) on delete cascade,
  player_id uuid not null references public.poll_players(id) on delete cascade,
  question_index integer not null,
  answer jsonb not null,
  submitted_at timestamptz not null default now(),
  primary key(player_id,question_index)
);
create index poll_players_session_idx on public.poll_players(session_id);
create index poll_answers_session_idx on public.poll_answers(session_id,question_index);
alter table public.poll_series enable row level security;
alter table public.poll_sessions enable row level security;
alter table public.poll_players enable row level security;
alter table public.poll_answers enable row level security;
create policy poll_series_admin on public.poll_series for all to authenticated
  using (exists(select 1 from public.profiles where id=auth.uid()))
  with check(created_by=auth.uid());
-- Les autres tables sont accessibles uniquement par poll-api avec la clé service_role.
