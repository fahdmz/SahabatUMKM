create table public.menus(
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null
    references public.businesses(id)
    on delete cascade,

    name text not null,

    price integer not null
    check (price >= 0),

    is_active boolean null default true,
    created_at timestamptz not null default now()
);