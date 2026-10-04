-- Emojiro Paint optional encrypted cloud-library sync.
-- Run once in the Supabase SQL editor for the project you want to use.
-- The browser uses a publishable key only. Project-library contents are AES-GCM
-- encrypted client-side before they are written to this table.

create table if not exists public.emojiro_cloud_libraries (
  sync_id text primary key
    check (sync_id ~ '^[0-9a-f]{64}$'),
  payload text not null,
  updated_at timestamptz not null default now()
);

alter table public.emojiro_cloud_libraries enable row level security;

revoke all on table public.emojiro_cloud_libraries from anon, authenticated;
grant select, insert, update on table public.emojiro_cloud_libraries to anon;

drop policy if exists "emojiro cloud select by sync header" on public.emojiro_cloud_libraries;
create policy "emojiro cloud select by sync header"
on public.emojiro_cloud_libraries
for select
to anon
using (
  sync_id = coalesce(
    current_setting('request.headers', true)::json ->> 'x-emojiro-sync',
    ''
  )
);

drop policy if exists "emojiro cloud insert by sync header" on public.emojiro_cloud_libraries;
create policy "emojiro cloud insert by sync header"
on public.emojiro_cloud_libraries
for insert
to anon
with check (
  sync_id = coalesce(
    current_setting('request.headers', true)::json ->> 'x-emojiro-sync',
    ''
  )
);

drop policy if exists "emojiro cloud update by sync header" on public.emojiro_cloud_libraries;
create policy "emojiro cloud update by sync header"
on public.emojiro_cloud_libraries
for update
to anon
using (
  sync_id = coalesce(
    current_setting('request.headers', true)::json ->> 'x-emojiro-sync',
    ''
  )
)
with check (
  sync_id = coalesce(
    current_setting('request.headers', true)::json ->> 'x-emojiro-sync',
    ''
  )
);

comment on table public.emojiro_cloud_libraries is
  'Encrypted Emojiro Paint project-library blobs keyed by a SHA-256 sync identifier.';
