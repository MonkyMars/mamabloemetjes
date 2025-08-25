create table public.orders (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  user_id uuid not null default gen_random_uuid (),
  order_number text not null,
  status text not null default 'pending'::text,
  subtotal numeric not null,
  tax_amount numeric not null,
  shipping_cost numeric not null,
  discount_amount numeric not null,
  total_amount numeric not null,
  notes text null,
  shipping_address jsonb not null,
  billing_address jsonb not null,
  constraint orders_pkey primary key (id),
  constraint orders_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_orders_created_at on public.orders using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_orders_customer_id on public.orders using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_orders_status on public.orders using btree (status) TABLESPACE pg_default;

create unique INDEX IF not exists idx_orders_order_number on public.orders using btree (order_number) TABLESPACE pg_default;

create index IF not exists idx_fk_orders_customer_id on public.orders using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_orders_status_updated_at on public.orders using btree (status, updated_at) TABLESPACE pg_default
where
  (
    status = any (array['cancelled'::text, 'deleted'::text])
  );
