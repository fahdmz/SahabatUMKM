create view public.inventory_attention as
select
    inventory.id,
    inventory.business_id,
    inventory.menu_id,
    menus.name as menu_name,
    inventory.stock,
    inventory.minimum_stock,
    inventory.minimum_stock - inventory.stock as shortage
from public.inventory
join public.menus
    on inventory.menu_id = menus.id
where inventory.stock <= inventory.minimum_stock;