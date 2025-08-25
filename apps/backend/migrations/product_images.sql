create table public.product_images (
  product_id uuid not null,
  url text not null,
  alt_text text not null,
  is_primary boolean not null default false,
  id uuid not null default gen_random_uuid (),
  constraint product_images_pkey primary key (id),
  constraint product_images_id_key unique (id),
  constraint product_images_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_product_images_product_primary on public.product_images using btree (product_id, is_primary desc) TABLESPACE pg_default;

create index IF not exists idx_product_images_product_id on public.product_images using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_fk_product_images_product_id on public.product_images using btree (product_id) TABLESPACE pg_default;
