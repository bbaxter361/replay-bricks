create table if not exists public.spring_watchdog_incidents (
  id text primary key,
  kind text not null,
  status text not null,
  occurred_at timestamptz not null,
  total_checks integer not null default 0,
  failed_count integer not null default 0,
  failed_names text[] not null default '{}',
  failed_checks jsonb not null default '[]'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  alert_attempted boolean not null default false,
  alert_delivered boolean not null default false,
  alert_detail text not null default '',
  raw jsonb not null default '{}'::jsonb
);

create index if not exists spring_watchdog_incidents_occurred_at_idx
  on public.spring_watchdog_incidents (occurred_at desc);
