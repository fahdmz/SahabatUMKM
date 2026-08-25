-- `cash_entries` already existed on the remote database (with RLS and three
-- policies) but was never captured in any migration -- it was created
-- directly against the database (dashboard/SQL editor), not through this
-- migrations directory. Discovered while retesting MulaiCatat.jsx's "quick
-- cash entry" save path, which the audit had assumed was broken because the
-- table appeared nowhere in version control.
--
-- Written idempotently: a no-op on this (already-drifted) remote, but
-- creates the real schema on any fresh environment built from migrations
-- alone (a new remote project, `supabase db reset`, etc.), so the
-- migrations directory becomes the actual source of truth again.
--
-- Note: unlike every other table, this one has no UPDATE policy (only
-- select/insert/delete) -- left as-is here since this migration only
-- records what already exists; worth a deliberate decision later on
-- whether cash entries should be editable.

create table if not exists public.cash_entries (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    amount numeric not null
        check (amount > 0),

    created_at timestamptz not null default now()
);

alter table public.cash_entries enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policy
        where polrelid = 'public.cash_entries'::regclass
          and polname = 'Users can view their own cash entries'
    ) then
        create policy "Users can view their own cash entries"
            on public.cash_entries for select
            using (
                business_id in (
                    select id from public.businesses where owner_id = auth.uid()
                )
            );
    end if;

    if not exists (
        select 1 from pg_policy
        where polrelid = 'public.cash_entries'::regclass
          and polname = 'Users can insert their own cash entries'
    ) then
        create policy "Users can insert their own cash entries"
            on public.cash_entries for insert
            with check (
                business_id in (
                    select id from public.businesses where owner_id = auth.uid()
                )
            );
    end if;

    if not exists (
        select 1 from pg_policy
        where polrelid = 'public.cash_entries'::regclass
          and polname = 'Users can delete their own cash entries'
    ) then
        create policy "Users can delete their own cash entries"
            on public.cash_entries for delete
            using (
                business_id in (
                    select id from public.businesses where owner_id = auth.uid()
                )
            );
    end if;
end $$;
