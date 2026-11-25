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
