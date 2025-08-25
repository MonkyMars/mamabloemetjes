create table public.carts (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  currency text not null default 'EUR'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint carts_pkey primary key (id),
  constraint carts_user_id_key unique NULLS not distinct (user_id)
) TABLESPACE pg_default;

create unique INDEX IF not exists idx_carts_user_id_unique on public.carts using btree (user_id) TABLESPACE pg_default
where
  (user_id is not null);

create trigger trigger_carts_updated_at BEFORE
update on carts for EACH row
execute FUNCTION update_updated_at_column ();
