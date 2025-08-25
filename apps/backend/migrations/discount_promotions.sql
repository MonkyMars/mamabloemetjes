create table public.discount_promotions (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  product_ids uuid[] not null,
  discount_percentage numeric not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  updated_at timestamp with time zone not null default now(),
  constraint discount_promotions_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_discount_promotions_active on public.discount_promotions using btree (start_date, end_date) TABLESPACE pg_default;

create index IF not exists idx_discount_promotions_dates on public.discount_promotions using btree (start_date, end_date) TABLESPACE pg_default;

create index IF not exists idx_discount_promotions_product_ids on public.discount_promotions using gin (product_ids) TABLESPACE pg_default;
