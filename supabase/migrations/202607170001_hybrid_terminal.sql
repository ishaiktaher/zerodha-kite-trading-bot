create schema if not exists zeta_gain;

create table if not exists zeta_gain.users (
  kite_user_id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists zeta_gain.filters (
  id uuid primary key,
  user_id text not null references zeta_gain.users(kite_user_id) on delete cascade,
  name text not null,
  conditions jsonb not null default '[]',
  condition_logic text not null default 'AND' check (condition_logic in ('AND', 'OR')),
  universe text not null default 'NIFTY_50',
  timeframe text not null default 'day',
  run_daily_at time,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists filters_user_id_idx on zeta_gain.filters(user_id);
create index if not exists filters_schedule_idx on zeta_gain.filters(is_active, run_daily_at) where is_active;

create table if not exists zeta_gain.scan_runs (
  id bigint generated always as identity primary key,
  filter_id uuid not null references zeta_gain.filters(id) on delete cascade,
  run_at timestamptz not null default now(),
  matched_symbols jsonb not null default '[]',
  status text not null check (status in ('running', 'completed', 'failed')),
  error text
);
create index if not exists scan_runs_filter_time_idx on zeta_gain.scan_runs(filter_id, run_at desc);

create table if not exists zeta_gain.watchlists (
  id uuid primary key,
  user_id text not null references zeta_gain.users(kite_user_id) on delete cascade,
  name text not null,
  symbols jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists watchlists_user_id_idx on zeta_gain.watchlists(user_id);

create table if not exists zeta_gain.alerts (
  id uuid primary key,
  filter_id uuid not null references zeta_gain.filters(id) on delete cascade,
  user_id text not null references zeta_gain.users(kite_user_id) on delete cascade,
  channel text not null check (channel in ('in-app', 'email', 'webhook')),
  destination text,
  is_active boolean not null default true,
  last_triggered_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists alerts_user_active_idx on zeta_gain.alerts(user_id, is_active);

create table if not exists zeta_gain.orders_log (
  id bigint generated always as identity primary key,
  user_id text not null references zeta_gain.users(kite_user_id) on delete cascade,
  kite_order_id text,
  symbol text not null,
  side text not null check (side in ('BUY', 'SELL')),
  qty integer not null check (qty > 0),
  price numeric,
  order_type text not null,
  product text not null,
  status text not null,
  action text not null check (action in ('PLACE', 'MODIFY', 'CANCEL')),
  placed_at timestamptz not null default now()
);
create index if not exists orders_log_user_time_idx on zeta_gain.orders_log(user_id, placed_at desc);

-- The app uses a server-only pooled Postgres connection. Keep these tables out
-- of Supabase's public Data API and revoke implicit access as defense in depth.
revoke all on schema zeta_gain from anon, authenticated;
revoke all on all tables in schema zeta_gain from anon, authenticated;
