-- Create history table for storing generation results
create table if not exists history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  prompt text not null,
  aspect_ratio text not null,
  resolution text not null,
  reference_images jsonb default '[]'::jsonb,
  results jsonb not null,
  thumbnail_b64 text
);

-- Index for faster retrieval by date
create index if not exists history_created_at_idx on history(created_at desc);

-- Enable RLS (Row Level Security)
alter table history enable row level security;

-- Policy to allow all operations (adjust based on your auth needs)
create policy "Allow all operations on history"
  on history
  for all
  using (true)
  with check (true);
