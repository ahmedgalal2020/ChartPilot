create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  bull_color text not null default '#26A69A',
  bear_color text not null default '#EF5350',
  risk_per_trade numeric not null default 2,
  grid_lines boolean not null default true,
  show_telemetry boolean not null default true,
  theme text not null default 'dark',
  updated_at timestamptz not null default now()
);

create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  symbol text not null,
  timeframe text not null,
  type text not null,
  win_rate numeric not null default 0,
  total_pl text not null default 'N/A',
  status text not null default 'DRAFT',
  last_test text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  symbol text not null,
  timeframe text not null,
  range text,
  trades_count integer not null default 0,
  is_active boolean not null default false,
  image_url text,
  last_modified timestamptz not null default now()
);

create table if not exists public.backtest_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  symbol text not null,
  timeframe text not null,
  date_range text not null,
  total_trades integer not null default 0,
  win_rate numeric not null default 0,
  total_pl numeric not null default 0,
  rsi_length integer,
  ema_trigger integer,
  volatility_filter text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  backtest_session_id uuid not null references public.backtest_sessions(id) on delete cascade,
  type text not null,
  entry_price numeric not null,
  exit_price numeric not null,
  stop_loss numeric not null,
  take_profit numeric not null,
  profit_progress numeric not null default 0,
  date_time timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.strategies enable row level security;
alter table public.workspaces enable row level security;
alter table public.backtest_sessions enable row level security;
alter table public.trades enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "settings_all_own" on public.user_settings;
create policy "settings_all_own" on public.user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "strategies_all_own" on public.strategies;
create policy "strategies_all_own" on public.strategies for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "workspaces_all_own" on public.workspaces;
create policy "workspaces_all_own" on public.workspaces for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "backtests_all_own" on public.backtest_sessions;
create policy "backtests_all_own" on public.backtest_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "trades_all_own" on public.trades;
create policy "trades_all_own" on public.trades for all using (user_id = auth.uid()) with check (user_id = auth.uid());
