create or replace function public.handle_stock_movement()
returns trigger
language plpgsql
as $$
declare
    current_stock integer;
begin
-- Get the current stock
    select stock
    into current_stock
    from public.inventory
    where business_id = NEW.business_id
      and menu_id = NEW.menu_id
    for update;


    -- Make sure the inventory record exists
    if current_stock is null then
        raise exception 'Inventory record not found for menu %', NEW.menu_id;
    end if;


    -- RESTOCK
    if NEW.movement_type = 'RESTOCK' then

        update public.inventory
        set stock = stock + NEW.quantity,
            updated_at = now()
        where business_id = NEW.business_id
          and menu_id = NEW.menu_id;


    -- SALE
    elsif NEW.movement_type = 'SALE' then

        if current_stock < NEW.quantity then
            raise exception
                'Not enough stock. Current stock: %, requested: %',
                current_stock,
                NEW.quantity;
        end if;

        update public.inventory
        set stock = stock - NEW.quantity,
            updated_at = now()
        where business_id = NEW.business_id
          and menu_id = NEW.menu_id;


    -- WASTE
    elsif NEW.movement_type = 'WASTE' then

        if current_stock < NEW.quantity then
            raise exception
                'Not enough stock for waste. Current stock: %, requested: %',
                current_stock,
                NEW.quantity;
        end if;

        update public.inventory
        set stock = stock - NEW.quantity,
            updated_at = now()
        where business_id = NEW.business_id
          and menu_id = NEW.menu_id;

    end if;


    return NEW;
end;
$$;