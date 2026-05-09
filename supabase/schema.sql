-- ============================================================
-- Nirman Hisaab — Normalized Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Helper: check if calling user can access data belonging to data_user_id
-- (either it's their own data, or they are a viewer linked to that owner)
create or replace function can_access_user_data(data_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select
    auth.uid() = data_user_id
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role = 'viewer'
        and data_owner_id = data_user_id
    )
$$;

-- ─── Tables ──────────────────────────────────────────────────

create table if not exists projects (
  id            text        primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  name          text        not null default '',
  location      text        default '',
  type          text        default 'residential',
  budget        numeric     default 0,
  master_budget numeric     default 0,
  start_date    text        default '',
  end_date      text        default '',
  plot_length   numeric,
  plot_width    numeric,
  floors        integer,
  total_area    numeric,
  site_plans    jsonb       default '[]',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists materials (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null default '',
  unit        text        default '',
  purchased   numeric     default 0,
  used        numeric     default 0,
  rate        numeric     default 0,
  vendor      text        default '',
  date        text        default '',
  bill_number text        default '',
  min_stock   numeric     default 0,
  photos      jsonb       default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists labours (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  type        text        default '',
  daily_wage  numeric     default 0,
  attendance  jsonb       default '{}',
  payment_by  text        default 'self',
  created_at  timestamptz default now()
);

create table if not exists labour_day_entries (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  date        text        not null,
  worker_type text        default '',
  count       integer     default 0,
  daily_wage  numeric     default 0,
  day_type    text        default 'full',
  payment_by  text        default 'self',
  notes       text        default '',
  expense_id  text,
  created_at  timestamptz default now()
);

create table if not exists thekas (
  id             text        primary key,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  name           text        not null default '',
  work_type      text        default 'Civil',
  total_amount   numeric     default 0,
  start_date     text        default '',
  notes          text        default '',
  rate_per_sq_ft numeric,
  area_sq_ft     numeric,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table if not exists theka_payments (
  id        text        primary key,
  theka_id  text        not null references thekas(id) on delete cascade,
  user_id   uuid        not null references auth.users(id) on delete cascade,
  date      text        default '',
  amount    numeric     default 0,
  note      text        default '',
  created_at timestamptz default now()
);

create table if not exists demolition_thekas (
  id           text        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null default '',
  work_type    text        default 'Tod-Phod',
  total_amount numeric     default 0,
  start_date   text        default '',
  notes        text        default '',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists demolition_theka_payments (
  id                   text        primary key,
  demolition_theka_id  text        not null references demolition_thekas(id) on delete cascade,
  user_id              uuid        not null references auth.users(id) on delete cascade,
  date                 text        default '',
  amount               numeric     default 0,
  note                 text        default '',
  created_at           timestamptz default now()
);

create table if not exists expenses (
  id         text        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       text        not null,
  amount     numeric     default 0,
  category   text        default 'Misc',
  notes      text        default '',
  photos     jsonb       default '[]',
  created_at timestamptz default now()
);

create table if not exists misc_expenses (
  id         text        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       text        not null,
  amount     numeric     default 0,
  category   text        default '',
  notes      text        default '',
  created_at timestamptz default now()
);

create table if not exists milestones (
  id           text        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  phase        text        not null,
  status       text        default 'pending',
  delay_reason text,
  start_date   text,
  end_date     text,
  photos       jsonb       default '[]',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists demolition_projects (
  id         text        primary key,
  user_id    uuid        not null unique references auth.users(id) on delete cascade,
  name       text        default '',
  type       text        default '',
  start_date text        default '',
  end_date   text        default '',
  area       numeric     default 0,
  created_at timestamptz default now()
);

create table if not exists brick_recovery (
  id             text        primary key,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  date           text        default '',
  estimated      integer     default 0,
  recovered      integer     default 0,
  broken         integer     default 0,
  rate_per_brick numeric     default 0,
  created_at     timestamptz default now()
);

create table if not exists malwa_entries (
  id            text        primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  date          text        default '',
  generated     numeric     default 0,
  disposed      numeric     default 0,
  cost_per_trip numeric     default 0,
  vendor        text        default '',
  created_at    timestamptz default now()
);

create table if not exists scrap_entries (
  id         text        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       text        default '',
  type       text        default '',
  quantity   numeric     default 0,
  unit       text        default '',
  dealer     text        default '',
  rate       numeric     default 0,
  created_at timestamptz default now()
);

create table if not exists vendors (
  id           text        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null default '',
  type         text        default '',
  phone        text        default '',
  total_billed numeric     default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists vendor_payments (
  id         text        primary key,
  vendor_id  text        not null references vendors(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       text        default '',
  amount     numeric     default 0,
  type       text        default 'payment',
  note       text        default '',
  created_at timestamptz default now()
);

create table if not exists rentals (
  id                      text        primary key,
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  name                    text        not null default '',
  type                    text        default 'Other',
  monthly_rent            numeric     default 0,
  deposit                 numeric     default 0,
  deposit_status          text        default 'pending',
  owner_name              text        default '',
  owner_phone             text        default '',
  start_date              text        default '',
  agreement_end_date      text        default '',
  agreement_note          text        default '',
  has_electricity         boolean     default false,
  electricity_rate_per_unit numeric,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create table if not exists rent_payments (
  id                text        primary key,
  rental_id         text        not null references rentals(id) on delete cascade,
  user_id           uuid        not null references auth.users(id) on delete cascade,
  date              text        default '',
  amount            numeric     default 0,
  month             text        default '',
  note              text        default '',
  paid_from_deposit boolean     default false,
  created_at        timestamptz default now()
);

create table if not exists electricity_readings (
  id               text        primary key,
  rental_id        text        not null references rentals(id) on delete cascade,
  user_id          uuid        not null references auth.users(id) on delete cascade,
  date             text        default '',
  current_reading  numeric     default 0,
  previous_reading numeric     default 0,
  rate_per_unit    numeric     default 0,
  fixed_charge     numeric     default 0,
  note             text        default '',
  paid             boolean     default false,
  created_at       timestamptz default now()
);

create table if not exists diary_entries (
  id         text        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       text        not null,
  weather    text,
  who_came   text        default '',
  work_done  text        default '',
  delivered  text        default '',
  problems   text        default '',
  photos     jsonb       default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Enable Row Level Security ────────────────────────────────

alter table projects                 enable row level security;
alter table materials                enable row level security;
alter table labours                  enable row level security;
alter table labour_day_entries       enable row level security;
alter table thekas                   enable row level security;
alter table theka_payments           enable row level security;
alter table demolition_thekas        enable row level security;
alter table demolition_theka_payments enable row level security;
alter table expenses                 enable row level security;
alter table misc_expenses            enable row level security;
alter table milestones               enable row level security;
alter table demolition_projects      enable row level security;
alter table brick_recovery           enable row level security;
alter table malwa_entries            enable row level security;
alter table scrap_entries            enable row level security;
alter table vendors                  enable row level security;
alter table vendor_payments          enable row level security;
alter table rentals                  enable row level security;
alter table rent_payments            enable row level security;
alter table electricity_readings     enable row level security;
alter table diary_entries            enable row level security;

-- ─── RLS Policies ─────────────────────────────────────────────
-- Pattern: owners can SELECT/INSERT/UPDATE/DELETE their own rows.
--          viewers can only SELECT their linked owner's rows.

do $$
declare
  tbl text;
  tables text[] := array[
    'projects', 'materials', 'labours', 'labour_day_entries',
    'thekas', 'theka_payments', 'demolition_thekas', 'demolition_theka_payments',
    'expenses', 'misc_expenses', 'milestones', 'demolition_projects',
    'brick_recovery', 'malwa_entries', 'scrap_entries',
    'vendors', 'vendor_payments',
    'rentals', 'rent_payments', 'electricity_readings',
    'diary_entries'
  ];
begin
  foreach tbl in array tables loop
    -- Drop existing policies to avoid conflicts on re-run
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
