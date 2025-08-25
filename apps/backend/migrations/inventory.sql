create table public.inventory (
  product_id uuid not null default gen_random_uuid (),
  quantity_on_hand numeric not null default '0'::numeric,
  quantity_reserved numeric not null default '0'::numeric,
  updated_at timestamp with time zone not null default now(),
  constraint inventory_pkey primary key (product_id),
  constraint inventory_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_inventory_updated_at on public.inventory using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_inventory_available on public.inventory using btree (((quantity_on_hand - quantity_reserved))) TABLESPACE pg_default;

create index IF not exists idx_inventory_product_id on public.inventory using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_available_quantity on public.inventory using btree (((quantity_on_hand - quantity_reserved))) TABLESPACE pg_default;

create index IF not exists idx_inventory_available_stock on public.inventory using btree (((quantity_on_hand - quantity_reserved))) TABLESPACE pg_default;

create index IF not exists idx_inventory_product_join on public.inventory using btree (product_id) INCLUDE (quantity_on_hand, quantity_reserved) TABLESPACE pg_default;

create index IF not exists idx_fk_inventory_product_id on public.inventory using btree (product_id) TABLESPACE pg_default;

create trigger trigger_update_inventory_updated_at BEFORE
update on inventory for EACH row
execute FUNCTION update_inventory_updated_at ();
