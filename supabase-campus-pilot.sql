-- π搭子校内封闭试点数据库
-- 新建 campus_* 表，不修改当前演示表。
-- 面向已通过 Supabase Auth 校内邮箱验证的试点用户。

create extension if not exists pgcrypto;

create table if not exists campus_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'π同学',
  avatar text not null default '',
  college text not null default '',
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  available_time text not null default '',
  campus_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campus_moderators (
  user_id uuid primary key references campus_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_campus_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.campus_profiles (id, nickname, campus_verified)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nickname', ''), split_part(new.email, '@', 1), 'π同学'),
    coalesce(new.is_anonymous, false)
      or coalesce(new.email ~* '@((stu|mail)\.)?xidian\.edu\.cn$', false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created_create_campus_profile
  after insert on auth.users
  for each row execute function public.handle_new_campus_user();

insert into campus_profiles (id, nickname, campus_verified)
select id,
       coalesce(nullif(raw_user_meta_data->>'nickname', ''), split_part(email, '@', 1), 'π同学'),
       coalesce(is_anonymous, false) or coalesce(email ~* '@((stu|mail)\.)?xidian\.edu\.cn$', false)
from auth.users
on conflict (id) do nothing;

create table if not exists campus_demands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references campus_profiles(id) on delete cascade,
  category text not null check (category in ('contest', 'study', 'sports', 'food', 'other')),
  title text not null check (char_length(title) between 2 and 60),
  description text not null check (char_length(description) between 5 and 1000),
  skills text[] not null default '{}',
  missing_roles text[] not null default '{}',
  available_time text not null default '',
  meeting_place text not null default '',
  expires_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'matched', 'closed', 'expired')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create table if not exists campus_invites (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references campus_demands(id) on delete cascade,
  from_user_id uuid not null references campus_profiles(id) on delete cascade,
  to_user_id uuid not null references campus_profiles(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_user_id <> to_user_id),
  unique (demand_id, from_user_id, to_user_id)
);

create table if not exists campus_messages (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references campus_invites(id) on delete cascade,
  sender_id uuid not null references campus_profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists campus_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references campus_profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'demand', 'invite', 'message')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 2 and 500),
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists campus_credit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references campus_profiles(id) on delete cascade,
  invite_id uuid references campus_invites(id) on delete set null,
  delta integer not null check (delta between -20 and 10),
  reason text not null,
  created_by uuid references campus_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table campus_profiles enable row level security;
alter table campus_moderators enable row level security;
alter table campus_demands enable row level security;
alter table campus_invites enable row level security;
alter table campus_messages enable row level security;
alter table campus_reports enable row level security;
alter table campus_credit_events enable row level security;

create policy "campus profiles visible to verified users"
  on campus_profiles for select to authenticated
  using (campus_verified = true);

create policy "campus users update own profile"
  on campus_profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "campus users create own profile"
  on campus_profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "moderators can read own role"
  on campus_moderators for select to authenticated
  using (auth.uid() = user_id);

create policy "approved open demands visible"
  on campus_demands for select to authenticated
  using (moderation_status = 'approved' or owner_id = auth.uid());

create policy "verified users create own demands"
  on campus_demands for insert to authenticated
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from campus_profiles p
      where p.id = auth.uid() and p.campus_verified = true
    )
  );

create policy "owners update own demands"
  on campus_demands for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "moderators read all demands"
  on campus_demands for select to authenticated
  using (exists (select 1 from campus_moderators m where m.user_id = auth.uid()));

create policy "moderators update demand review"
  on campus_demands for update to authenticated
  using (exists (select 1 from campus_moderators m where m.user_id = auth.uid()))
  with check (exists (select 1 from campus_moderators m where m.user_id = auth.uid()));

create policy "invite participants can read"
  on campus_invites for select to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "verified users create own invites"
  on campus_invites for insert to authenticated
  with check (
    auth.uid() = from_user_id
    and exists (
      select 1 from campus_profiles p
      where p.id = auth.uid() and p.campus_verified = true
    )
  );

create policy "invite participants update status"
  on campus_invites for update to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id)
  with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "accepted invite participants read messages"
  on campus_messages for select to authenticated
  using (exists (
    select 1 from campus_invites i
    where i.id = invite_id
      and i.status in ('accepted', 'completed')
      and auth.uid() in (i.from_user_id, i.to_user_id)
  ));

create policy "accepted invite participants send messages"
  on campus_messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from campus_invites i
      where i.id = invite_id
        and i.status in ('accepted', 'completed')
        and auth.uid() in (i.from_user_id, i.to_user_id)
    )
  );

create policy "users create own reports"
  on campus_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

create policy "users view own reports"
  on campus_reports for select to authenticated
  using (auth.uid() = reporter_id);

create policy "moderators read reports"
  on campus_reports for select to authenticated
  using (exists (select 1 from campus_moderators m where m.user_id = auth.uid()));

create policy "moderators update reports"
  on campus_reports for update to authenticated
  using (exists (select 1 from campus_moderators m where m.user_id = auth.uid()))
  with check (exists (select 1 from campus_moderators m where m.user_id = auth.uid()));

create policy "users view own credit events"
  on campus_credit_events for select to authenticated
  using (auth.uid() = user_id);

create index if not exists idx_campus_demands_open
  on campus_demands(status, moderation_status, expires_at, created_at desc);
create index if not exists idx_campus_demands_owner on campus_demands(owner_id);
create index if not exists idx_campus_invites_from on campus_invites(from_user_id, created_at desc);
create index if not exists idx_campus_invites_to on campus_invites(to_user_id, created_at desc);
create index if not exists idx_campus_messages_invite on campus_messages(invite_id, created_at);
create index if not exists idx_campus_reports_status on campus_reports(status, created_at);
create index if not exists idx_campus_credit_user on campus_credit_events(user_id, created_at desc);

-- 执行完脚本后，把首位审核员的账号 ID 写入下方语句再执行一次：
-- insert into campus_moderators(user_id) values ('审核员的 auth.users.id') on conflict do nothing;

