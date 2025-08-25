create table public.products (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  sku text not null,
  price numeric not null,
  description text not null,
  is_active boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  size text not null default ''::text,
  colors text[] not null,
  product_type text not null default ''::text,
  tax numeric(10, 2) not null default 0.00,
  subtotal numeric(10, 2) not null default 0.00,
  constraint products_pkey primary key (id),
  constraint check_price_equals_subtotal_plus_tax check ((abs((price - (subtotal + tax))) < 0.01))
) TABLESPACE pg_default;

create index IF not exists idx_products_active_created on public.products using btree (is_active, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_products_id_active on public.products using btree (id, is_active) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists idx_products_name on public.products using btree (name) TABLESPACE pg_default;

create index IF not exists idx_products_sku on public.products using btree (sku) TABLESPACE pg_default;

create index IF not exists idx_products_inventory_join on public.products using btree (id, is_active, name) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists idx_products_listing_cover on public.products using btree (is_active, created_at desc) INCLUDE (id, name, sku, price, description) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists idx_products_active_only on public.products using btree (created_at desc, id) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists idx_products_tax on public.products using btree (tax) TABLESPACE pg_default;

create index IF not exists idx_products_subtotal on public.products using btree (subtotal) TABLESPACE pg_default;
