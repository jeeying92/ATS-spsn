"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Candidate, CandidateScore, STAGE_LABELS, STAGES, ApplicationStage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Search, Tag, FileText, X, Plus, Upload, Pencil, Trash2, UserPlus, Star, ClipboardCheck } from "lucide-react";

type CandidateWithApps = Candidate & {
  applications: { id: string; stage: ApplicationStage; job: { title: string } | null }[];
};

const SCORE_CRITERIA = [
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Technical Skills" },
  { key: "communication", label: "Communication" },
  { key: "culture_fit", label: "Culture Fit" },
] as const;

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateWithApps[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingTagFor, setAddingTagFor] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CandidateWithApps | null>(null);
  const [scoreModal, setScoreModal] = useState<CandidateWithApps | null>(null);
  const [scores, setScores] = useState<Record<string, CandidateScore | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchCandidates = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tagFilter) params.set("tag", tagFilter);
    const res = await fetch(`/api/candidates?${params}`);
    const data = await res.json();
    setCandidates(data);
    setLoading(false);

    // Fetch scores for all candidates
    const scoreMap: Record<string, CandidateScore | null> = {};
    await Promise.all(
      data.map(async (c: CandidateWithApps) => {
        const r = await fetch(`/api/candidates/${c.id}/score`);
        scoreMap[c.id] = r.ok ? await r.json() : null;
      })
    );
    setScores(scoreMap);
  }, [search, tagFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(timer);
  }, [fetchCandidates]);

  const allTags = [...new Set(candidates.flatMap((c) => c.tags))].sort();

  async function addTag(candidateId: string, tag: string) {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate || candidate.tags.includes(tag)) return;
    await fetch("/api/candidates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: candidateId, tags: [...candidate.tags, tag] }),
    });
    fetchCandidates();
    setAddingTagFor(null);
    setNewTag("");
  }

  async function removeTag(candidateId: string, tag: string) {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;
    await fetch("/api/candidates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: candidateId, tags: candidate.tags.filter((t) => t !== tag) }),
    });
    fetchCandidates();
  }

  async function handleResumeUpload(candidateId: string, file: File) {
    setUploadingFor(candidateId);
    const formData = new FormData();
    formData.append("resume", file);
    await fetch(`/api/candidates/${candidateId}/resume`, { method: "POST", body: formData });
    setUploadingFor(null);
    fetchCandidates();
  }

  async function handleSave(data: { name: string; email: string; phone: string; source: string }) {
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...data } : data;
    const res = await fetch("/api/candidates", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to save");
      return;
    }
    setModalOpen(false);
    setEditing(null);
    fetchCandidates();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete candidate "${name}"? This will also delete all their applications.`)) return;
    await fetch("/api/candidates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchCandidates();
  }

  async function handleStageChange(appId: string, newStage: string) {
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    fetchCandidates();
  }

  async function handleScoreSave(candidateId: string, scoreData: Record<string, unknown>) {
    await fetch(`/api/candidates/${candidateId}/score`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scoreData),
    });
    setScoreModal(null);
    fetchCandidates();
  }

  const stageBadgeVariant = (stage: string) => {
    if (stage === "hired") return "success";
    if (stage === "rejected") return "danger";
    if (stage === "offer") return "warning";
    return "info";
  };

  const scoreColor = (score: number) => {
    if (score >= 4) return "text-success";
    if (score >= 3) return "text-accent";
    if (score >= 2) return "text-warning";
    return "text-danger";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-sm text-muted mt-1">Search, score, and manage candidate pool</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Candidate
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border text-sm bg-white"
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading...</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 text-muted">No candidates found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Score</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Tags</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Applications</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Resume</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidates.map((c) => {
                const score = scores[c.id];
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 text-xs">{c.email}</div>
                      <div className="text-muted text-xs">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      {score ? (
                        <button
                          onClick={() => setScoreModal(c)}
                          className={`font-bold text-lg ${scoreColor(score.overall_score)} hover:opacity-70`}
                          title="Click to edit score"
                        >
                          {score.overall_score.toFixed(1)}
                          <span className="text-xs text-muted font-normal">/5</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setScoreModal(c)}
                          className="text-xs text-muted hover:text-primary flex items-center gap-1"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" /> Score
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 items-center">
                        {c.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                            <Tag className="w-3 h-3" />{tag}
                            <button onClick={() => removeTag(c.id, tag)} className="hover:text-danger"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                        {addingTagFor === c.id ? (
                          <form onSubmit={(e) => { e.preventDefault(); if (newTag.trim()) addTag(c.id, newTag.trim()); }} className="inline-flex">
                            <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} className="!py-0.5 !px-2 !text-xs w-24" placeholder="tag" autoFocus />
                          </form>
                        ) : (
                          <button onClick={() => { setAddingTagFor(c.id); setNewTag(""); }} className="p-0.5 rounded hover:bg-gray-100">
                            <Plus className="w-3.5 h-3.5 text-muted" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        {c.applications.map((app) => (
                          <div key={app.id} className="flex items-center gap-2">
                            <select
                              value={app.stage}
                              onChange={(e) => handleStageChange(app.id, e.target.value)}
                              className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${
                                app.stage === "hired" ? "bg-green-100 text-green-700" :
                                app.stage === "rejected" ? "bg-red-100 text-red-700" :
                                app.stage === "offer" ? "bg-yellow-100 text-yellow-800" :
                                "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {[...STAGES, "rejected" as ApplicationStage].map((s) => (
                                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                              ))}
                            </select>
                            <span className="text-xs text-muted truncate max-w-[100px]">{app.job?.title}</span>
                          </div>
                        ))}
                        {c.applications.length === 0 && <span className="text-xs text-muted">No applications</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {c.resume_url ? (
                          <a href={c.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                            <FileText className="w-3.5 h-3.5" /> View
                          </a>
                        ) : (
                          <span className="text-xs text-muted">None</span>
                        )}
                        <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                          ref={(el) => { fileInputRefs.current[c.id] = el; }}
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleResumeUpload(c.id, file); e.target.value = ""; }}
                        />
                        <button onClick={() => fileInputRefs.current[c.id]?.click()} disabled={uploadingFor === c.id}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary disabled:opacity-50">
                          <Upload className="w-3.5 h-3.5" />{uploadingFor === c.id ? "..." : c.resume_url ? "Replace" : "Upload"}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setScoreModal(c)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Score Resume">
                          <Star className="w-4 h-4 text-accent" />
                        </button>
                        <button onClick={() => { setEditing(c); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-gray-100" title="Edit">
                          <Pencil className="w-4 h-4 text-muted" />
                        </button>
                        <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Delete">
                          <Trash2 className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Edit Candidate" : "Add Candidate"}>
        <CandidateForm initial={editing} onSave={handleSave} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>

      {/* Score Modal */}
      <Modal open={!!scoreModal} onClose={() => setScoreModal(null)} title="Resume Score Card" size="lg">
        {scoreModal && (
          <ScoreForm
            candidate={scoreModal}
            existing={scores[scoreModal.id] || null}
            onSave={(data) => handleScoreSave(scoreModal.id, data)}
            onCancel={() => setScoreModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function CandidateForm({ initial, onSave, onCancel }: {
  initial: CandidateWithApps | null;
  onSave: (data: { name: string; email: string; phone: string; source: string }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "", email: initial?.email || "",
    phone: initial?.phone || "", source: initial?.source || "manual",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Ahmad Rizal bin Ibrahim" />
      <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <Select label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} options={[
        { value: "manual", label: "Manual Entry" }, { value: "website", label: "Website" },
        { value: "linkedin", label: "LinkedIn" }, { value: "referral", label: "Referral" },
        { value: "jobstreet", label: "JobStreet" }, { value: "walk_in", label: "Walk-in" },
        { value: "agency", label: "Agency" },
      ]} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? "Save Changes" : "Add Candidate"}</Button>
      </div>
    </form>
  );
}

function ScoreForm({ candidate, existing, onSave, onCancel }: {
  candidate: CandidateWithApps;
  existing: CandidateScore | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [scores, setScores] = useState({
    experience: existing?.experience || 3,
    education: existing?.education || 3,
    skills: existing?.skills || 3,
    communication: existing?.communication || 3,
    culture_fit: existing?.culture_fit || 3,
  });
  const [notes, setNotes] = useState(existing?.notes || "");

  const overall = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

  const overallColor = overall >= 4 ? "text-success" : overall >= 3 ? "text-accent" : overall >= 2 ? "text-warning" : "text-danger";

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...scores, notes }); }} className="space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div>
          <div className="font-semibold">{candidate.name}</div>
          <div className="text-xs text-muted">{candidate.email}</div>
        </div>
        {candidate.resume_url && (
          <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> View Resume
          </a>
        )}
      </div>

      {/* Overall score display */}
      <div className="text-center py-3 bg-gray-50 rounded-lg">
        <div className={`text-4xl font-bold ${overallColor}`}>{overall.toFixed(1)}</div>
        <div className="text-xs text-muted mt-1">Overall Score / 5.0</div>
      </div>

      {/* Criteria */}
      <div className="space-y-4">
        {SCORE_CRITERIA.map(({ key, label }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <span className="text-sm font-bold">{scores[key as keyof typeof scores]}/5</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setScores({ ...scores, [key]: s })} className="p-0.5">
                  <Star className={`w-7 h-7 ${s <= scores[key as keyof typeof scores] ? "text-accent fill-accent" : "text-gray-200 hover:text-gray-300"}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Textarea label="Notes / Comments" value={notes} onChange={(e) => setNotes(e.target.value)}
        placeholder="Resume review notes, strengths, areas of concern..." rows={3} />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{existing ? "Update Score" : "Save Score"}</Button>
      </div>
    </form>
  );
}
