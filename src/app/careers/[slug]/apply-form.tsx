"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

export function ApplyForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("job_id", jobId);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Application Submitted!</h3>
        <p className="text-muted mt-2 max-w-md mx-auto">
          Thank you for applying for the {jobTitle} position. We will review your application and contact you within 5-7 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        label="Full Name *"
        name="name"
        required
        placeholder="e.g. Ahmad Rizal bin Ibrahim"
      />

      <Input
        label="Email Address *"
        name="email"
        type="email"
        required
        placeholder="e.g. ahmad@email.com"
      />

      <Input
        label="Phone Number *"
        name="phone"
        type="tel"
        required
        placeholder="e.g. +60 12-345 6789"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Resume (PDF, max 5MB) *
        </label>
        <input
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx"
          required
          className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-dark hover:file:bg-accent-light file:cursor-pointer"
        />
      </div>

      <Textarea
        label="Cover Letter"
        name="cover_letter"
        placeholder="Tell us why you're interested in this role..."
        rows={5}
      />

      <Button type="submit" loading={loading} size="lg" variant="accent" className="w-full">
        Submit Application
      </Button>
    </form>
  );
}
