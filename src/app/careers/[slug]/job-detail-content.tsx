"use client";

import { Job } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { MapPin, Clock, Banknote, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ApplyForm } from "./apply-form";

export function JobDetailContent({ job }: { job: Job }) {
  const { t } = useLocale();

  const empType =
    job.employment_type === "full_time"
      ? t("fullTime")
      : job.employment_type === "part_time"
      ? t("partTime")
      : t("contract");

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb bar */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToOpenings")}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-3">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-5 mt-3 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-accent/70" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent/70" />
              {empType}
            </span>
            {(job.salary_min || job.salary_max) && (
              <span className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-accent/70" />
                {job.salary_min && job.salary_max
                  ? `RM ${job.salary_min.toLocaleString()} – RM ${job.salary_max.toLocaleString()}`
                  : job.salary_min
                  ? `From RM ${job.salary_min.toLocaleString()}`
                  : `Up to RM ${job.salary_max!.toLocaleString()}`}
              </span>
            )}
            <span className="px-3 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
              {job.department}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl border border-border p-8">
              <h2 className="text-lg font-bold text-primary mb-4">{t("aboutRole")}</h2>
              <div className="section-divider mb-5" />
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">{job.description}</p>
            </div>

            {job.requirements && (
              <div className="bg-white rounded-xl border border-border p-8">
                <h2 className="text-lg font-bold text-primary mb-4">{t("requirements")}</h2>
                <div className="section-divider mb-5" />
                <div className="text-gray-600 whitespace-pre-line leading-relaxed">{job.requirements}</div>
              </div>
            )}

            {job.benefits && (
              <div className="bg-white rounded-xl border border-border p-8">
                <h2 className="text-lg font-bold text-primary mb-4">{t("benefits")}</h2>
                <div className="section-divider mb-5" />
                <div className="text-gray-600 whitespace-pre-line leading-relaxed">{job.benefits}</div>
              </div>
            )}
          </div>

          {/* Sidebar - Apply form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-border p-8 sticky top-8">
              <h2 className="text-lg font-bold text-primary mb-1">{t("applyNow")}</h2>
              <p className="text-sm text-muted mb-5">{t("applyFormDesc")}</p>
              <div className="section-divider mb-6" />
              <ApplyForm jobId={job.id} jobTitle={job.title} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
