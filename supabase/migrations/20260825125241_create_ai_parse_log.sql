-- Storage for AI parse output: without this, a bad parse can't be debugged
-- and accuracy can't be measured. Append-only audit log — no update/delete
-- policy, only select/insert.

create table public.ai_parse_log (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    source text not null
        check (source in ('expense_text', 'receipt_photo')),

    raw_input text,
    raw_ai_response jsonb,
    confidence numeric,
    parsed_items jsonb,

    used_fallback boolean not null default false,

    created_at timestamptz not null default now()
);

alter table public.ai_parse_log enable row level security;

create policy "Users can view their own ai parse log"
    on public.ai_parse_log for select
    using (
        exists (
            select 1
            from public.businesses
            where businesses.id = ai_parse_log.business_id
              and businesses.owner_id = auth.uid()
        )
    );

create policy "Users can create ai parse log entries for their own business"
    on public.ai_parse_log for insert
    with check (
        exists (
            select 1
            from public.businesses
            where businesses.id = ai_parse_log.business_id
              and businesses.owner_id = auth.uid()
        )
    );
