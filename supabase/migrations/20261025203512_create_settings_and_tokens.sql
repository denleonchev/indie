create table public.settings (
  id boolean primary key default true check (id),
  retention_days integer not null check (retention_days > 0)
);
insert into public.settings (retention_days)
    values (30);
    
alter table public.settings enable row level security;
revoke all on table public.settings from anon, authenticated, service_role;
grant select on table public.settings to anon, authenticated, service_role;

create policy "Users can view settings"
  on public.settings for select
  to anon, authenticated
  using ( true );


create table public.tokens (
  chain_id bigint not null,
  address text not null check (address ~ '^0x[0-9a-f]{40}$'),
  symbol text not null,
  decimals smallint not null check (decimals between 0 and 255),
  primary key (chain_id, address)
);

alter table public.tokens enable row level security;
revoke all on table public.tokens from anon, authenticated, service_role;
grant select, insert on table public.tokens to service_role;
grant select on table public.tokens to anon, authenticated;

create policy "Users can view tokens"
  on public.tokens for select
  to anon, authenticated
  using ( true );
