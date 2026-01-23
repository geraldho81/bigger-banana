-- Add model column to history table
alter table history add column if not exists model text default 'nanobanana-pro';
