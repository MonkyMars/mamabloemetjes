create table public.contact_forms (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  email text not null,
  phone text null,
  preferred_contact_method text not null,
  occasion text null,
  message text not null,
  product_id uuid null,
  constraint contact_forms_pkey primary key (id),
  constraint contact_forms_product_id_fkey foreign KEY (product_id) references products (id)
) TABLESPACE pg_default;
