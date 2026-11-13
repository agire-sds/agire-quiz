-- Exécuter dans SQL Editor du projet Supabase.
create extension if not exists pgcrypto;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, role text not null default 'admin' check(role='admin'), created_at timestamptz default now());
create table public.quizzes (id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 160), description text not null default '', created_by uuid not null references public.profiles(id), created_at timestamptz not null default now());
create table public.questions (id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id) on delete cascade, position integer not null default 0, prompt text not null, duration integer not null default 20 check(duration in (10,15,20,30,60)));
create table public.answer_options (id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade, position integer not null default 0, label text not null, correct boolean not null default false);
create table public.game_sessions (id uuid primary key default gen_random_uuid(), quiz_id uuid references public.quizzes(id) on delete set null, host_id uuid not null references public.profiles(id), pin text not null unique check(pin ~ '^[0-9]{6}$'), status text not null default 'lobby' check(status in ('lobby','question','reveal','finished','cancelled')), question_index integer not null default -1, question_started_at timestamptz, created_at timestamptz not null default now());
create table public.game_players (id uuid primary key default gen_random_uuid(), session_id uuid not null references public.game_sessions(id) on delete cascade, nickname text not null check(length(nickname) between 1 and 24), token_hash text not null, score integer not null default 0, joined_at timestamptz not null default now(), unique(session_id,nickname));
create table public.game_questions (id uuid primary key default gen_random_uuid(), session_id uuid not null references public.game_sessions(id) on delete cascade, position integer not null, prompt text not null, duration integer not null, unique(session_id,position));
create table public.game_options (id uuid primary key default gen_random_uuid(), game_question_id uuid not null references public.game_questions(id) on delete cascade, position integer not null, label text not null, correct boolean not null default false);
create table public.game_answers (id uuid primary key default gen_random_uuid(), game_question_id uuid not null references public.game_questions(id) on delete cascade, player_id uuid not null references public.game_players(id) on delete cascade, game_option_id uuid not null references public.game_options(id), points integer not null default 0, answered_at timestamptz not null default now(), unique(game_question_id,player_id));
create index game_players_session_idx on public.game_players(session_id);
create index game_questions_session_idx on public.game_questions(session_id,position);
create index game_answers_question_idx on public.game_answers(game_question_id);
-- Toutes les tables sont privées. Les participants utilisent exclusivement l'Edge Function.
alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.answer_options enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_players enable row level security;
alter table public.game_questions enable row level security;
alter table public.game_options enable row level security;
alter table public.game_answers enable row level security;
create policy profile_self on public.profiles for select to authenticated using (id=auth.uid());
create policy admin_quizzes on public.quizzes for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid())) with check (created_by=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid()));
create policy admin_questions on public.questions for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid())) with check (exists(select 1 from public.profiles p where p.id=auth.uid()));
create policy admin_options on public.answer_options for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid())) with check (exists(select 1 from public.profiles p where p.id=auth.uid()));
-- Aucun accès client direct aux tables de parties.
-- Créer les administrateurs via Authentication > Users, puis exécuter :
-- insert into public.profiles(id) values ('UUID_UTILISATEUR');
