create policy "Users can view their own menus"
on public.menus
for select
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = menus.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can create menus for their own business"
on public.menus
for insert
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = menus.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can update their own menus"
on public.menus
for update
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = menus.business_id
          and businesses.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = menus.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can delete their own menus"
on public.menus
for delete
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = menus.business_id
          and businesses.owner_id = auth.uid()
    )
);