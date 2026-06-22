"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Candidate, STAGE_LABELS, ApplicationStage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Tag, ExternalLink, X, Plus, Upload, FileText } from "lucide-react";

type CandidateWithApps = Candidate & {
  applications: { id: string; stage: ApplicationStage; job: { title: string } | null }[];
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateWithApps[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingTagFor, setAddingTagFor] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchCandidates = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tagFilter) params.set("tag", tagFilter);
    const res = await fetch(`/api/candidates?${params}`);
    setCandidates(await res.json());
    setLoading(false);
  }, [search, tagFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(timer);
  }, [fetchCandidates]);

  const allTags = [...new Set(candidates.flatMap((c) => c.tags))].sort();

  async function addTag(candidateId: string, tag: string) {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate || candidate.tags.includes(tag)) return;
    const updatedTags = [...candidate.tags, tag];
    await fetch("/api/candidates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: candidateId, tags: updatedTags }),
    });
    fetchCandidates();
    setAddingTagFor(null);
    setNewTag("");
  }

  async function removeTag(candidateId: string, tag: string) {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;
    const updatedTags = candidate.tags.filter((t) => t !== tag);
    await fetch("/api/candidates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: candidateId, tags: updatedTags }),
    });
    fetchCandidates();
  }

  async function handleResumeUpload(candidateId: string, file: File) {
    setUploadingFor(candidateId);
    const formData = new FormData();
    formData.append("resume", file);

    await fetch(`/api/candidates/${candidateId}/resume`, {
      method: "POST",
      body: formData,
    });

    setUploadingFor(null);
    fetchCandidates();
  }

  const stageBadgeVariant = (stage: string) => {
    if (stage === "hired") return "success";
    if (stage === "rejected") return "danger";
    if (stage === "offer") return "warning";
    return "info";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <p className="text-sm text-muted mt-1">Search and manage candidate pool</p>
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
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-6 py-3 font-medium text-muted">Contact</th>
                <th className="text-left px-6 py-3 font-medium text-muted">Tags</th>
                <th className="text-left px-6 py-3 font-medium text-muted">Applications</th>
                <th className="text-left px-6 py-3 font-medium text-muted">Resume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidates.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{c.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{c.email}</div>
                    <div className="text-muted text-xs">{c.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 items-center">
                      {c.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                          <button onClick={() => removeTag(c.id, tag)} className="hover:text-danger">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {addingTagFor === c.id ? (
                        <form
                          onSubmit={(e) => { e.preventDefault(); if (newTag.trim()) addTag(c.id, newTag.trim()); }}
                          className="inline-flex items-center"
                        >
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className="!py-0.5 !px-2 !text-xs w-24"
                            placeholder="tag"
                            autoFocus
                          />
                        </form>
                      ) : (
                        <button
                          onClick={() => { setAddingTagFor(c.id); setNewTag(""); }}
                          className="p-0.5 rounded hover:bg-gray-100"
                        >
                          <Plus className="w-3.5 h-3.5 text-muted" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {c.applications.map((app) => (
                        <div key={app.id} className="flex items-center gap-2">
                          <Badge variant={stageBadgeVariant(app.stage)}>
                            {STAGE_LABELS[app.stage]}
                          </Badge>
                          <span className="text-xs text-muted">{app.job?.title}</span>
                        </div>
                      ))}
                      {c.applications.length === 0 && (
                        <span className="text-xs text-muted">No applications</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {c.resume_url ? (
                        <a
                          href={c.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Resume
                        </a>
                      ) : (
                        <span className="text-xs text-muted">No resume</span>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current[c.id] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleResumeUpload(c.id, file);
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => fileInputRefs.current[c.id]?.click()}
                        disabled={uploadingFor === c.id}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingFor === c.id
                          ? "Uploading..."
                          : c.resume_url
                          ? "Replace"
                          : "Upload Resume"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
