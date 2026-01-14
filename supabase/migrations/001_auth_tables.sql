-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create saved_jobs table
create table if not exists public.saved_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  job_id uuid references public.jobs on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, job_id)
);

-- Create job_alerts table
create table if not exists public.job_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  keywords text[] default '{}',
  job_types text[] default '{}',
  locations text[] default '{}',
  experience_levels text[] default '{}',
  salary_min integer,
  frequency text default 'daily' check (frequency in ('daily', 'weekly', 'instant')),
  is_active boolean default true,
  last_sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_alerts enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Saved jobs policies
create policy "Users can view their own saved jobs"
  on public.saved_jobs for select
  using (auth.uid() = user_id);

create policy "Users can save jobs"
  on public.saved_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave their own jobs"
  on public.saved_jobs for delete
  using (auth.uid() = user_id);

-- Job alerts policies
create policy "Users can view their own job alerts"
  on public.job_alerts for select
  using (auth.uid() = user_id);

create policy "Users can create job alerts"
  on public.job_alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own job alerts"
  on public.job_alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own job alerts"
  on public.job_alerts for delete
  using (auth.uid() = user_id);

-- Function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create indexes for better performance
create index if not exists saved_jobs_user_id_idx on public.saved_jobs(user_id);
create index if not exists saved_jobs_job_id_idx on public.saved_jobs(job_id);
create index if not exists job_alerts_user_id_idx on public.job_alerts(user_id);
create index if not exists job_alerts_is_active_idx on public.job_alerts(is_active);
