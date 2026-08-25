-- Every other table got four RLS policies (select/insert/update/delete).
-- This one never did. With RLS enabled and zero policies, Postgres denies
-- all access by default, so every authenticated user's business row was
-- unreadable and uncreatable through the app.

create policy "own business: select"
  on public.businesses for select
  using (owner_id = auth.uid());

create policy "own business: insert"
  on public.businesses for insert
  with check (owner_id = auth.uid());

create policy "own business: update"
  on public.businesses for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "own business: delete"
  on public.businesses for delete
  using (owner_id = auth.uid());

-- A business with no owner is unreachable by anyone (RLS above would deny
-- every row-level operation on it). No orphan rows exist today, so this is
-- safe to enforce going forward.
alter table public.businesses
  alter column owner_id set not null;
