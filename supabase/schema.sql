-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- One row per birthday page. The link only carries the short id.
create table if not exists public.birthdays (
  id         text primary key check (id ~ '^[0-9A-Za-z]{6,32}$'),
  data       jsonb not null,
  created_at timestamptz not null default now()
);

-- Row Level Security ON and NO policies = the public (anon) key can neither read nor write
-- this table. Only the server, using the service_role key, can (that key bypasses RLS).
alter table public.birthdays enable row level security;

-- Storage for uploaded photos and music. Public bucket so <img> and <audio> can load the
-- files by URL (names are random UUIDs, and listing the bucket is not allowed).
-- Only the server can upload, because there are no storage policies for anon users.
insert into storage.buckets (id, name, public, file_size_limit)
values ('birthday-media', 'birthday-media', true, 15728640)
on conflict (id) do nothing;
