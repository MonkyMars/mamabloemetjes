create table public.search_analytics (
  id uuid not null default gen_random_uuid (),
  search_term character varying(255) not null,
  search_count integer not null default 1,
  last_searched timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint search_analytics_pkey primary key (id),
  constraint unique_search_term unique (search_term)
) TABLESPACE pg_default;

create index IF not exists idx_search_analytics_search_term on public.search_analytics using btree (lower((search_term)::text)) TABLESPACE pg_default;

create index IF not exists idx_search_analytics_search_count on public.search_analytics using btree (search_count desc) TABLESPACE pg_default;

create index IF not exists idx_search_analytics_last_searched on public.search_analytics using btree (last_searched desc) TABLESPACE pg_default;

create index IF not exists idx_search_analytics_created_at on public.search_analytics using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_search_analytics_popular on public.search_analytics using btree (search_count desc, last_searched desc) TABLESPACE pg_default
where
  (search_count > 1);

create trigger trigger_update_search_analytics_updated_at BEFORE
update on search_analytics for EACH row
execute FUNCTION update_search_analytics_updated_at ();
