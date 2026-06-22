import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { Workflow, WorkflowAction, TriggerType } from "@/lib/types";

export interface WorkflowContext {
  application_id?: string;
  candidate_id?: string;
  candidate_name?: string;
  candidate_email?: string;
  job_id?: string;
  job_title?: string;
  stage?: string;
  previous_stage?: string;
  source?: string;
  score?: number;
  interview_type?: string;
}

function interpolate(template: string, ctx: WorkflowContext): string {
  return template
    .replace(/\{\{candidate_name\}\}/g, ctx.candidate_name || "")
    .replace(/\{\{candidate_email\}\}/g, ctx.candidate_email || "")
    .replace(/\{\{job_title\}\}/g, ctx.job_title || "")
    .replace(/\{\{stage\}\}/g, ctx.stage || "")
    .replace(/\{\{previous_stage\}\}/g, ctx.previous_stage || "")
    .replace(/\{\{score\}\}/g, String(ctx.score ?? ""))
    .replace(/\{\{interview_type\}\}/g, ctx.interview_type || "")
    .replace(/\{\{source\}\}/g, ctx.source || "");
}

function matchesTriggerConfig(
  triggerConfig: Record<string, unknown>,
  ctx: WorkflowContext
): boolean {
  for (const [key, value] of Object.entries(triggerConfig)) {
    switch (key) {
      case "stage":
        if (ctx.stage !== value) return false;
        break;
      case "previous_stage":
        if (ctx.previous_stage !== value) return false;
        break;
      case "source":
        if (ctx.source !== value) return false;
        break;
      case "threshold":
        if (ctx.score === undefined || ctx.score > (value as number)) return false;
        break;
      case "days":
        // Handled by cron, always matches when cron calls it
        break;
    }
  }
  return true;
}

async function executeAction(
  action: WorkflowAction,
  ctx: WorkflowContext,
  supabase: ReturnType<typeof createServiceClient>
): Promise<{ status: string; detail?: string }> {
  try {
    switch (action.type) {
      case "send_email": {
        if (!ctx.candidate_email) return { status: "skipped", detail: "No email" };
        const subject = interpolate(action.config.subject || "", ctx);
        const body = interpolate(action.config.body || "", ctx);
        await sendEmail({
          to: ctx.candidate_email,
          subject,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0f1b4c; padding: 20px 30px;">
              <h2 style="color: #c8a84e; margin: 0;">Semipack Malaysia</h2>
            </div>
            <div style="padding: 30px; line-height: 1.6;">
              ${body.replace(/\n/g, "<br/>")}
            </div>
          </div>`,
        });
        await supabase.from("email_logs").insert({
          application_id: ctx.application_id || null,
          recipient_email: ctx.candidate_email,
          subject,
          template: "workflow",
        });
        return { status: "success", detail: `Email sent: ${subject}` };
      }

      case "move_stage": {
        if (!ctx.application_id) return { status: "skipped", detail: "No application" };
        const targetStage = action.config.stage;
        await supabase
          .from("applications")
          .update({ stage: targetStage, stage_changed_at: new Date().toISOString() })
          .eq("id", ctx.application_id);
        return { status: "success", detail: `Moved to ${targetStage}` };
      }

      case "add_tag": {
        if (!ctx.candidate_id) return { status: "skipped", detail: "No candidate" };
        const tag = interpolate(action.config.tag || "", ctx);
        const { data: candidate } = await supabase
          .from("candidates")
          .select("tags")
          .eq("id", ctx.candidate_id)
          .single();
        if (candidate && !candidate.tags.includes(tag)) {
          await supabase
            .from("candidates")
            .update({ tags: [...candidate.tags, tag] })
            .eq("id", ctx.candidate_id);
        }
        return { status: "success", detail: `Tag added: ${tag}` };
      }

      case "send_webhook": {
        const url = action.config.url;
        if (!url) return { status: "skipped", detail: "No URL" };
        const payload = {
          trigger: ctx.stage,
          candidate_name: ctx.candidate_name,
          candidate_email: ctx.candidate_email,
          job_title: ctx.job_title,
          application_id: ctx.application_id,
          timestamp: new Date().toISOString(),
        };
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return {
          status: res.ok ? "success" : "failed",
          detail: `Webhook ${res.status}: ${url}`,
        };
      }

      case "notify_admin": {
        const message = interpolate(action.config.message || "", ctx);
        await supabase.from("workflow_logs").insert({
          workflow_id: "00000000-0000-0000-0000-000000000000",
          workflow_name: "Admin Notification",
          trigger_type: "notify",
          application_id: ctx.application_id || null,
          candidate_name: ctx.candidate_name || null,
          actions_executed: [{ type: "notify_admin", status: "success", detail: message }],
          status: "success",
        });
        return { status: "success", detail: message };
      }

      default:
        return { status: "skipped", detail: `Unknown action: ${action.type}` };
    }
  } catch (err) {
    return {
      status: "failed",
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function evaluateWorkflows(
  triggerType: TriggerType,
  ctx: WorkflowContext
): Promise<void> {
  try {
    const supabase = createServiceClient();

    const { data: workflows } = await supabase
      .from("workflows")
      .select("*")
      .eq("trigger_type", triggerType)
      .eq("enabled", true);

    if (!workflows || workflows.length === 0) return;

    for (const wf of workflows as Workflow[]) {
      if (!matchesTriggerConfig(wf.trigger_config, ctx)) continue;

      const actionsExecuted: { type: string; status: string; detail?: string }[] = [];
      let overallStatus: "success" | "partial" | "failed" = "success";

      for (const action of wf.actions) {
        const result = await executeAction(action, ctx, supabase);
        actionsExecuted.push({ type: action.type, ...result });
        if (result.status === "failed") {
          overallStatus = actionsExecuted.some((a) => a.status === "success")
            ? "partial"
            : "failed";
        }
      }

      await supabase.from("workflow_logs").insert({
        workflow_id: wf.id,
        workflow_name: wf.name,
        trigger_type: triggerType,
        application_id: ctx.application_id || null,
        candidate_name: ctx.candidate_name || null,
        actions_executed: actionsExecuted,
        status: overallStatus,
      });
    }
  } catch {
    // Workflow failures should never block the main operation
  }
}
