create table public.cart_items (
  id uuid not null default gen_random_uuid (),
  cart_id uuid not null,
  product_id uuid not null,
  quantity integer not null,
  unit_price_cents integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unit_tax_cents integer not null default 0,
  unit_subtotal_cents integer not null default 0,
  constraint cart_items_pkey primary key (id),
  constraint cart_items_cart_id_fkey foreign KEY (cart_id) references carts (id) on delete CASCADE,
  constraint cart_items_quantity_check check ((quantity > 0))
) TABLESPACE pg_default;

create index IF not exists idx_cart_items_cart_id on public.cart_items using btree (cart_id) TABLESPACE pg_default;

create index IF not exists idx_cart_items_product_id on public.cart_items using btree (product_id) TABLESPACE pg_default;

create trigger trigger_cart_items_updated_at BEFORE
update on cart_items for EACH row
execute FUNCTION update_updated_at_column ();
