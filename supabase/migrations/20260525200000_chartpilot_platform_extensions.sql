create table if not exists public.symbols (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ticker text not null unique,
  category text not null,
  base_currency text,
  quote_currency text,
  tick_size numeric not null default 0.01,
  pip_size numeric not null default 0.0001,
  exchange text,
  source text not null default 'mock',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Default Watchlist',
  symbol_tickers text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chart_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null default 'Default Layout',
  symbol text not null,
  timeframe text not null,
  settings jsonb not null default '{}'::jsonb,
  panel_layout jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  backtest_session_id uuid references public.backtest_sessions(id) on delete cascade,
  type text not null,
  symbol text not null,
  timeframe text not null,
  points jsonb not null default '[]'::jsonb,
  text text,
  style jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.replay_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  backtest_session_id uuid not null unique references public.backtest_sessions(id) on delete cascade,
  symbol text not null,
  timeframe text not null,
  start_date timestamptz,
  current_index integer not null default 80,
  initial_balance numeric not null default 10000,
  current_balance numeric not null default 10000,
  speed numeric not null default 1,
  status text not null default 'paused',
  updated_at timestamptz not null default now()
);

create table if not exists public.trade_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete cascade,
  backtest_session_id uuid references public.backtest_sessions(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  backtest_session_id uuid not null unique references public.backtest_sessions(id) on delete cascade,
  net_pl numeric not null default 0,
  win_rate numeric not null default 0,
  average_r numeric not null default 0,
  max_drawdown numeric not null default 0,
  profit_factor numeric not null default 0,
  trade_count integer not null default 0,
  equity_curve jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.trades
  add column if not exists symbol text,
  add column if not exists position_size numeric not null default 1,
  add column if not exists risk_amount numeric not null default 0,
  add column if not exists risk_percent numeric not null default 0,
  add column if not exists r_multiple numeric not null default 0,
  add column if not exists status text not null default 'closed',
  add column if not exists close_reason text;

alter table public.user_settings
  add column if not exists default_initial_balance numeric not null default 10000,
  add column if not exists default_timeframe text not null default '1h',
  add column if not exists default_symbol text not null default 'BTCUSD';

alter table public.workspaces
  add column if not exists layout jsonb not null default '{}'::jsonb,
  add column if not exists watchlist text[] not null default array['BTCUSD','ETHUSD','EURUSD','XAUUSD'];

alter table public.symbols enable row level security;
alter table public.watchlists enable row level security;
alter table public.chart_layouts enable row level security;
alter table public.drawings enable row level security;
alter table public.replay_states enable row level security;
alter table public.trade_notes enable row level security;
alter table public.performance_metrics enable row level security;

drop policy if exists "symbols_read_active" on public.symbols;
create policy "symbols_read_active" on public.symbols for select using (active = true);

drop policy if exists "watchlists_all_own" on public.watchlists;
create policy "watchlists_all_own" on public.watchlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "chart_layouts_all_own" on public.chart_layouts;
create policy "chart_layouts_all_own" on public.chart_layouts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "drawings_all_own" on public.drawings;
create policy "drawings_all_own" on public.drawings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "replay_states_all_own" on public.replay_states;
create policy "replay_states_all_own" on public.replay_states for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "trade_notes_all_own" on public.trade_notes;
create policy "trade_notes_all_own" on public.trade_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "performance_metrics_all_own" on public.performance_metrics;
create policy "performance_metrics_all_own" on public.performance_metrics for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.symbols (name, ticker, category, base_currency, quote_currency, tick_size, pip_size, exchange, source, active)
values
  ('Euro / US Dollar', 'EURUSD', 'forex', 'EUR', 'USD', 0.00001, 0.0001, 'FX', 'mock', true),
  ('British Pound / US Dollar', 'GBPUSD', 'forex', 'GBP', 'USD', 0.00001, 0.0001, 'FX', 'mock', true),
  ('US Dollar / Japanese Yen', 'USDJPY', 'forex', 'USD', 'JPY', 0.001, 0.01, 'FX', 'mock', true),
  ('US Dollar / Swiss Franc', 'USDCHF', 'forex', 'USD', 'CHF', 0.00001, 0.0001, 'FX', 'mock', true),
  ('Australian Dollar / US Dollar', 'AUDUSD', 'forex', 'AUD', 'USD', 0.00001, 0.0001, 'FX', 'mock', true),
  ('US Dollar / Canadian Dollar', 'USDCAD', 'forex', 'USD', 'CAD', 0.00001, 0.0001, 'FX', 'mock', true),
  ('New Zealand Dollar / US Dollar', 'NZDUSD', 'forex', 'NZD', 'USD', 0.00001, 0.0001, 'FX', 'mock', true),
  ('Bitcoin / US Dollar', 'BTCUSD', 'crypto', 'BTC', 'USD', 0.01, 0.01, 'Crypto Composite', 'mock', true),
  ('Ethereum / US Dollar', 'ETHUSD', 'crypto', 'ETH', 'USD', 0.01, 0.01, 'Crypto Composite', 'mock', true),
  ('Solana / US Dollar', 'SOLUSD', 'crypto', 'SOL', 'USD', 0.01, 0.01, 'Crypto Composite', 'mock', true),
  ('XRP / US Dollar', 'XRPUSD', 'crypto', 'XRP', 'USD', 0.0001, 0.0001, 'Crypto Composite', 'mock', true),
  ('NASDAQ 100', 'NASDAQ', 'index', 'NASDAQ', 'USD', 0.25, 0.25, 'Index CFD', 'mock', true),
  ('S&P 500', 'SPX500', 'index', 'SPX', 'USD', 0.25, 0.25, 'Index CFD', 'mock', true),
  ('DAX 40', 'DAX', 'index', 'DAX', 'EUR', 0.5, 0.5, 'Index CFD', 'mock', true),
  ('Dow Jones Industrial Average', 'DJI', 'index', 'DJI', 'USD', 1, 1, 'Index CFD', 'mock', true),
  ('Gold Spot / US Dollar', 'XAUUSD', 'commodity', 'XAU', 'USD', 0.01, 0.1, 'Metals CFD', 'mock', true),
  ('Silver Spot / US Dollar', 'XAGUSD', 'commodity', 'XAG', 'USD', 0.001, 0.01, 'Metals CFD', 'mock', true),
  ('WTI Crude Oil', 'WTI', 'commodity', 'WTI', 'USD', 0.01, 0.01, 'Energy CFD', 'mock', true)
on conflict (ticker) do update set
  name = excluded.name,
  category = excluded.category,
  base_currency = excluded.base_currency,
  quote_currency = excluded.quote_currency,
  tick_size = excluded.tick_size,
  pip_size = excluded.pip_size,
  exchange = excluded.exchange,
  source = excluded.source,
  active = excluded.active;
