create table public.sales(
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null
        references public.businesses(id),
    
    menu uuid not null
        references public.menus(id),

    quantity integer not null
        check (quantity > 0),
    
    total_price integer not null
        check (total_price >= 0),
    
    sold_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);