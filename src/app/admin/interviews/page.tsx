"use client";

import { useEffect, useState, useCallback } from "react";
import { Interview, Application } from "@/lib/types";
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
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<Interview | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [suggestRejectAlert, setSuggestRejectAlert] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [intRes, appRes] = await Promise.all([
      fetch("/api/interviews"),
      fetch("/api/applications"),
    ]);
    setInterviews(await intRes.json());
    setApplications(await appRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  const getInterviewsForDay = (day: Date) =>
    interviews.filter((i) => isSameDay(new Date(i.scheduled_at), day));

  async function handleSchedule(formData: Record<string, string>) {
    await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        application_id: formData.application_id,
        interview_type: formData.interview_type,
        scheduled_at: formData.scheduled_at,
        duration_minutes: parseInt(formData.duration_minutes),
        meeting_provider: formData.meeting_provider,
        interviewer_name: formData.interviewer_name,
        interviewer_email: formData.interviewer_email,
      }),
    });
    setScheduleModal(false);
    fetchData();
  }

  async function handleFeedback(interviewId: string, score: number, feedback: string) {
    const res = await fetch("/api/interviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: interviewId, score, feedback, completed: true }),
    });
    const data = await res.json();
    if (data.suggest_reject) {
      setSuggestRejectAlert(data.message);
    }
    setFeedbackModal(null);
    fetchData();
  }

  if (loading) {
    return <div className="text-center py-12 text-muted">Loading...</div>;
  }

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
        <Button onClick={() => setScheduleModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Schedule Interview
        </Button>
      </div>

      {suggestRejectAlert && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">{suggestRejectAlert}</p>
            <button onClick={() => setSuggestRejectAlert(null)} className="text-xs text-yellow-600 mt-1 hover:underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-gray-100">
              &larr;
            </button>
            <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-gray-100">
              &rarr;
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted py-2">{d}</div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dayInterviews = getInterviewsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-1 border border-border rounded ${
                    isToday ? "bg-primary/5 border-primary/30" : ""
                  }`}
                >
                  <div className={`text-xs mb-1 ${isToday ? "font-bold text-primary" : "text-muted"}`}>
                    {format(day, "d")}
                  </div>
                  {dayInterviews.map((interview) => (
                    <button
                      key={interview.id}
                      onClick={() => !interview.completed && setFeedbackModal(interview)}
                      className={`w-full text-left text-xs px-1 py-0.5 rounded mb-0.5 truncate ${
                        interview.completed
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      {format(new Date(interview.scheduled_at), "HH:mm")}{" "}
                      {interview.application?.candidate?.name?.split(" ")[0]}
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
                  <div className="bg-primary/10 rounded-lg p-3">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {interview.application?.candidate?.name} — {interview.application?.job?.title}
                    </div>
                    <div className="text-sm text-muted flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(interview.scheduled_at), "d MMM yyyy, h:mm a")}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {interview.interviewer_name}
                      </span>
                      <Badge variant="info">
                        {interview.interview_type === "interview_1" ? "Round 1" : "Round 2"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {interview.meeting_link && (
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Video className="w-4 h-4" />
                      Join
                    </a>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setFeedbackModal(interview)}>
                    Score
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Past Interviews */}
      <h2 className="text-lg font-semibold mb-3">Completed Interviews</h2>
      {pastInterviews.length === 0 ? (
        <p className="text-sm text-muted">No completed interviews.</p>
      ) : (
        <div className="grid gap-3">
          {pastInterviews.slice(0, 10).map((interview) => (
            <Card key={interview.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {interview.application?.candidate?.name} — {interview.application?.job?.title}
                    </div>
                    <div className="text-sm text-muted mt-1">
                      {format(new Date(interview.scheduled_at), "d MMM yyyy")} · {interview.interviewer_name}
                    </div>
                    {interview.feedback && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{interview.feedback}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {interview.score && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < interview.score! ? "text-warning fill-warning" : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal open={scheduleModal} onClose={() => setScheduleModal(false)} title="Schedule Interview" size="lg">
        <ScheduleForm
          applications={applications.filter((a) =>
            ["screened", "interview_1", "interview_2"].includes(a.stage)
          )}
          onSubmit={handleSchedule}
          onCancel={() => setScheduleModal(false)}
        />
      </Modal>

      {/* Feedback Modal */}
      <Modal
        open={!!feedbackModal}
        onClose={() => setFeedbackModal(null)}
        title="Interview Feedback"
      >
        {feedbackModal && (
          <FeedbackForm
            interview={feedbackModal}
            onSubmit={handleFeedback}
            onCancel={() => setFeedbackModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function ScheduleForm({
  applications,
  onSubmit,
  onCancel,
}: {
  applications: Application[];
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    application_id: applications[0]?.id || "",
    interview_type: "interview_1",
    scheduled_at: "",
    duration_minutes: "60",
    meeting_provider: "google_meet",
    interviewer_name: "",
    interviewer_email: "",
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <Select
        label="Candidate *"
        value={form.application_id}
        onChange={(e) => setForm({ ...form, application_id: e.target.value })}
        options={applications.map((a) => ({
          value: a.id,
          label: `${a.candidate?.name} — ${a.job?.title} (${a.stage})`,
        }))}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Interview Round *"
          value={form.interview_type}
          onChange={(e) => setForm({ ...form, interview_type: e.target.value })}
          options={[
            { value: "interview_1", label: "Interview 1" },
            { value: "interview_2", label: "Interview 2" },
          ]}
        />
        <Select
          label="Meeting Provider *"
          value={form.meeting_provider}
          onChange={(e) => setForm({ ...form, meeting_provider: e.target.value })}
          options={[
            { value: "google_meet", label: "Google Meet" },
            { value: "zoom", label: "Zoom" },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date & Time *"
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
          required
        />
        <Input
          label="Duration (minutes)"
          type="number"
          value={form.duration_minutes}
          onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Interviewer Name *"
          value={form.interviewer_name}
          onChange={(e) => setForm({ ...form, interviewer_name: e.target.value })}
          required
        />
        <Input
          label="Interviewer Email *"
          type="email"
          value={form.interviewer_email}
          onChange={(e) => setForm({ ...form, interviewer_email: e.target.value })}
          required
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Schedule & Send Invite</Button>
      </div>
    </form>
  );
}

function FeedbackForm({
  interview,
  onSubmit,
  onCancel,
}: {
  interview: Interview;
  onSubmit: (id: string, score: number, feedback: string) => void;
  onCancel: () => void;
}) {
  const [score, setScore] = useState(interview.score || 3);
  const [feedback, setFeedback] = useState(interview.feedback || "");

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(interview.id, score, feedback); }}
      className="space-y-4"
    >
      <div>
        <p className="text-sm text-muted mb-2">
          {interview.application?.candidate?.name} — {interview.application?.job?.title}
        </p>
        <p className="text-xs text-muted">
          {format(new Date(interview.scheduled_at), "d MMM yyyy, h:mm a")} · {interview.interviewer_name}
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Score (1-5) *</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScore(s)}
              className="p-1"
            >
              <Star
                className={`w-8 h-8 ${
                  s <= score ? "text-warning fill-warning" : "text-gray-200 hover:text-gray-300"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted">{score}/5</span>
        </div>
      </div>

      <Textarea
        label="Feedback *"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Share your assessment of the candidate..."
        rows={5}
        required
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Submit Feedback</Button>
      </div>
    </form>
  );
}
