create table public.expenses(
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

        description text not null,

        amount integer not null
        check (amount > 0),

        spent_at timestamptz not null default now(),

        created_at timestamptz not null default now()
);