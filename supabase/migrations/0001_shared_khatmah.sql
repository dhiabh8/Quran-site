-- NOOR — Shared Khatmah (group Quran completion)
-- Run this in the Supabase SQL editor or with the Supabase CLI.
-- All writes go through SECURITY DEFINER RPCs so RLS can stay strict.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.khatmahs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text check (description is null or char_length(description) <= 600),
  creator_id uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique check (invite_code ~ '^[a-f0-9]{24}$'),
  status text not null default 'active' check (status in ('active', 'completed')),
  started_at date,
  target_date date,
  joining_open boolean not null default true,
  created_at timestamptz not null default now(),
  constraint khatmahs_dates_valid check (
    target_date is null or started_at is null or target_date >= started_at
  )
);

create index if not exists khatmahs_creator_idx on public.khatmahs (creator_id);
create index if not exists khatmahs_status_idx on public.khatmahs (status);
create index if not exists khatmahs_invite_idx on public.khatmahs (invite_code);

create table if not exists public.khatmah_participants (
  id uuid primary key default gen_random_uuid(),
  khatmah_id uuid not null references public.khatmahs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 60),
  role text not null default 'participant' check (role in ('owner', 'participant')),
  joined_at timestamptz not null default now(),
  constraint khatmah_participants_unique_member unique (khatmah_id, user_id),
  constraint khatmah_participants_id_group unique (khatmah_id, id)
);

create index if not exists khatmah_participants_khatmah_idx
  on public.khatmah_participants (khatmah_id);
create index if not exists khatmah_participants_user_idx
  on public.khatmah_participants (user_id);

create table if not exists public.khatmah_juz (
  id uuid primary key default gen_random_uuid(),
  khatmah_id uuid not null references public.khatmahs (id) on delete cascade,
  juz_number integer not null check (juz_number between 1 and 30),
  assigned_to uuid,
  status text not null default 'available'
    check (status in ('available', 'assigned', 'in_progress', 'completed')),
  completed_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint khatmah_juz_unique_number unique (khatmah_id, juz_number),
  -- No ON DELETE action here: SET NULL would also try to null the NOT NULL
  -- khatmah_id column of this composite key. Participant deletion is not
  -- exposed to clients; group deletion cascades from khatmahs instead.
  constraint khatmah_juz_assignee_same_group
    foreign key (assigned_to, khatmah_id)
    references public.khatmah_participants (id, khatmah_id),
  constraint khatmah_juz_state_valid check (
    (status = 'available' and assigned_to is null and completed_at is null)
    or (status in ('assigned', 'in_progress') and assigned_to is not null and completed_at is null)
    or (status = 'completed' and assigned_to is not null and completed_at is not null)
  )
);

create index if not exists khatmah_juz_khatmah_idx on public.khatmah_juz (khatmah_id);
create index if not exists khatmah_juz_assignee_idx on public.khatmah_juz (assigned_to);
create index if not exists khatmah_juz_status_idx on public.khatmah_juz (khatmah_id, status);

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------

create or replace function public.generate_invite_code()
returns text
language sql
volatile
set search_path = public
as $$
  select encode(gen_random_bytes(12), 'hex');
$$;

create or replace function public.is_khatmah_member(p_khatmah_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.khatmah_participants
    where khatmah_id = p_khatmah_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_khatmah_owner(p_khatmah_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.khatmahs
    where id = p_khatmah_id and creator_id = auth.uid()
  );
$$;

-- Every new Khatmah starts with exactly 30 available juz.
create or replace function public.init_khatmah_juz()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.khatmah_juz (khatmah_id, juz_number, status)
  select new.id, n, 'available' from generate_series(1, 30) as n;
  return new;
end;
$$;

drop trigger if exists khatmahs_init_juz on public.khatmahs;
create trigger khatmahs_init_juz
  after insert on public.khatmahs
  for each row execute function public.init_khatmah_juz();

-- Completion is derived from data, never from simply opening a juz.
create or replace function public.sync_khatmah_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_khatmah_id uuid;
  v_done integer;
begin
  if tg_op = 'DELETE' then
    v_khatmah_id := old.khatmah_id;
  else
    v_khatmah_id := new.khatmah_id;
  end if;

  select count(*) into v_done
  from public.khatmah_juz
  where khatmah_id = v_khatmah_id and status = 'completed';

  update public.khatmahs
  set status = case when v_done = 30 then 'completed' else 'active' end
  where id = v_khatmah_id;

  return null;
end;
$$;

drop trigger if exists khatmah_juz_sync_completion on public.khatmah_juz;
create trigger khatmah_juz_sync_completion
  after insert or update or delete on public.khatmah_juz
  for each row execute function public.sync_khatmah_completion();

-- Participants cannot change identity or role by editing their own row.
create or replace function public.guard_participant_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.khatmah_id is distinct from old.khatmah_id
     or new.role is distinct from old.role then
    raise exception 'Participant identity and role cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists khatmah_participants_guard_identity on public.khatmah_participants;
create trigger khatmah_participants_guard_identity
  before update on public.khatmah_participants
  for each row execute function public.guard_participant_identity();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.khatmahs enable row level security;
alter table public.khatmah_participants enable row level security;
alter table public.khatmah_juz enable row level security;

drop policy if exists "members can view their khatmahs" on public.khatmahs;
create policy "members can view their khatmahs"
  on public.khatmahs for select to authenticated
  using (public.is_khatmah_member(id));

drop policy if exists "owners manage their khatmahs" on public.khatmahs;
create policy "owners manage their khatmahs"
  on public.khatmahs for update to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

drop policy if exists "members can view participants" on public.khatmah_participants;
create policy "members can view participants"
  on public.khatmah_participants for select to authenticated
  using (public.is_khatmah_member(khatmah_id));

drop policy if exists "members can update their own display name" on public.khatmah_participants;
create policy "members can update their own display name"
  on public.khatmah_participants for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "members can view juz" on public.khatmah_juz;
create policy "members can view juz"
  on public.khatmah_juz for select to authenticated
  using (public.is_khatmah_member(khatmah_id));

-- No insert/delete/update policies on khatmah_juz: all writes use RPCs below.

grant usage on schema public to anon, authenticated;
grant select on public.khatmahs, public.khatmah_participants, public.khatmah_juz to authenticated;
grant update (display_name) on public.khatmah_participants to authenticated;

-- ---------------------------------------------------------------------------
-- Public RPCs
-- ---------------------------------------------------------------------------

-- Preview for anyone holding an invite link. Deliberately minimal and nonsensitive.
create or replace function public.get_khatmah_preview(p_invite_code text)
returns table (
  id uuid,
  title text,
  description text,
  creator_display_name text,
  status text,
  joining_open boolean,
  participant_count integer,
  completed_count integer,
  started_at date,
  target_date date,
  created_at timestamptz,
  viewer_is_member boolean,
  viewer_participant_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    k.id,
    k.title,
    k.description,
    (select p.display_name from public.khatmah_participants p
      where p.khatmah_id = k.id and p.role = 'owner' limit 1),
    k.status,
    k.joining_open,
    (select count(*)::integer from public.khatmah_participants p
      where p.khatmah_id = k.id),
    (select count(*)::integer from public.khatmah_juz j
      where j.khatmah_id = k.id and j.status = 'completed'),
    k.started_at,
    k.target_date,
    k.created_at,
    exists (select 1 from public.khatmah_participants p
      where p.khatmah_id = k.id and p.user_id = auth.uid()),
    (select p.id from public.khatmah_participants p
      where p.khatmah_id = k.id and p.user_id = auth.uid() limit 1)
  from public.khatmahs k
  where k.invite_code = btrim(p_invite_code);
$$;

-- Creates the group and its owner participant atomically.
create or replace function public.create_khatmah(
  p_title text,
  p_creator_display_name text,
  p_description text default null,
  p_started_at date default null,
  p_target_date date default null
)
returns table (id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_code text;
  v_attempt integer := 0;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if char_length(btrim(p_title)) not between 3 and 120 then
    raise exception 'Group name must be between 3 and 120 characters';
  end if;
  if char_length(btrim(p_creator_display_name)) not between 2 and 60 then
    raise exception 'Display name must be between 2 and 60 characters';
  end if;

  while v_attempt < 5 loop
    v_code := public.generate_invite_code();
    begin
      insert into public.khatmahs
        (title, description, creator_id, invite_code, started_at, target_date)
      values
        (btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''), v_user, v_code,
         p_started_at, p_target_date)
      returning id, invite_code into v_id, v_code;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
    end;
  end loop;

  if v_id is null then
    raise exception 'Could not generate a unique invitation code';
  end if;

  insert into public.khatmah_participants (khatmah_id, user_id, display_name, role)
  values (v_id, v_user, btrim(p_creator_display_name), 'owner');

  return query select v_id, v_code;
end;
$$;

-- Joins by invite code; identity comes from auth.uid(), never from the name.
create or replace function public.join_khatmah(p_invite_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_khatmah public.khatmahs%rowtype;
  v_participant_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if char_length(btrim(p_display_name)) not between 2 and 60 then
    raise exception 'Display name must be between 2 and 60 characters';
  end if;

  select * into v_khatmah
  from public.khatmahs
  where invite_code = btrim(p_invite_code);

  if not found then
    raise exception 'Invalid invitation link';
  end if;
  if v_khatmah.status <> 'active' then
    raise exception 'This Khatmah is no longer active';
  end if;
  if not v_khatmah.joining_open then
    raise exception 'The creator has closed joining';
  end if;

  begin
    insert into public.khatmah_participants (khatmah_id, user_id, display_name, role)
    values (v_khatmah.id, v_user, btrim(p_display_name), 'participant')
    returning id into v_participant_id;
  exception when unique_violation then
    select id into v_participant_id
    from public.khatmah_participants
    where khatmah_id = v_khatmah.id and user_id = v_user;
  end;

  return v_participant_id;
end;
$$;

-- Owner assigns or releases one uncompleted juz.
create or replace function public.assign_juz(p_juz_id uuid, p_participant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_juz public.khatmah_juz%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_juz from public.khatmah_juz where id = p_juz_id for update;
  if not found then
    raise exception 'Juz not found';
  end if;
  if not public.is_khatmah_owner(v_juz.khatmah_id) then
    raise exception 'Only the creator can assign juz';
  end if;
  if v_juz.status = 'completed' then
    raise exception 'Completed juz cannot be reassigned';
  end if;

  if p_participant_id is null then
    update public.khatmah_juz
    set assigned_to = null, status = 'available', completed_at = null,
        updated_by = auth.uid(), updated_at = now()
    where id = p_juz_id;
  else
    if not exists (
      select 1 from public.khatmah_participants
      where id = p_participant_id and khatmah_id = v_juz.khatmah_id
    ) then
      raise exception 'That participant is not in this Khatmah';
    end if;

    update public.khatmah_juz
    set assigned_to = p_participant_id, status = 'assigned', completed_at = null,
        updated_by = auth.uid(), updated_at = now()
    where id = p_juz_id;
  end if;
end;
$$;

-- Owner distributes available juz round-robin among current participants.
create or replace function public.auto_assign_juz(p_khatmah_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participants uuid[];
  v_total integer;
  v_index integer := 0;
  v_juz record;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.is_khatmah_owner(p_khatmah_id) then
    raise exception 'Only the creator can distribute juz';
  end if;

  select array_agg(id order by joined_at, id) into v_participants
  from public.khatmah_participants
  where khatmah_id = p_khatmah_id;

  v_total := coalesce(array_length(v_participants, 1), 0);
  if v_total = 0 then
    raise exception 'Add participants before distributing juz';
  end if;

  for v_juz in
    select id from public.khatmah_juz
    where khatmah_id = p_khatmah_id and status = 'available'
    order by juz_number
    for update
  loop
    update public.khatmah_juz
    set assigned_to = v_participants[(v_index % v_total) + 1],
        status = 'assigned',
        completed_at = null,
        updated_by = auth.uid(),
        updated_at = now()
    where id = v_juz.id;
    v_index := v_index + 1;
  end loop;
end;
$$;

-- A member may claim an available juz. Conditional update prevents races.
create or replace function public.self_select_juz(p_juz_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_khatmah_id uuid;
  v_participant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select khatmah_id into v_khatmah_id from public.khatmah_juz where id = p_juz_id;
  if v_khatmah_id is null then
    raise exception 'Juz not found';
  end if;

  select id into v_participant_id
  from public.khatmah_participants
  where khatmah_id = v_khatmah_id and user_id = auth.uid();
  if v_participant_id is null then
    raise exception 'Join the Khatmah before choosing a juz';
  end if;

  update public.khatmah_juz
  set assigned_to = v_participant_id, status = 'assigned', completed_at = null,
      updated_by = auth.uid(), updated_at = now()
  where id = p_juz_id and status = 'available' and assigned_to is null;

  if not found then
    raise exception 'That juz is no longer available';
  end if;
end;
$$;

-- Only the assignee can record progress. Corrections are allowed deliberately.
create or replace function public.set_juz_status(p_juz_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_juz public.khatmah_juz%rowtype;
  v_participant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_status not in ('assigned', 'in_progress', 'completed') then
    raise exception 'Invalid status';
  end if;

  select * into v_juz from public.khatmah_juz where id = p_juz_id for update;
  if not found then
    raise exception 'Juz not found';
  end if;

  select id into v_participant_id
  from public.khatmah_participants
  where khatmah_id = v_juz.khatmah_id and user_id = auth.uid();

  if v_participant_id is null or v_juz.assigned_to is distinct from v_participant_id then
    raise exception 'You can only update progress for your own juz';
  end if;
  if v_juz.status = 'completed' and p_status = 'completed' then
    return;
  end if;

  update public.khatmah_juz
  set status = p_status,
      completed_at = case when p_status = 'completed' then now() else null end,
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_juz_id;
end;
$$;

create or replace function public.set_joining_open(p_khatmah_id uuid, p_open boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.is_khatmah_owner(p_khatmah_id) then
    raise exception 'Only the creator can change joining settings';
  end if;

  update public.khatmahs
  set joining_open = p_open
  where id = p_khatmah_id;
end;
$$;

create or replace function public.list_my_khatmahs()
returns table (
  id uuid,
  title text,
  status text,
  invite_code text,
  participant_count integer,
  completed_count integer,
  viewer_role text,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    k.id,
    k.title,
    k.status,
    k.invite_code,
    (select count(*)::integer from public.khatmah_participants p where p.khatmah_id = k.id),
    (select count(*)::integer from public.khatmah_juz j
      where j.khatmah_id = k.id and j.status = 'completed'),
    (select p.role from public.khatmah_participants p
      where p.khatmah_id = k.id and p.user_id = auth.uid() limit 1),
    (select p.joined_at from public.khatmah_participants p
      where p.khatmah_id = k.id and p.user_id = auth.uid() limit 1)
  from public.khatmahs k
  where public.is_khatmah_member(k.id)
  order by (select p.joined_at from public.khatmah_participants p
    where p.khatmah_id = k.id and p.user_id = auth.uid() limit 1) desc;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on function public.generate_invite_code() from public, anon, authenticated;
revoke all on function public.is_khatmah_member(uuid) from public, anon;
revoke all on function public.is_khatmah_owner(uuid) from public, anon;
revoke all on function public.get_khatmah_preview(text) from public;
revoke all on function public.create_khatmah(text, text, text, date, date) from public;
revoke all on function public.join_khatmah(text, text) from public;
revoke all on function public.assign_juz(uuid, uuid) from public;
revoke all on function public.auto_assign_juz(uuid) from public;
revoke all on function public.self_select_juz(uuid) from public;
revoke all on function public.set_juz_status(uuid, text) from public;
revoke all on function public.set_joining_open(uuid, boolean) from public;
revoke all on function public.list_my_khatmahs() from public;

grant execute on function public.is_khatmah_member(uuid) to authenticated;
grant execute on function public.is_khatmah_owner(uuid) to authenticated;
grant execute on function public.get_khatmah_preview(text) to anon, authenticated;
grant execute on function public.create_khatmah(text, text, text, date, date) to authenticated;
grant execute on function public.join_khatmah(text, text) to authenticated;
grant execute on function public.assign_juz(uuid, uuid) to authenticated;
grant execute on function public.auto_assign_juz(uuid) to authenticated;
grant execute on function public.self_select_juz(uuid) to authenticated;
grant execute on function public.set_juz_status(uuid, text) to authenticated;
grant execute on function public.set_joining_open(uuid, boolean) to authenticated;
grant execute on function public.list_my_khatmahs() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (RLS still applies to subscribers)
-- ---------------------------------------------------------------------------

alter table public.khatmahs replica identity full;
alter table public.khatmah_participants replica identity full;
alter table public.khatmah_juz replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['khatmahs', 'khatmah_participants', 'khatmah_juz'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
