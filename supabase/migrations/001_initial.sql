-- Users are managed by Supabase Auth
-- Extended profile
create table profiles (
  id uuid references auth.users primary key,
  name text,
  role text default 'user', -- 'user' or 'admin'
  plan text default 'free',  -- 'free' or 'lifetime'
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null, -- 'user' or 'assistant'
  content text not null,
  created_at timestamptz default now()
);

create table knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_settings (
  id uuid primary key default gen_random_uuid(),
  provider text default 'openai',
  model text default 'gpt-4o',
  api_key text default '',
  temperature numeric default 0.8,
  system_prompt_prefix text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table knowledge_base enable row level security;

-- Profiles: users can read their own profile
create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Conversations: users can manage their own
create policy "Users can read own conversations" on conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert own conversations" on conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations" on conversations
  for update using (auth.uid() = user_id);

-- Messages: users can access their own conversation messages
create policy "Users can read own messages" on messages
  for select using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert own messages" on messages
  for insert with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- Knowledge base: readable by authenticated users
create policy "Authenticated users can read knowledge base" on knowledge_base
  for select using (auth.role() = 'authenticated');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.raw_user_meta_data->>'name', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
