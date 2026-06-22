create table public.workflows (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  enabled boolean not null default true,
  trigger_type text not null check (trigger_type in ('application_received', 'stage_changed', 'interview_completed', 'score_below', 'offer_sent', 'no_reply_days')),
  trigger_config jsonb not null default '{}',
  actions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_logs (
  id uuid primary key default uuid_generate_v4(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  workflow_name text not null,
  trigger_type text not null,
  application_id uuid references public.applications(id) on delete set null,
  candidate_name text,
  actions_executed jsonb not null default '[]',
  status text not null default 'success' check (status in ('success', 'partial', 'failed')),
  error_message text,
  executed_at timestamptz not null default now()
);

create index idx_workflows_trigger on public.workflows(trigger_type);
create index idx_workflows_enabled on public.workflows(enabled);
create index idx_workflow_logs_workflow on public.workflow_logs(workflow_id);
create index idx_workflow_logs_executed on public.workflow_logs(executed_at);

alter table public.workflows enable row level security;
alter table public.workflow_logs enable row level security;

create policy "Service role full access on workflows"
  on public.workflows for all using (true) with check (true);

create policy "Service role full access on workflow_logs"
  on public.workflow_logs for all using (true) with check (true);

create trigger workflows_updated_at
  before update on public.workflows
  for each row execute function update_updated_at();

-- Seed workflows
insert into public.workflows (name, trigger_type, trigger_config, actions, enabled) values
(
  'Welcome Email',
  'application_received',
  '{}',
  '[{"type": "send_email", "config": {"subject": "Welcome to Semipack Malaysia!", "body": "Dear {{candidate_name}},\n\nThank you for your interest in joining Semipack Malaysia. We have received your application for {{job_title}} and our team will review it shortly.\n\nBest regards,\nHR Team"}}]',
  true
),
(
  'Auto-screen Referrals',
  'application_received',
  '{"source": "referral"}',
  '[{"type": "move_stage", "config": {"stage": "screened"}}, {"type": "add_tag", "config": {"tag": "referral-fast-track"}}]',
  true
),
(
  'Low Score Alert',
  'score_below',
  '{"threshold": 3}',
  '[{"type": "notify_admin", "config": {"message": "Candidate {{candidate_name}} scored below threshold in {{interview_type}} for {{job_title}}. Consider reviewing."}}]',
  true
);
