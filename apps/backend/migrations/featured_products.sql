create table public.featured_products (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  featured_type character varying(50) null default 'default'::character varying,
  start_date timestamp with time zone null,
  end_date timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint featured_products_pkey primary key (id),
  constraint featured_products_product_id_featured_type_key unique (product_id, featured_type),
  constraint featured_products_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;
