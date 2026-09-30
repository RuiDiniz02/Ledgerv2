grant delete on public.ledger_accounts to authenticated;
create policy "Delete own ledger" on public.ledger_accounts
  for delete to authenticated
  using ((select auth.uid()) = user_id);
