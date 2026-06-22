export type JobStatus = "draft" | "published" | "closed";
export type ApplicationStage =
  | "applied"
  | "screened"
  | "interview_1"
  | "interview_2"
  | "offer"
  | "hired"
  | "rejected";
export type InterviewType = "interview_1" | "interview_2";
export type OfferStatus = "pending" | "accepted" | "declined" | "expired";

export interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  requirements: string;
  benefits: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resume_url: string | null;
  tags: string[];
  source: string;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  stage: ApplicationStage;
  cover_letter: string | null;
  reject_reason: string | null;
  applied_at: string;
  stage_changed_at: string;
  created_at: string;
  // joined
  candidate?: Candidate;
  job?: Job;
}

export interface Interview {
  id: string;
  application_id: string;
  interview_type: InterviewType;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  meeting_provider: "google_meet" | "zoom";
  interviewer_name: string;
  interviewer_email: string;
  feedback: string | null;
  score: number | null;
  completed: boolean;
  created_at: string;
  // joined
  application?: Application & { candidate?: Candidate; job?: Job };
}

export interface Offer {
  id: string;
  application_id: string;
  salary: number;
  start_date: string;
  expiry_date: string;
  notes: string | null;
  status: OfferStatus;
  created_at: string;
  application?: Application & { candidate?: Candidate; job?: Job };
}

export interface EmailLog {
  id: string;
  application_id: string | null;
  recipient_email: string;
  subject: string;
  template: string;
  sent_at: string;
}

export interface CompanySettings {
  id: string;
  logo_url: string | null;
  company_photo_url: string | null;
  vision: string;
  mission: string;
  address: string;
  updated_at: string;
}

export type TriggerType =
  | "application_received"
  | "stage_changed"
  | "interview_completed"
  | "score_below"
  | "offer_sent"
  | "no_reply_days";

export type ActionType =
  | "send_email"
  | "move_stage"
  | "add_tag"
  | "send_webhook"
  | "notify_admin";

export interface WorkflowAction {
  type: ActionType;
  config: Record<string, string>;
}

export interface Workflow {
  id: string;
  name: string;
  enabled: boolean;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  actions: WorkflowAction[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowLog {
  id: string;
  workflow_id: string;
  workflow_name: string;
  trigger_type: string;
  application_id: string | null;
  candidate_name: string | null;
  actions_executed: { type: string; status: string; detail?: string }[];
  status: "success" | "partial" | "failed";
  error_message: string | null;
  executed_at: string;
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  application_received: "Application Received",
  stage_changed: "Stage Changed",
  interview_completed: "Interview Completed",
  score_below: "Score Below Threshold",
  offer_sent: "Offer Sent",
  no_reply_days: "No Reply (Days)",
};

export const ACTION_LABELS: Record<ActionType, string> = {
  send_email: "Send Email",
  move_stage: "Move to Stage",
  add_tag: "Add Tag",
  send_webhook: "Send Webhook",
  notify_admin: "Notify Admin",
};

export const STAGES: ApplicationStage[] = [
  "applied",
  "screened",
  "interview_1",
  "interview_2",
  "offer",
  "hired",
];

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  applied: "Applied",
  screened: "Screened",
  interview_1: "Interview 1",
  interview_2: "Interview 2",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};
