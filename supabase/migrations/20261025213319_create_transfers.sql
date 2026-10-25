create table public.transfers (
  chain_id bigint not null,
  tx_hash text not null check (tx_hash ~ '^0x[0-9a-f]{64}$'),
  log_index integer not null check (log_index >= 0),
  token text not null,
  from_address text not null check (from_address ~ '^0x[0-9a-f]{40}$'),
  to_address text not null check (to_address ~ '^0x[0-9a-f]{40}$'),
  amount numeric(78, 0) not null check (amount >= 0),
  block_number bigint not null,
  block_hash text not null check (block_hash ~ '^0x[0-9a-f]{64}$'),
  block_time timestamptz not null,
  foreign key (chain_id, token) references public.tokens (chain_id, address),
  primary key (chain_id, tx_hash, log_index)
);

create index transfers_block_time_idx on public.transfers (block_time, log_index);

alter table public.transfers enable row level security;
revoke all on table public.transfers from anon, authenticated, service_role;
grant select, insert on table public.transfers to service_role;
grant select on table public.transfers to anon, authenticated;

create policy "Users can view transfers"
  on public.transfers for select
  to anon, authenticated
  using ( true );
