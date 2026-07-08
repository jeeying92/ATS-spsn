"use client";

import { useEffect, useState, useCallback } from "react";
import { Interview, Application, CompanySettings, MEETING_PROVIDER_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Calendar,
  Clock,
  Video,
  User,
  Star,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Upload,
  FileText,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<{ id: string; name: string; email: string }[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string; department: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<Interview | null>(null);
  const [detailModal, setDetailModal] = useState<Interview | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [suggestRejectAlert, setSuggestRejectAlert] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [meetingProviders, setMeetingProviders] = useState<string[]>(["google_meet", "zoom", "semipack_premise", "others"]);
  const [mathTestFormUrl, setMathTestFormUrl] = useState<string>("");

  const fetchData = useCallback(async () => {
    const [intRes, appRes, candidatesRes, jobsRes, settingsRes] = await Promise.all([
      fetch("/api/interviews"),
      fetch("/api/applications"),
      fetch("/api/candidates"),
      fetch("/api/jobs"),
      fetch("/api/settings"),
    ]);
    setInterviews(await intRes.json());
    setApplications(await appRes.json());
    setCandidates(await candidatesRes.json());
    setJobs(await jobsRes.json());
    const settings = await settingsRes.json() as CompanySettings;
    if (settings.meeting_providers) setMeetingProviders(settings.meeting_providers);
    if (settings.math_test_form_url) setMathTestFormUrl(settings.math_test_form_url);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  const getInterviewsForDay = (day: Date) =>
    interviews.filter((i) => isSameDay(new Date(i.scheduled_at), day));

  async function handleSchedule(formData: Record<string, string>) {
    setScheduleError(null);
    setScheduling(true);

    try {
      let applicationId = formData.application_id;

      // If no existing application_id, create/find one using candidate + job
      if (!applicationId && formData.candidate_id && formData.job_id) {
        // Try to create application (may return 409 if already exists)
        await fetch("/api/applications", {
          method: "POST",
          body: (() => {
            const fd = new FormData();
            fd.append("candidate_id", formData.candidate_id);
            fd.append("job_id", formData.job_id);
            return fd;
          })(),
        });
        // Always look up the application (whether just created or already existing)
        const appsRes = await fetch(`/api/applications?job_id=${formData.job_id}`);
        const apps = await appsRes.json();
        const found = Array.isArray(apps)
          ? apps.find((a: Application) => a.candidate_id === formData.candidate_id)
          : null;
        if (found) applicationId = found.id;
      }

      if (!applicationId) {
        setScheduleError("Please select a candidate and a job position before scheduling.");
        return;
      }

      const intRes = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId,
          interview_type: formData.interview_type,
          scheduled_at: formData.scheduled_at,
          duration_minutes: parseInt(formData.duration_minutes),
          meeting_provider: formData.meeting_provider,
          interviewer_name: formData.interviewer_name,
          interviewer_email: formData.interviewer_email,
          remarks: formData.remarks || null,
        }),
      });

      if (!intRes.ok) {
        const err = await intRes.json();
        setScheduleError(err.error || "Failed to schedule interview. Please try again.");
        return;
      }

      const intData = await intRes.json();
      setScheduleModal(false);
      setScheduleError(null);
      fetchData();

      // Warn if email failed to send
      if (intData.email_error) {
        setSuggestRejectAlert(`Interview scheduled ✓ — but invitation email could not be sent: ${intData.email_error}. Please send the invite manually.`);
      }
    } finally {
      setScheduling(false);
    }
  }

  async function handleFeedback(interviewId: string, score: number, feedback: string, mathScore: number | null) {
    const res = await fetch("/api/interviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: interviewId, score, feedback, completed: true, math_score: mathScore }),
    });
    const data = await res.json();
    if (data.suggest_reject) setSuggestRejectAlert(data.message);
    setFeedbackModal(null);
    fetchData();
  }

  async function handleRemarks(interviewId: string, remarks: string, formFile: File | null) {
    const fd = new FormData();
    fd.append("remarks", remarks);
    if (formFile) fd.append("application_form", formFile);
    await fetch(`/api/interviews/${interviewId}`, { method: "PUT", body: fd });
    setDetailModal(null);
    fetchData();
  }

  const providerLabel = (p: string) => MEETING_PROVIDER_LABELS[p] || p;

  if (loading) return <div className="text-center py-12 text-muted">Loading...</div>;

  const upcomingInterviews = interviews
    .filter((i) => !i.completed && new Date(i.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const pastInterviews = interviews
    .filter((i) => i.completed || new Date(i.scheduled_at) <= new Date())
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="text-sm text-muted mt-1">Schedule and manage interviews</p>
        </div>
        <div className="flex items-center gap-3">
          {mathTestFormUrl && (
            <a href={mathTestFormUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-primary hover:bg-gray-50 transition-colors">
              <ClipboardList className="w-4 h-4" />
              Math Test Form
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Button onClick={() => setScheduleModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Schedule Interview
          </Button>
        </div>
      </div>

      {suggestRejectAlert && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">{suggestRejectAlert}</p>
            <button onClick={() => setSuggestRejectAlert(null)} className="text-xs text-yellow-600 mt-1 hover:underline">Dismiss</button>
          </div>
        </div>
      )}

      {/* Calendar */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-gray-100">&larr;</button>
            <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-gray-100">&rarr;</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted py-2">{d}</div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {days.map((day) => {
              const dayInterviews = getInterviewsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={`min-h-[80px] p-1 border border-border rounded ${isToday ? "bg-primary/5 border-primary/30" : ""}`}>
                  <div className={`text-xs mb-1 ${isToday ? "font-bold text-primary" : "text-muted"}`}>{format(day, "d")}</div>
                  {dayInterviews.map((interview) => (
                    <button key={interview.id} onClick={() => setDetailModal(interview)}
                      className={`w-full text-left text-xs px-1 py-0.5 rounded mb-0.5 truncate ${interview.completed ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>
                      {format(new Date(interview.scheduled_at), "HH:mm")} {interview.application?.candidate?.name?.split(" ")[0]}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <h2 className="text-lg font-semibold mb-3">Upcoming Interviews</h2>
      {upcomingInterviews.length === 0 ? (
        <p className="text-sm text-muted mb-8">No upcoming interviews.</p>
      ) : (
        <div className="grid gap-3 mb-8">
          {upcomingInterviews.map((interview) => (
            <Card key={interview.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 rounded-lg p-3"><Calendar className="w-5 h-5 text-primary" /></div>
                  <div>
                    <div className="font-medium">{interview.application?.candidate?.name} — {interview.application?.job?.title}</div>
                    <div className="text-sm text-muted flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(interview.scheduled_at), "d MMM yyyy, h:mm a")}</span>
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{interview.interviewer_name}</span>
                      <Badge variant="info">{interview.interview_type === "interview_1" ? "Round 1" : "Round 2"}</Badge>
                      <Badge variant="default">{providerLabel(interview.meeting_provider)}</Badge>
                    </div>
                    {interview.remarks && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{interview.remarks}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {interview.meeting_link && (
                    <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      <Video className="w-4 h-4" /> Join
                    </a>
                  )}
                  {interview.application_form_url && (
                    <a href={interview.application_form_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary">
                      <FileText className="w-3.5 h-3.5" /> Form
                    </a>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setDetailModal(interview)}>Details</Button>
                  <Button size="sm" variant="secondary" onClick={() => setFeedbackModal(interview)}>Score</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Past */}
      <h2 className="text-lg font-semibold mb-3">Completed Interviews</h2>
      {pastInterviews.length === 0 ? (
        <p className="text-sm text-muted">No completed interviews.</p>
      ) : (
        <div className="grid gap-3">
          {pastInterviews.slice(0, 10).map((interview) => (
            <Card key={interview.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-50 rounded-lg p-3"><CheckCircle className="w-5 h-5 text-success" /></div>
                  <div>
                    <div className="font-medium">{interview.application?.candidate?.name} — {interview.application?.job?.title}</div>
                    <div className="text-sm text-muted mt-1">{format(new Date(interview.scheduled_at), "d MMM yyyy")} · {interview.interviewer_name} · {providerLabel(interview.meeting_provider)}</div>
                    {interview.feedback && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{interview.feedback}</p>}
                    {interview.remarks && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{interview.remarks}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {interview.math_score !== null && interview.math_score !== undefined && (
                    <div className="text-center">
                      <div className={`text-sm font-bold ${interview.math_score >= 70 ? "text-success" : interview.math_score >= 50 ? "text-warning" : "text-danger"}`}>
                        {interview.math_score}%
                      </div>
                      <div className="text-xs text-muted">Math</div>
                    </div>
                  )}
                  {interview.score && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < interview.score! ? "text-warning fill-warning" : "text-gray-200"}`} />
                      ))}
                    </div>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setDetailModal(interview)}>Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal open={scheduleModal} onClose={() => { setScheduleModal(false); setScheduleError(null); }} title="Schedule Interview" size="lg">
        <ScheduleForm
          applications={applications.filter((a) => !["hired", "rejected"].includes(a.stage))}
          allCandidates={candidates}
          allJobs={jobs}
          providers={meetingProviders}
          submitting={scheduling}
          error={scheduleError}
          onSubmit={handleSchedule}
          onCancel={() => { setScheduleModal(false); setScheduleError(null); }}
        />
      </Modal>

      {/* Feedback Modal */}
      <Modal open={!!feedbackModal} onClose={() => setFeedbackModal(null)} title="Interview Feedback & Scores" size="lg">
        {feedbackModal && (
          <FeedbackForm
            interview={feedbackModal}
            mathTestFormUrl={mathTestFormUrl}
            onSubmit={handleFeedback}
            onCancel={() => setFeedbackModal(null)}
          />
        )}
      </Modal>

      {/* Detail / Remarks Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Interview Details" size="lg">
        {detailModal && (
          <DetailForm interview={detailModal} mathTestFormUrl={mathTestFormUrl} onSave={handleRemarks} onCancel={() => setDetailModal(null)} />
        )}
      </Modal>
    </div>
  );
}

function ScheduleForm({ applications, allCandidates, allJobs, providers, submitting, error, onSubmit, onCancel }: {
  applications: Application[];
  allCandidates: { id: string; name: string; email: string }[];
  allJobs: { id: string; title: string; department: string }[];
  providers: string[];
  submitting: boolean;
  error: string | null;
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"application" | "candidate">(
    applications.length > 0 ? "application" : "candidate"
  );
  const [form, setForm] = useState({
    application_id: applications[0]?.id || "",
    candidate_id: allCandidates[0]?.id || "",
    job_id: allJobs[0]?.id || "",
    interview_type: "interview_1",
    scheduled_at: "",
    duration_minutes: "60",
    meeting_provider: providers[0] || "google_meet",
    interviewer_name: "",
    interviewer_email: "",
    remarks: "",
  });

  const providerOptions = providers.map((p) => ({ value: p, label: MEETING_PROVIDER_LABELS[p] || p }));

  // When a candidate is selected in candidate mode, check if they already have an application
  const selectedCandidateApps = applications.filter((a) => a.candidate_id === form.candidate_id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "application") {
      onSubmit({ ...form, candidate_id: "", job_id: "" });
    } else {
      onSubmit({ ...form, application_id: "" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden text-sm">
        <button type="button"
          className={`flex-1 py-2 font-medium transition-colors ${mode === "application" ? "bg-primary text-white" : "bg-white text-muted hover:bg-gray-50"}`}
          onClick={() => setMode("application")}>
          From Existing Application
        </button>
        <button type="button"
          className={`flex-1 py-2 font-medium transition-colors ${mode === "candidate" ? "bg-primary text-white" : "bg-white text-muted hover:bg-gray-50"}`}
          onClick={() => setMode("candidate")}>
          Any Candidate
        </button>
      </div>

      {mode === "application" ? (
        applications.length === 0 ? (
          <p className="text-sm text-muted text-center py-3 bg-gray-50 rounded-lg">
            No active applications. Switch to <strong>Any Candidate</strong> tab to schedule directly.
          </p>
        ) : (
          <Select label="Candidate & Position *" value={form.application_id}
            onChange={(e) => setForm({ ...form, application_id: e.target.value })}
            options={applications.map((a) => ({ value: a.id, label: `${a.candidate?.name} — ${a.job?.title} (${a.stage})` }))} />
        )
      ) : (
        <div className="space-y-3">
          <Select label="Candidate *" value={form.candidate_id}
            onChange={(e) => setForm({ ...form, candidate_id: e.target.value })}
            options={[
              { value: "", label: "— Select Candidate —" },
              ...allCandidates.map((c) => ({ value: c.id, label: `${c.name} (${c.email})` })),
            ]} />
          {selectedCandidateApps.length > 0 ? (
            <Select label="Applied Position *" value={form.job_id}
              onChange={(e) => setForm({ ...form, job_id: e.target.value })}
              options={selectedCandidateApps.map((a) => ({ value: a.job_id, label: `${a.job?.title} (${a.stage})` }))} />
          ) : (
            <Select label="Job Position *" value={form.job_id}
              onChange={(e) => setForm({ ...form, job_id: e.target.value })}
              options={[
                { value: "", label: "— Select Position —" },
                ...allJobs.map((j) => ({ value: j.id, label: `${j.title} (${j.department})` })),
              ]} />
          )}
          {selectedCandidateApps.length === 0 && form.job_id && (
            <p className="text-xs text-muted bg-blue-50 rounded px-3 py-2">
              An application will be automatically created for this candidate when you schedule the interview.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select label="Interview Round *" value={form.interview_type}
          onChange={(e) => setForm({ ...form, interview_type: e.target.value })}
          options={[{ value: "interview_1", label: "Interview 1" }, { value: "interview_2", label: "Interview 2" }]} />
        <Select label="Meeting Venue *" value={form.meeting_provider}
          onChange={(e) => setForm({ ...form, meeting_provider: e.target.value })}
          options={providerOptions} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date & Time *" type="datetime-local" value={form.scheduled_at}
          onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required />
        <Input label="Duration (min)" type="number" value={form.duration_minutes}
          onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Interviewer Name *" value={form.interviewer_name}
          onChange={(e) => setForm({ ...form, interviewer_name: e.target.value })} required />
        <Input label="Interviewer Email *" type="email" value={form.interviewer_email}
          onChange={(e) => setForm({ ...form, interviewer_email: e.target.value })} required />
      </div>
      <Textarea
        label="Remarks for Candidate"
        value={form.remarks}
        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
        placeholder="e.g. Please bring the following documents:&#10;- IC / Passport (original + copy)&#10;- Latest resume&#10;- Academic certificates&#10;- Last 3 months payslips&#10;- Expected salary details"
        rows={4}
      />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" loading={submitting}>
          {submitting ? "Scheduling..." : "Schedule & Send Invite"}
        </Button>
      </div>
    </form>
  );
}

function FeedbackForm({ interview, mathTestFormUrl, onSubmit, onCancel }: {
  interview: Interview;
  mathTestFormUrl: string;
  onSubmit: (id: string, score: number, feedback: string, mathScore: number | null) => void;
  onCancel: () => void;
}) {
  const [score, setScore] = useState(interview.score || 3);
  const [feedback, setFeedback] = useState(interview.feedback || "");
  const [mathScore, setMathScore] = useState<string>(
    interview.math_score !== null && interview.math_score !== undefined ? String(interview.math_score) : ""
  );

  const mathScoreNum = mathScore === "" ? null : parseInt(mathScore);
  const mathScoreColor = mathScoreNum === null ? "" : mathScoreNum >= 70 ? "text-success" : mathScoreNum >= 50 ? "text-warning" : "text-danger";

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(interview.id, score, feedback, mathScoreNum); }} className="space-y-5">
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="font-medium">{interview.application?.candidate?.name} — {interview.application?.job?.title}</p>
        <p className="text-xs text-muted mt-0.5">{format(new Date(interview.scheduled_at), "d MMM yyyy, h:mm a")} · {interview.interviewer_name}</p>
      </div>

      {/* Math Test Section */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-gray-700">Mathematics Test</span>
          </div>
          {mathTestFormUrl && (
            <a href={mathTestFormUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium">
              <ExternalLink className="w-3 h-3" />
              Open Google Form
            </a>
          )}
        </div>
        <p className="text-xs text-muted">Share the Google Form with the candidate during the interview, then enter their score below after reviewing the responses.</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Math Score (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={mathScore}
              onChange={(e) => setMathScore(e.target.value)}
              placeholder="e.g. 85"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          {mathScoreNum !== null && (
            <div className="text-center pt-5">
              <div className={`text-2xl font-bold ${mathScoreColor}`}>{mathScoreNum}%</div>
              <div className="text-xs text-muted">{mathScoreNum >= 70 ? "Pass" : mathScoreNum >= 50 ? "Borderline" : "Fail"}</div>
            </div>
          )}
        </div>
      </div>

      {/* Interview Score */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Overall Interview Score (1–5) *</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => setScore(s)} className="p-1">
              <Star className={`w-8 h-8 ${s <= score ? "text-warning fill-warning" : "text-gray-200 hover:text-gray-300"}`} />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted">{score}/5</span>
        </div>
      </div>

      <Textarea label="Interviewer Feedback *" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Share your assessment of the candidate..." rows={5} required />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Submit Feedback</Button>
      </div>
    </form>
  );
}

function DetailForm({ interview, mathTestFormUrl, onSave, onCancel }: {
  interview: Interview;
  mathTestFormUrl: string;
  onSave: (id: string, remarks: string, formFile: File | null) => void;
  onCancel: () => void;
}) {
  const [remarks, setRemarks] = useState(interview.remarks || "");
  const [formFile, setFormFile] = useState<File | null>(null);

  const mathScoreColor = interview.math_score !== null && interview.math_score !== undefined
    ? (interview.math_score >= 70 ? "text-success" : interview.math_score >= 50 ? "text-warning" : "text-danger")
    : "";

  return (
    <div className="space-y-5">
      {/* Info summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted">Candidate</span><span className="font-medium">{interview.application?.candidate?.name}</span></div>
        <div className="flex justify-between"><span className="text-muted">Job</span><span>{interview.application?.job?.title}</span></div>
        <div className="flex justify-between"><span className="text-muted">Round</span><span>{interview.interview_type === "interview_1" ? "Interview 1" : "Interview 2"}</span></div>
        <div className="flex justify-between"><span className="text-muted">Date & Time</span><span>{format(new Date(interview.scheduled_at), "d MMM yyyy, h:mm a")}</span></div>
        <div className="flex justify-between"><span className="text-muted">Duration</span><span>{interview.duration_minutes} min</span></div>
        <div className="flex justify-between"><span className="text-muted">Venue</span><span>{MEETING_PROVIDER_LABELS[interview.meeting_provider] || interview.meeting_provider}</span></div>
        <div className="flex justify-between"><span className="text-muted">Interviewer</span><span>{interview.interviewer_name}</span></div>
        {interview.meeting_link && (
          <div className="flex justify-between"><span className="text-muted">Meeting Link</span>
            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1"><Video className="w-3.5 h-3.5" />Join</a>
          </div>
        )}
        {interview.math_score !== null && interview.math_score !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-muted flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />Math Score</span>
            <span className={`font-bold ${mathScoreColor}`}>
              {interview.math_score}% — {interview.math_score >= 70 ? "Pass" : interview.math_score >= 50 ? "Borderline" : "Fail"}
            </span>
          </div>
        )}
        {interview.score && (
          <div className="flex justify-between items-center"><span className="text-muted">Interview Score</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < interview.score! ? "text-warning fill-warning" : "text-gray-200"}`} />
              ))}
            </div>
          </div>
        )}
        {interview.feedback && (
          <div><span className="text-muted block mb-1">Feedback</span><p className="text-gray-700 text-xs bg-white rounded p-2 border border-border">{interview.feedback}</p></div>
        )}
      </div>

      {/* Math Test Link */}
      {mathTestFormUrl && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Mathematics Test Form</span>
          </div>
          <a href={mathTestFormUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
            <ExternalLink className="w-3 h-3" />
            Open Form
          </a>
        </div>
      )}

      {/* Existing form */}
      {interview.application_form_url && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <FileText className="w-4 h-4 text-primary" />
          <a href={interview.application_form_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
            View Uploaded Application Form
          </a>
        </div>
      )}

      {/* Remarks & form upload */}
      <form onSubmit={(e) => { e.preventDefault(); onSave(interview.id, remarks, formFile); }} className="space-y-4">
        <Textarea label="Remarks / Documentation" value={remarks} onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add internal notes, documentation, or observations..." rows={3} />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Upload Job Application Form</label>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.png"
            onChange={(e) => setFormFile(e.target.files?.[0] || null)}
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-light file:cursor-pointer"
          />
          <p className="text-xs text-muted">Upload the candidate&apos;s signed job application form (PDF, DOC, JPG)</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onCancel}>Close</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
