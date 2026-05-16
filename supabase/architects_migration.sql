-- ============================================================
-- Nirman Hisaab — Architects module migration
-- Run this in Supabase SQL Editor before deploying the new app.
-- Safe to re-run (CREATE IF NOT EXISTS + DROP/CREATE POLICY).
-- ============================================================

create table if not exists architects (
  id                text        primary key,
  user_id           uuid        not null references auth.users(id) on delete cascade,
  name              text        not null default '',
  firm              text        default '',
  phone             text        default '',
  role              text        default 'Architect',
  fee_type          text        default 'package',     -- package | per-sqft | per-visit | percentage
  total_fee         numeric     default 0,
  rate_per_sq_ft    numeric,
  area_sq_ft        numeric,
  rate_per_visit    numeric,
  percentage_rate   numeric,
  project_value     numeric,
  package_visits    integer     default 0,
  extra_visit_rate  numeric     default 0,
  scope_notes       text        default '',
  start_date        text        default '',
  visits            jsonb       default '[]',
  deliverables      jsonb       default '[]',
  photos            jsonb       default '[]',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists architect_payments (
  id            text        primary key,
  architect_id  text        not null references architects(id) on delete cascade,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  date          text        default '',
  amount        numeric     default 0,
  note          text        default '',
  created_at    timestamptz default now()
);

-- ─── RLS ──────────────────────────────────────────────────────

alter table architects          enable row level security;
alter table architect_payments  enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['architects', 'architect_payments'];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists "select_own_or_viewer" on %I', tbl);
    execute format('drop policy if exists "insert_own"           on %I', tbl);
    execute format('drop policy if exists "update_own"           on %I', tbl);
    execute format('drop policy if exists "delete_own"           on %I', tbl);

    execute format(
      'create policy "select_own_or_viewer" on %I
       for select using (can_access_user_data(user_id))', tbl);

    execute format(
      'create policy "insert_own" on %I
       for insert with check (auth.uid() = user_id)', tbl);

    execute format(
      'create policy "update_own" on %I
       for update using (auth.uid() = user_id)', tbl);

    execute format(
      'create policy "delete_own" on %I
       for delete using (auth.uid() = user_id)', tbl);
  end loop;
end $$;
