create policy "Users can view their own sales"
on public.sales
for select
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = sales.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can create sales for their own business"
on public.sales
for insert
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = sales.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can update their own sales"
on public.sales
for update
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = sales.business_id
          and businesses.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = sales.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can delete their own sales"
on public.sales
for delete
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = sales.business_id
          and businesses.owner_id = auth.uid()
    )
);