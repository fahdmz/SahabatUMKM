create policy "Users can view their own expenses"
on public.expenses
for select
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = expenses.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can create expenses for their own business"
on public.expenses
for insert
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = expenses.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can update their own expenses"
on public.expenses
for update
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = expenses.business_id
          and businesses.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.businesses
        where businesses.id = expenses.business_id
          and businesses.owner_id = auth.uid()
    )
);

create policy "Users can delete their own expenses"
on public.expenses
for delete
using (
    exists (
        select 1
        from public.businesses
        where businesses.id = expenses.business_id
          and businesses.owner_id = auth.uid()
    )
);