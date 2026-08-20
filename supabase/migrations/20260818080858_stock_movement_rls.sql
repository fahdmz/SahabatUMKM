create policy "Users can view their own stock movements"
on public.stock_movements
for select
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = stock_movements.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can create stock movements for their own business"
on public.stock_movements
for insert
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = stock_movements.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can update their own stock movements"
on public.stock_movements
for update
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = stock_movements.business_id
          and businesses.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = stock_movements.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can delete their own stock movements"
on public.stock_movements
for delete
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = stock_movements.business_id
          and businesses.owner_id = auth.uid()
    )
);