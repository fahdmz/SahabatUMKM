alter table public.businesses
add column owner_id uuid
references auth.users(id)
on delete cascade;