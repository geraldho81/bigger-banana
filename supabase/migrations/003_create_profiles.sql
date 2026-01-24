-- Create profiles table for user customization
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles
  for select
  using (id = auth.uid());

create policy "Users can insert their own profile"
  on profiles
  for insert
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());
