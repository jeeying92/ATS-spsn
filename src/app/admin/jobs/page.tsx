"use client";

import { useEffect, useState, useCallback } from "react";
import { Job } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Plus, Pencil, Copy, Trash2, Users, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

type JobWithCount = Job & { applicant_count: number };

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobWithCount | null>(null);

  const fetchJobs = useCallback(async () => {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function handleSave(formData: Record<string, unknown>) {
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...formData } : formData;

    await fetch("/api/jobs", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setModalOpen(false);
    setEditing(null);
    fetchJobs();
  }

  async function handleDuplicate(job: JobWithCount) {
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${job.title} (Copy)`,
        department: job.department,
        location: job.location,
        employment_type: job.employment_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits,
        status: "draft",
      }),
    });
    fetchJobs();
  }

  async function handleToggleStatus(job: JobWithCount) {
    const newStatus = job.status === "published" ? "closed" : "published";
    await fetch("/api/jobs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: job.id, status: newStatus }),
    });
    fetchJobs();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this job?")) return;
    await fetch("/api/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchJobs();
  }

  const statusBadge = (status: string) => {
    const variant = status === "published" ? "success" : status === "draft" ? "warning" : "default";
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted mt-1">Manage job postings</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Job
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-muted">Title</th>
                <th className="text-left px-6 py-3 font-medium text-muted">Department</th>
                <th className="text-left px-6 py-3 font-medium text-muted">Status</th>
                <th className="text-left px-6 py-3 font-medium text-muted">Applicants</th>
                <th className="text-right px-6 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/jobs/${job.id}/pipeline`}
                      className="font-medium text-gray-900 hover:text-primary"
                    >
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted">{job.department}</td>
                  <td className="px-6 py-4">{statusBadge(job.status)}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/jobs/${job.id}/pipeline`}
                      className="flex items-center gap-1 text-muted hover:text-primary"
                    >
                      <Users className="w-4 h-4" />
                      {job.applicant_count}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(job)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title={job.status === "published" ? "Close" : "Publish"}
                      >
                        {job.status === "published" ? (
                          <EyeOff className="w-4 h-4 text-muted" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted" />
                        )}
                      </button>
                      <button
                        onClick={() => { setEditing(job); setModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-muted" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(job)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4 text-muted" />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? "Edit Job" : "New Job"}
        size="lg"
      >
        <JobForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
}

function JobForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: JobWithCount | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    department: initial?.department || "Engineering",
    location: initial?.location || "Nilai, Negeri Sembilan",
    employment_type: initial?.employment_type || "full_time",
    salary_min: initial?.salary_min || "",
    salary_max: initial?.salary_max || "",
    description: initial?.description || "",
    requirements: initial?.requirements || "",
    benefits: initial?.benefits || "",
    status: initial?.status || "draft",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          salary_min: form.salary_min ? Number(form.salary_min) : null,
          salary_max: form.salary_max ? Number(form.salary_max) : null,
        });
      }}
      className="space-y-4"
    >
      <Input label="Job Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Department *"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          options={[
            { value: "Engineering", label: "Engineering" },
            { value: "Quality", label: "Quality" },
            { value: "Production", label: "Production" },
            { value: "HR", label: "HR" },
            { value: "Finance", label: "Finance" },
          ]}
        />
        <Select
          label="Employment Type *"
          value={form.employment_type}
          onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
          options={[
            { value: "full_time", label: "Full Time" },
            { value: "part_time", label: "Part Time" },
            { value: "contract", label: "Contract" },
          ]}
        />
      </div>
      <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Min Salary (RM)" type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
        <Input label="Max Salary (RM)" type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
      </div>
      <Textarea label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required />
      <Textarea label="Requirements" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={4} />
      <Textarea label="Benefits" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={4} />
      <Select
        label="Status"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" | "closed" })}
        options={[
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
          { value: "closed", label: "Closed" },
        ]}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Job</Button>
      </div>
    </form>
  );
}
