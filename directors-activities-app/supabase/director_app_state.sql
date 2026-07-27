create table if not exists public.director_app_state (
  app_key text primary key,
  data jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists director_app_state_updated_at_idx
  on public.director_app_state (updated_at desc);

alter table public.director_app_state enable row level security;

drop policy if exists "director_app_state_service_role_all" on public.director_app_state;
create policy "director_app_state_service_role_all"
  on public.director_app_state
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
