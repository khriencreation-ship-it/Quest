create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null, -- 'task_assigned', 'task_completed', 'mention', etc.
  link text, -- optional link to the relevant page (e.g., /dashboard/tasks?org=...)
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);
