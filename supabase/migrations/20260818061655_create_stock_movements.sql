create table public.stock_movements(
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    menu_id uuid not null
        references public.menus(id)
        on delete cascade,

    movement_type text not null
        check (movement_type in ('RESTOCK', 'SALE', 'WASTE', 'ADJUSTMENT')),
    
    quantity integer not null
        check (quantity > 0),

    note text,

    created_at timestamptz not null default now()
);