create extension if not exists moddatetime schema extensions;

create table public.indexer_state (
  chain_id bigint primary key,
  head_block bigint not null,
  head_block_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.indexer_state enable row level security;

revoke all on table public.indexer_state from anon, authenticated;
grant select on table public.indexer_state to anon, authenticated;

create policy "Users can view indexer state"
on public.indexer_state for select
to anon, authenticated
using ( true );

create trigger set_updated_at
  before update on public.indexer_state
  for each row
  execute function extensions.moddatetime(updated_at);
