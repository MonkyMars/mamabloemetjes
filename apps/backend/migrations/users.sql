create table public.users (
  id uuid not null default gen_random_uuid (),
  email character varying(255) not null,
  password_hash text not null,
  role public.user_role not null default 'user'::user_role,
  refresh_token text null,
  refresh_token_expires_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  email_verified boolean null default false,
  last_login timestamp with time zone null,
  first_name text not null default ''::text,
  last_name text not null default ''::text,
  preposition text null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint email_format check (
    (
      (email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text
    )
  ),
  constraint email_length check ((length((email)::text) <= 254)),
  constraint password_hash_not_empty check ((length(password_hash) > 0))
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_refresh_token on public.users using btree (refresh_token) TABLESPACE pg_default
where
  (refresh_token is not null);

create index IF not exists idx_users_role on public.users using btree (role) TABLESPACE pg_default;

create index IF not exists idx_users_created_at on public.users using btree (created_at) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();
