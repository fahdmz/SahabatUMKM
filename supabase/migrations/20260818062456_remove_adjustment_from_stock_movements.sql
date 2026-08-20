alter table public.stock_movements
drop constraint stock_movements_movement_type_check;

alter table public.stock_movements
add constraint stock_movements_movement_type_check
check (movement_type in ('RESTOCK', 'SALE', 'WASTE'));