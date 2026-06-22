-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Jobs table
create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  department text not null,
  location text not null default 'Nilai, Negeri Sembilan',
  employment_type text not null default 'full_time',
  salary_min integer,
  salary_max integer,
  description text not null default '',
  requirements text not null default '',
  benefits text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Candidates table
create table public.candidates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  phone text not null default '',
  resume_url text,
  tags text[] not null default '{}',
  source text not null default 'website',
  created_at timestamptz not null default now()
);

-- Applications table
create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  stage text not null default 'applied' check (stage in ('applied', 'screened', 'interview_1', 'interview_2', 'offer', 'hired', 'rejected')),
  cover_letter text,
  reject_reason text,
  applied_at timestamptz not null default now(),
  stage_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(job_id, candidate_id)
);

-- Interviews table
create table public.interviews (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  interview_type text not null check (interview_type in ('interview_1', 'interview_2')),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  meeting_link text,
  meeting_provider text not null default 'google_meet' check (meeting_provider in ('google_meet', 'zoom')),
  interviewer_name text not null,
  interviewer_email text not null,
  feedback text,
  score integer check (score >= 1 and score <= 5),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Offers table
create table public.offers (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  salary integer not null,
  start_date date not null,
  expiry_date date not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now()
);

-- Email logs table
create table public.email_logs (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid references public.applications(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  template text not null,
  sent_at timestamptz not null default now()
);

-- Indexes
create index idx_applications_job_id on public.applications(job_id);
create index idx_applications_candidate_id on public.applications(candidate_id);
create index idx_applications_stage on public.applications(stage);
create index idx_interviews_application_id on public.interviews(application_id);
create index idx_interviews_scheduled_at on public.interviews(scheduled_at);
create index idx_jobs_status on public.jobs(status);
create index idx_jobs_slug on public.jobs(slug);

-- Updated_at trigger for jobs
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function update_updated_at();

-- RLS Policies
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.interviews enable row level security;
alter table public.offers enable row level security;
alter table public.email_logs enable row level security;

-- Public read access for published jobs
create policy "Public can view published jobs"
  on public.jobs for select
  using (status = 'published');

-- Service role has full access (used by API routes)
create policy "Service role full access on jobs"
  on public.jobs for all
  using (true)
  with check (true);

create policy "Service role full access on candidates"
  on public.candidates for all
  using (true)
  with check (true);

create policy "Service role full access on applications"
  on public.applications for all
  using (true)
  with check (true);

create policy "Service role full access on interviews"
  on public.interviews for all
  using (true)
  with check (true);

create policy "Service role full access on offers"
  on public.offers for all
  using (true)
  with check (true);

create policy "Service role full access on email_logs"
  on public.email_logs for all
  using (true)
  with check (true);

-- Resumes are stored locally in public/downloads/
