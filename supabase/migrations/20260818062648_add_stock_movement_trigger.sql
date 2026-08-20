create or replace function public.handle_stock_movement()
returns trigger
language plpgsql
as $$
begin

    if NEW.movement_type = 'RESTOCK' then

        update public.inventory
        set stock = stock + NEW.quantity,
            updated_at = now()
        where business_id = NEW.business_id
          and menu_id = NEW.menu_id;

    elsif NEW.movement_type = 'SALE' then

        update public.inventory
        set stock = stock - NEW.quantity,
            updated_at = now()
        where business_id = NEW.business_id
          and menu_id = NEW.menu_id;

    elsif NEW.movement_type = 'WASTE' then

        update public.inventory
        set stock = stock - NEW.quantity,
            updated_at = now()
        where business_id = NEW.business_id
          and menu_id = NEW.menu_id;

    end if;

    return NEW;
end;
$$;

create trigger on_stock_movement_created
after insert on public.stock_movements
for each row
execute function public.handle_stock_movement();