"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Workflow,
  WorkflowLog,
  WorkflowAction,
  TriggerType,
  ActionType,
  TRIGGER_LABELS,
  ACTION_LABELS,
  STAGES,
  STAGE_LABELS,
  ApplicationStage,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  Zap,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

const TRIGGER_OPTIONS = Object.entries(TRIGGER_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/workflows");
    const data = await res.json();
    setWorkflows(data.workflows || []);
    setLogs(data.logs || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleToggle(wf: Workflow) {
    await fetch("/api/workflows", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: wf.id, enabled: !wf.enabled }),
    });
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow?")) return;
    await fetch("/api/workflows", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  async function handleSave(data: {
    name: string;
    trigger_type: TriggerType;
    trigger_config: Record<string, unknown>;
    actions: WorkflowAction[];
    enabled: boolean;
  }) {
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...data } : data;
    await fetch("/api/workflows", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setModalOpen(false);
    setEditing(null);
    fetchData();
  }

  const logStatusIcon = (status: string) => {
    if (status === "success") return <CheckCircle className="w-4 h-4 text-success" />;
    if (status === "partial") return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <XCircle className="w-4 h-4 text-danger" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent" />
            Workflows
          </h1>
          <p className="text-sm text-muted mt-1">
            Automate actions with trigger → action rules
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Workflow
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading...</div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="w-12 h-12 text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No workflows yet</h3>
            <p className="text-sm text-muted mb-4">
              Create your first automation to streamline your hiring process.
            </p>
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mb-8">
          {workflows.map((wf) => (
            <Card key={wf.id} className={!wf.enabled ? "opacity-60" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                      <Badge variant={wf.enabled ? "success" : "default"}>
                        {wf.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>

                    {/* Visual flow */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 bg-primary/5 text-primary rounded-lg px-3 py-1.5 text-xs font-medium">
                        <Play className="w-3.5 h-3.5" />
                        {TRIGGER_LABELS[wf.trigger_type]}
                        {wf.trigger_config && Object.keys(wf.trigger_config).length > 0 && (
                          <span className="text-muted ml-1">
                            ({Object.entries(wf.trigger_config).map(([k, v]) => `${k}: ${v}`).join(", ")})
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted" />
                      {wf.actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent rounded-lg px-3 py-1.5 text-xs font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            {ACTION_LABELS[action.type]}
                          </div>
                          {i < wf.actions.length - 1 && (
                            <span className="text-muted text-xs">+</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleToggle(wf)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title={wf.enabled ? "Disable" : "Enable"}
                    >
                      {wf.enabled ? (
                        <ToggleRight className="w-5 h-5 text-success" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted" />
                      )}
                    </button>
                    <button
                      onClick={() => { setEditing(wf); setModalOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-muted" />
                    </button>
                    <button
                      onClick={() => handleDelete(wf.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Execution Logs */}
      <div className="mt-8">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-primary transition-colors"
        >
          <Clock className="w-4 h-4" />
          Execution Log ({logs.length})
          {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showLogs && (
          <Card>
            <CardContent className="p-0">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted text-sm">No executions yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-muted">Status</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted">Workflow</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted">Trigger</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted">Candidate</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted">Actions</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">{logStatusIcon(log.status)}</td>
                        <td className="px-4 py-2.5 font-medium">{log.workflow_name}</td>
                        <td className="px-4 py-2.5 text-muted">
                          {TRIGGER_LABELS[log.trigger_type as TriggerType] || log.trigger_type}
                        </td>
                        <td className="px-4 py-2.5">{log.candidate_name || "—"}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {log.actions_executed.map((a, i) => (
                              <Badge
                                key={i}
                                variant={a.status === "success" ? "success" : a.status === "failed" ? "danger" : "default"}
                              >
                                {ACTION_LABELS[a.type as ActionType] || a.type}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-muted text-xs">
                          {format(new Date(log.executed_at), "d MMM HH:mm")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? "Edit Workflow" : "New Workflow"}
        size="lg"
      >
        <WorkflowForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
}

function WorkflowForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Workflow | null;
  onSave: (data: {
    name: string;
    trigger_type: TriggerType;
    trigger_config: Record<string, unknown>;
    actions: WorkflowAction[];
    enabled: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [triggerType, setTriggerType] = useState<TriggerType>(initial?.trigger_type || "application_received");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(initial?.trigger_config || {});
  const [actions, setActions] = useState<WorkflowAction[]>(initial?.actions || []);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  function addAction() {
    setActions([...actions, { type: "send_email", config: { subject: "", body: "" } }]);
  }

  function updateAction(idx: number, updates: Partial<WorkflowAction>) {
    setActions(actions.map((a, i) => (i === idx ? { ...a, ...updates } : a)));
  }

  function removeAction(idx: number) {
    setActions(actions.filter((_, i) => i !== idx));
  }

  function updateActionConfig(idx: number, key: string, value: string) {
    const updated = [...actions];
    updated[idx] = { ...updated[idx], config: { ...updated[idx].config, [key]: value } };
    setActions(updated);
  }

  const stageOptions = STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name, trigger_type: triggerType, trigger_config: triggerConfig, actions, enabled });
      }}
      className="space-y-5"
    >
      <Input label="Workflow Name *" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Welcome Email" />

      {/* Trigger */}
      <div className="bg-primary/5 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Play className="w-4 h-4" /> When this happens (Trigger)
        </div>
        <Select
          label="Trigger Type *"
          value={triggerType}
          onChange={(e) => {
            setTriggerType(e.target.value as TriggerType);
            setTriggerConfig({});
          }}
          options={TRIGGER_OPTIONS}
        />
        {/* Conditional config */}
        {triggerType === "stage_changed" && (
          <Select
            label="When stage changes to"
            value={(triggerConfig.stage as string) || ""}
            onChange={(e) => setTriggerConfig({ ...triggerConfig, stage: e.target.value })}
            options={[{ value: "", label: "Any stage" }, ...stageOptions]}
          />
        )}
        {triggerType === "score_below" && (
          <Input
            label="Score threshold (trigger when score ≤)"
            type="number"
            value={String(triggerConfig.threshold || 3)}
            onChange={(e) => setTriggerConfig({ ...triggerConfig, threshold: parseInt(e.target.value) })}
            min={1}
            max={5}
          />
        )}
        {triggerType === "no_reply_days" && (
          <Input
            label="Days without stage change"
            type="number"
            value={String(triggerConfig.days || 7)}
            onChange={(e) => setTriggerConfig({ ...triggerConfig, days: parseInt(e.target.value) })}
            min={1}
          />
        )}
        {triggerType === "application_received" && (
          <Select
            label="Only from source (optional)"
            value={(triggerConfig.source as string) || ""}
            onChange={(e) => {
              if (e.target.value) setTriggerConfig({ ...triggerConfig, source: e.target.value });
              else {
                const { source, ...rest } = triggerConfig;
                setTriggerConfig(rest);
              }
            }}
            options={[
              { value: "", label: "Any source" },
              { value: "website", label: "Website" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "referral", label: "Referral" },
              { value: "jobstreet", label: "JobStreet" },
            ]}
          />
        )}
      </div>

      {/* Actions */}
      <div className="bg-accent/5 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent">
            <Zap className="w-4 h-4" /> Then do this (Actions)
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={addAction}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Action
          </Button>
        </div>

        {actions.length === 0 && (
          <p className="text-xs text-muted text-center py-4">
            No actions yet. Click &quot;Add Action&quot; to get started.
          </p>
        )}

        {actions.map((action, idx) => (
          <div key={idx} className="bg-white rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Action {idx + 1}
              </span>
              <button type="button" onClick={() => removeAction(idx)} className="text-danger hover:underline text-xs">
                Remove
              </button>
            </div>

            <Select
              label="Action Type"
              value={action.type}
              onChange={(e) => {
                const newType = e.target.value as ActionType;
                const defaultConfigs: Record<ActionType, Record<string, string>> = {
                  send_email: { subject: "", body: "" },
                  move_stage: { stage: "screened" },
                  add_tag: { tag: "" },
                  send_webhook: { url: "" },
                  notify_admin: { message: "" },
                };
                updateAction(idx, { type: newType, config: defaultConfigs[newType] });
              }}
              options={ACTION_OPTIONS}
            />

            {action.type === "send_email" && (
              <>
                <Input
                  label="Email Subject"
                  value={action.config.subject || ""}
                  onChange={(e) => updateActionConfig(idx, "subject", e.target.value)}
                  placeholder="e.g. Welcome to {{job_title}}"
                />
                <Textarea
                  label="Email Body"
                  value={action.config.body || ""}
                  onChange={(e) => updateActionConfig(idx, "body", e.target.value)}
                  placeholder="Use {{candidate_name}}, {{job_title}}, {{stage}}, {{score}}"
                  rows={4}
                />
                <p className="text-xs text-muted">
                  Variables: {"{{candidate_name}}"}, {"{{candidate_email}}"}, {"{{job_title}}"}, {"{{stage}}"}, {"{{score}}"}, {"{{source}}"}
                </p>
              </>
            )}

            {action.type === "move_stage" && (
              <Select
                label="Move to Stage"
                value={action.config.stage || "screened"}
                onChange={(e) => updateActionConfig(idx, "stage", e.target.value)}
                options={stageOptions}
              />
            )}

            {action.type === "add_tag" && (
              <Input
                label="Tag Name"
                value={action.config.tag || ""}
                onChange={(e) => updateActionConfig(idx, "tag", e.target.value)}
                placeholder="e.g. priority, referral-fast-track"
              />
            )}

            {action.type === "send_webhook" && (
              <Input
                label="Webhook URL"
                value={action.config.url || ""}
                onChange={(e) => updateActionConfig(idx, "url", e.target.value)}
                placeholder="https://hooks.example.com/..."
              />
            )}

            {action.type === "notify_admin" && (
              <Textarea
                label="Notification Message"
                value={action.config.message || ""}
                onChange={(e) => updateActionConfig(idx, "message", e.target.value)}
                placeholder="e.g. {{candidate_name}} needs attention for {{job_title}}"
                rows={2}
              />
            )}
          </div>
        ))}
      </div>

      {/* Enable toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className="flex-shrink-0"
        >
          {enabled ? (
            <ToggleRight className="w-8 h-8 text-success" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-muted" />
          )}
        </button>
        <span className="text-sm font-medium">{enabled ? "Workflow is active" : "Workflow is disabled"}</span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!name || actions.length === 0}>Save Workflow</Button>
      </div>
    </form>
  );
}
