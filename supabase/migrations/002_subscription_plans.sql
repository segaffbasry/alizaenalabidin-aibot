-- Add subscription expiry to profiles
alter table profiles
  add column if not exists plan_expires_at timestamptz default null;

-- plan column now supports: 'free', '1month', '6month', '12month'
-- plan_expires_at: null = free/lifetime, otherwise expiry timestamp
