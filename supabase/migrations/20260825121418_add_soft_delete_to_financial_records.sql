-- Financial records must be soft-deleted, never hard-deleted (project rule).
-- "Delete" on a transaction in the UI sets deleted_at instead of removing
-- the row; every read query filters deleted_at is null.

alter table public.sales
    add column deleted_at timestamptz;

alter table public.expenses
    add column deleted_at timestamptz;
