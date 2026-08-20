create policy "Users can view their own inventory"
on public.inventory
for select
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = inventory.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can create inventory for their own business"
on public.inventory
for insert
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = inventory.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can update their own inventory"
on public.inventory
for update
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = inventory.business_id
          and businesses.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = inventory.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can delete their own inventory"
on public.inventory
for delete
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = inventory.business_id
          and businesses.owner_id = auth.uid()
    )
);