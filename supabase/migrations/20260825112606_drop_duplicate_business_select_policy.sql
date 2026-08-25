-- This policy existed on the remote database but was never captured in a
-- migration (added directly via dashboard/SQL editor). It is functionally
-- identical to "own business: select" added in the previous migration
-- (both: owner_id = auth.uid()), so this is pure cleanup, not a security
-- change — dropping the untracked duplicate to bring the schema and the
-- migrations directory back in sync.

drop policy if exists "Users can view their own business" on public.businesses;
