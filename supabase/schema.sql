-- Schemat bazy Supabase dla aplikacji Sternik Morski (projekt: sternik-morski).
-- Konta członków rodziny zakładane są ręcznie (bez rejestracji w aplikacji);
-- każdy członek musi mieć wiersz w public.members – inaczej RLS nie pozwoli na zapis.

create table public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.card_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  card_id text not null,
  box smallint not null default 0 check (box between 0 and 3),
  seen integer not null default 0,
  last_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table public.study_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mode text not null,
  title text not null,
  lesson_id text,
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  total integer not null,
  ok integer not null default 0,
  mid integer not null default 0,
  bad integer not null default 0
);
create index study_sessions_user_finished on public.study_sessions (user_id, finished_at desc);

create schema if not exists private;
grant usage on schema private to authenticated;
create or replace function private.is_member()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.members m where m.user_id = (select auth.uid())) $$;
revoke all on function private.is_member() from public, anon;
grant execute on function private.is_member() to authenticated;

alter table public.members enable row level security;
alter table public.card_progress enable row level security;
alter table public.study_sessions enable row level security;

create policy "members: own row" on public.members
  for select to authenticated using (user_id = (select auth.uid()));
create policy "progress: own select" on public.card_progress
  for select to authenticated using (user_id = (select auth.uid()) and (select private.is_member()));
create policy "progress: own insert" on public.card_progress
  for insert to authenticated with check (user_id = (select auth.uid()) and (select private.is_member()));
create policy "progress: own update" on public.card_progress
  for update to authenticated using (user_id = (select auth.uid()) and (select private.is_member()))
  with check (user_id = (select auth.uid()));
create policy "progress: own delete" on public.card_progress
  for delete to authenticated using (user_id = (select auth.uid()) and (select private.is_member()));
create policy "sessions: own select" on public.study_sessions
  for select to authenticated using (user_id = (select auth.uid()) and (select private.is_member()));
create policy "sessions: own insert" on public.study_sessions
  for insert to authenticated with check (user_id = (select auth.uid()) and (select private.is_member()));
create policy "sessions: own delete" on public.study_sessions
  for delete to authenticated using (user_id = (select auth.uid()) and (select private.is_member()));

grant select on public.members to authenticated;
grant select, insert, update, delete on public.card_progress to authenticated;
grant select, insert, delete on public.study_sessions to authenticated;
revoke all on public.members, public.card_progress, public.study_sessions from anon;

-- ===== Ulepszenia (powtórki, podtrzymanie, rodzina) =====
alter table public.card_progress
  add column if not exists due_at timestamptz,
  add column if not exists ivl real not null default 0;

create or replace function public.ping()
returns text language sql stable set search_path = ''
as $$ select 'ok'::text $$;
grant execute on function public.ping() to anon, authenticated;

-- zestawienie rodziny: tylko podsumowania, tylko dla członków
create or replace function private.family_progress()
returns table (display_name text, is_me boolean, mastered integer, learning integer, last_activity timestamptz,
  sessions_7d integer, exams integer, best_exam integer, last_exam integer, last_exam_total integer)
language sql stable security definer set search_path = ''
as $$
  select m.display_name, m.user_id = (select auth.uid()),
    (select count(*)::int from public.card_progress p where p.user_id = m.user_id and p.box >= 2),
    (select count(*)::int from public.card_progress p where p.user_id = m.user_id and p.box < 2),
    greatest((select max(p.last_at) from public.card_progress p where p.user_id = m.user_id),
             (select max(s.finished_at) from public.study_sessions s where s.user_id = m.user_id)),
    (select count(*)::int from public.study_sessions s where s.user_id = m.user_id and s.finished_at > now() - interval '7 days'),
    (select count(*)::int from public.study_sessions s where s.user_id = m.user_id and s.mode = 'egzamin'),
    (select max(s.ok) from public.study_sessions s where s.user_id = m.user_id and s.mode = 'egzamin'),
    (select s.ok from public.study_sessions s where s.user_id = m.user_id and s.mode = 'egzamin' order by s.finished_at desc limit 1),
    (select s.total from public.study_sessions s where s.user_id = m.user_id and s.mode = 'egzamin' order by s.finished_at desc limit 1)
  from public.members m where (select private.is_member()) order by m.created_at
$$;
revoke all on function private.family_progress() from public, anon;
grant execute on function private.family_progress() to authenticated;

create function public.family_progress()
returns table (display_name text, is_me boolean, mastered integer, learning integer, last_activity timestamptz,
  sessions_7d integer, exams integer, best_exam integer, last_exam integer, last_exam_total integer)
language sql stable set search_path = '' as $$ select * from private.family_progress() $$;
revoke all on function public.family_progress() from public, anon;
grant execute on function public.family_progress() to authenticated;
alter table public.card_progress add column if not exists wrong integer not null default 0; -- licznik błędów (statystyki trudnych pytań)

-- pytania z zewnętrznych baz (np. przykładowe pytania PZŻ) – tylko w bazie, odczyt tylko dla członków rodziny
create table public.exam_questions (
  id text primary key, source text not null, section text not null, level smallint not null, num integer,
  q text not null, options jsonb not null, answer smallint not null check (answer between 0 and 3),
  explain text, visual jsonb, confidence text, created_at timestamptz not null default now()
);
alter table public.exam_questions enable row level security;
create policy "exam_questions: members read" on public.exam_questions for select to authenticated using ((select private.is_member()));
grant select on public.exam_questions to authenticated;
revoke all on public.exam_questions from anon;
