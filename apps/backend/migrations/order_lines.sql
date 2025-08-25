create table public.order_line (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  order_id uuid not null,
  product_id uuid not null default gen_random_uuid (),
  quantity numeric not null,
  unit_price numeric not null,
  discount_amount numeric not null,
  constraint order_line_pkey primary key (id),
  constraint order_line_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_line_product_id_fkey foreign KEY (product_id) references products (id)
) TABLESPACE pg_default;

create index IF not exists idx_order_line_created_at on public.order_line using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_order_line_order_id on public.order_line using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_order_line_product_id on public.order_line using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_order_line_order_id_created on public.order_line using btree (order_id, created_at) TABLESPACE pg_default;

create index IF not exists idx_order_line_order_product on public.order_line using btree (order_id, product_id) TABLESPACE pg_default;

create index IF not exists idx_fk_order_line_order_id on public.order_line using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_fk_order_line_product_id on public.order_line using btree (product_id) TABLESPACE pg_default;
