"use client";

import { useState } from "react";
import Link from "next/link";
import { Job } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { MapPin, Clock, Banknote, Search, ArrowRight } from "lucide-react";

export function JobGrid({ jobs }: { jobs: Job[] }) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const { t } = useLocale();

  const departments = [...new Set(jobs.map((j) => j.department))];

  const filtered = jobs.filter((job) => {
    const matchesSearch =
      !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.department.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !department || job.department === department;
    return matchesSearch && matchesDept;
  });

  const empType = (type: string) => {
    if (type === "full_time") return t("fullTime");
    if (type === "part_time") return t("partTime");
    return t("contract");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-10 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder={t("searchPositions")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-4 py-3 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        >
          <option value="">{t("allDepartments")}</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg">{t("noPositions")}</p>
          <p className="text-sm mt-1">{t("tryAdjusting")}</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((job) => (
            <Link
              key={job.id}
              href={`/careers/${job.slug}`}
              className="group block bg-white rounded-xl border border-border p-7 hover:shadow-lg hover:border-accent/40 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    {job.department}
                  </span>
                  <h2 className="text-lg font-bold text-primary mt-1 group-hover:text-primary-light transition-colors">
                    {job.title}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent/70" />
                  {job.location}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent/70" />
                  {empType(job.employment_type)}
                </div>
                {(job.salary_min || job.salary_max) && (
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-accent/70" />
                    {job.salary_min && job.salary_max
                      ? `RM ${job.salary_min.toLocaleString()} – RM ${job.salary_max.toLocaleString()}`
                      : job.salary_min
                      ? `From RM ${job.salary_min.toLocaleString()}`
                      : `Up to RM ${job.salary_max!.toLocaleString()}`}
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-gray-500 line-clamp-2">
                {job.description.slice(0, 150)}...
              </p>
              <div className="mt-5 pt-4 border-t border-border">
                <span className="text-xs font-semibold text-primary group-hover:text-accent transition-colors uppercase tracking-wider">
                  {t("viewDetails")} &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
