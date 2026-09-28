create table public.ledger_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision integer not null default 1 check (revision > 0),
 document jsonb not null check (
   jsonb_typeof(document) = 'object'
   and document ?& array['income','categories','months','movements','started']
   and jsonb_typeof(document->'categories') = 'array'
   and jsonb_typeof(document->'months') = 'object'
   and jsonb_typeof(document->'movements') = 'array'
   and octet_length(document::text) <= 1500000
 ),
 updated_at timestamptz not null default now()
);
alter table public.ledger_accounts enable row level security;
revoke all on public.ledger_accounts from anon, authenticated;
grant select, insert, update on public.ledger_accounts to authenticated;
create policy "Read own ledger" on public.ledger_accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own ledger" on public.ledger_accounts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own ledger" on public.ledger_accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
