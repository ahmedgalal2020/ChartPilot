alter table public.profiles
  add column if not exists role text not null default 'USER',
  add column if not exists status text not null default 'active',
  add column if not exists last_login_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('USER', 'ADMIN'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check check (status in ('active', 'inactive', 'suspended'));
  end if;
end $$;

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role = 'ADMIN'
      and status = 'active'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_name text not null default 'Free',
  status text not null default 'free' check (status in ('free', 'paid', 'trial', 'cancelled', 'past_due')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  provider text not null default 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('paid', 'failed', 'pending', 'refunded')),
  provider text not null default 'manual',
  provider_payment_id text,
  plan_name text,
  invoice_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null unique,
  amount numeric not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('paid', 'failed', 'pending', 'refunded', 'void')),
  invoice_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_created_at_idx on public.payments(created_at desc);
create index if not exists invoices_user_id_idx on public.invoices(user_id);
create index if not exists invoices_created_at_idx on public.invoices(created_at desc);

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.is_admin(auth.uid()));

drop policy if exists "profiles_admin_update_all" on public.profiles;
create policy "profiles_admin_update_all" on public.profiles
  for update using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = auth.uid());

drop policy if exists "subscriptions_admin_all" on public.subscriptions;
create policy "subscriptions_admin_all" on public.subscriptions
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using (user_id = auth.uid());

drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all" on public.payments
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own" on public.invoices
  for select using (user_id = auth.uid());

drop policy if exists "invoices_admin_all" on public.invoices;
create policy "invoices_admin_all" on public.invoices
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
