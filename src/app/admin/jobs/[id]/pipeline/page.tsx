"use client";

import { useEffect, useState, useCallback, use } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Application, STAGES, STAGE_LABELS, ApplicationStage, Job } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ArrowLeft, User, Mail, Phone, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";

function SortableCard({
  app,
  onReject,
  suggestReject,
}: {
  app: Application;
  onReject: (app: Application) => void;
  suggestReject: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: app.id, data: { stage: app.stage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between">
        <div className="font-medium text-sm">{app.candidate?.name}</div>
        {suggestReject && (
          <span title="Two consecutive scores below 3 — consider rejecting">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </span>
        )}
      </div>
      <div className="text-xs text-muted mt-1">{app.candidate?.email}</div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-muted">
          {new Date(app.applied_at).toLocaleDateString("en-MY")}
        </span>
        {app.stage !== "rejected" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReject(app);
            }}
            className="ml-auto text-xs text-danger hover:underline"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );
}

function CandidateCard({ app }: { app: Application }) {
  return (
    <div className="bg-white rounded-lg border border-border p-3 shadow-md">
      <div className="font-medium text-sm">{app.candidate?.name}</div>
      <div className="text-xs text-muted mt-1">{app.candidate?.email}</div>
    </div>
  );
}

export default function PipelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = use(params);
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [rejectModal, setRejectModal] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSuggestions, setRejectSuggestions] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchData = useCallback(async () => {
    const [appsRes, jobRes] = await Promise.all([
      fetch(`/api/applications?job_id=${jobId}`),
      fetch(`/api/jobs`),
    ]);
    const apps = await appsRes.json();
    const jobs = await jobRes.json();
    setApplications(apps);
    setJob(jobs.find((j: Job) => j.id === jobId) || null);
    setLoading(false);

    // Check for reject suggestions: two consecutive interview scores < 3
    const suggestions = new Set<string>();
    for (const app of apps) {
      const interviewRes = await fetch(`/api/interviews?application_id=${app.id}`);
      const interviews = await interviewRes.json();
      const scored = interviews
        .filter((i: { completed: boolean; score: number | null }) => i.completed && i.score !== null)
        .sort((a: { scheduled_at: string }, b: { scheduled_at: string }) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );
      if (scored.length >= 2) {
        const last2 = scored.slice(-2);
        if (last2.every((i: { score: number }) => i.score < 3)) {
          suggestions.add(app.id);
        }
      }
    }
    setRejectSuggestions(suggestions);
  }, [jobId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleDragStart(event: DragStartEvent) {
    const app = applications.find((a) => a.id === event.active.id);
    setActiveApp(app || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;

    const app = applications.find((a) => a.id === active.id);
    if (!app) return;

    let targetStage: ApplicationStage | null = null;

    // Check if dropped on a column
    if (STAGES.includes(over.id as ApplicationStage)) {
      targetStage = over.id as ApplicationStage;
    } else {
      // Dropped on another card — get its stage
      const targetApp = applications.find((a) => a.id === over.id);
      if (targetApp) targetStage = targetApp.stage;
    }

    if (!targetStage || targetStage === app.stage) return;

    if (targetStage === "rejected") {
      setRejectModal(app);
      return;
    }

    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, stage: targetStage } : a))
    );

    await fetch(`/api/applications/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: targetStage }),
    });
  }

  async function handleReject() {
    if (!rejectModal) return;
    await fetch(`/api/applications/${rejectModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "rejected", reject_reason: rejectReason }),
    });
    setRejectModal(null);
    setRejectReason("");
    fetchData();
  }

  if (loading) {
    return <div className="text-center py-12 text-muted">Loading pipeline...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold">{job?.title || "Pipeline"}</h1>
        <p className="text-sm text-muted mt-1">
          Drag candidates between stages. {applications.length} total applicants.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageApps = applications.filter((a) => a.stage === stage);
            return (
              <StageColumn
                key={stage}
                stage={stage}
                applications={stageApps}
                onReject={setRejectModal}
                rejectSuggestions={rejectSuggestions}
              />
            );
          })}
          {/* Rejected column */}
          <RejectedColumn
            applications={applications.filter((a) => a.stage === "rejected")}
          />
        </div>

        <DragOverlay>
          {activeApp && <CandidateCard app={activeApp} />}
        </DragOverlay>
      </DndContext>

      <Modal
        open={!!rejectModal}
        onClose={() => { setRejectModal(null); setRejectReason(""); }}
        title="Reject Candidate"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Rejecting <strong>{rejectModal?.candidate?.name}</strong>. Please provide a reason.
          </p>
          <Textarea
            label="Rejection Reason *"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Does not meet minimum experience requirements"
            required
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StageColumn({
  stage,
  applications,
  onReject,
  rejectSuggestions,
}: {
  stage: ApplicationStage;
  applications: Application[];
  onReject: (app: Application) => void;
  rejectSuggestions: Set<string>;
}) {
  const { setNodeRef } = useSortable({ id: stage, data: { type: "column" } });

  const colorMap: Record<string, string> = {
    applied: "bg-gray-100",
    screened: "bg-blue-50",
    interview_1: "bg-indigo-50",
    interview_2: "bg-purple-50",
    offer: "bg-amber-50",
    hired: "bg-green-50",
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-64 rounded-xl ${colorMap[stage] || "bg-gray-50"} p-3`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{STAGE_LABELS[stage]}</h3>
        <Badge>{applications.length}</Badge>
      </div>
      <SortableContext
        items={applications.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 kanban-column">
          {applications.map((app) => (
            <SortableCard
              key={app.id}
              app={app}
              onReject={onReject}
              suggestReject={rejectSuggestions.has(app.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function RejectedColumn({ applications }: { applications: Application[] }) {
  return (
    <div className="flex-shrink-0 w-64 rounded-xl bg-red-50 p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-danger">Rejected</h3>
        <Badge variant="danger">{applications.length}</Badge>
      </div>
      <div className="space-y-2 kanban-column">
        {applications.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-lg border border-red-200 p-3 opacity-60"
          >
            <div className="font-medium text-sm">{app.candidate?.name}</div>
            <div className="text-xs text-muted mt-1">{app.reject_reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
