create table public.inventory(
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    menu_id uuid not null
        references public.menus(id)
        on delete cascade,

    stock integer not null default 0
        check (stock >= 0),
    
    minimum_stock integer not null default 0
        check (minimum_stock >= 0),

    updated_at timestamptz not null default now(),

    unique (business_id, menu_id)
);