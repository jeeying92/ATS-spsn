"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS, ApplicationStage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  FileText,
  Clock,
  Calendar,
  TrendingUp,
  Download,
} from "lucide-react";

interface ReportData {
  summary: {
    totalJobs: number;
    activeJobs: number;
    totalCandidates: number;
    totalApplications: number;
    avgTimeToHire: number;
    totalInterviews: number;
  };
  stageCounts: Record<string, number>;
  stagePassthrough: Record<string, number>;
  sourceStats: { source: string; total: number; hired: number; conversion: string }[];
  deptStats: {
    department: string;
    openJobs: number;
    totalApplicants: number;
    hired: number;
    inPipeline: number;
  }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return <div className="text-center py-12 text-muted">Loading reports...</div>;
  }

  const statCards = [
    { label: "Active Jobs", value: data.summary.activeJobs, icon: Briefcase, color: "text-primary" },
    { label: "Total Candidates", value: data.summary.totalCandidates, icon: Users, color: "text-indigo-600" },
    { label: "Applications", value: data.summary.totalApplications, icon: FileText, color: "text-amber-600" },
    { label: "Avg. Time to Hire", value: `${data.summary.avgTimeToHire} days`, icon: Clock, color: "text-green-600" },
    { label: "Interviews", value: data.summary.totalInterviews, icon: Calendar, color: "text-purple-600" },
  ];

  const totalApps = data.summary.totalApplications || 1;

  function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadSummary() {
    const d = data!;
    downloadCSV("summary_report.csv",
      ["Metric", "Value"],
      [
        ["Active Jobs", String(d.summary.activeJobs)],
        ["Total Candidates", String(d.summary.totalCandidates)],
        ["Total Applications", String(d.summary.totalApplications)],
        ["Avg. Time to Hire (days)", String(d.summary.avgTimeToHire)],
        ["Total Interviews", String(d.summary.totalInterviews)],
      ]
    );
  }

  function downloadStageConversion() {
    const d = data!;
    downloadCSV("stage_conversion.csv",
      ["Stage", "Count", "Percentage"],
      Object.entries(d.stageCounts).map(([stage, count]) => [
        STAGE_LABELS[stage as ApplicationStage] || stage,
        String(count),
        `${Math.round((count / totalApps) * 100)}%`,
      ])
    );
  }

  function downloadSourceStats() {
    const d = data!;
    downloadCSV("source_effectiveness.csv",
      ["Source", "Applied", "Hired", "Conversion Rate"],
      d.sourceStats.map((s) => [s.source, String(s.total), String(s.hired), `${s.conversion}%`])
    );
  }

  function downloadDeptStats() {
    const d = data!;
    downloadCSV("department_progress.csv",
      ["Department", "Open Jobs", "Applicants", "In Pipeline", "Hired"],
      d.deptStats.map((dept) => [
        dept.department,
        String(dept.openJobs),
        String(dept.totalApplicants),
        String(dept.inPipeline),
        String(dept.hired),
      ])
    );
  }

  function downloadAll() {
    downloadSummary();
    setTimeout(downloadStageConversion, 200);
    setTimeout(downloadSourceStats, 400);
    setTimeout(downloadDeptStats, 600);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted mt-1">Hiring analytics and insights</p>
        </div>
        <Button onClick={downloadAll} variant="secondary">
          <Download className="w-4 h-4 mr-2" /> Download All CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Stage Conversion Funnel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Stage Conversion
            </h2>
            <button onClick={downloadStageConversion} className="text-muted hover:text-primary transition-colors" title="Download CSV">
              <Download className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.stageCounts).map(([stage, count]) => {
                const pct = Math.round((count / totalApps) * 100);
                const colors: Record<string, string> = {
                  applied: "bg-gray-400",
                  screened: "bg-blue-400",
                  interview_1: "bg-indigo-400",
                  interview_2: "bg-purple-400",
                  offer: "bg-amber-400",
                  hired: "bg-green-400",
                  rejected: "bg-red-400",
                };
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{STAGE_LABELS[stage as ApplicationStage] || stage}</span>
                      <span className="text-muted">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[stage] || "bg-gray-300"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Source Effectiveness */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold">Source Effectiveness</h2>
            <button onClick={downloadSourceStats} className="text-muted hover:text-primary transition-colors" title="Download CSV">
              <Download className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {data.sourceStats.length === 0 ? (
              <p className="text-sm text-muted">No data yet.</p>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted">Source</th>
                      <th className="text-right py-2 font-medium text-muted">Applied</th>
                      <th className="text-right py-2 font-medium text-muted">Hired</th>
                      <th className="text-right py-2 font-medium text-muted">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sourceStats.map((s) => (
                      <tr key={s.source} className="border-b border-border last:border-0">
                        <td className="py-2 capitalize">{s.source}</td>
                        <td className="py-2 text-right">{s.total}</td>
                        <td className="py-2 text-right">{s.hired}</td>
                        <td className="py-2 text-right">
                          <Badge variant={Number(s.conversion) > 0 ? "success" : "default"}>
                            {s.conversion}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold">Department Progress</h2>
          <button onClick={downloadDeptStats} className="text-muted hover:text-primary transition-colors" title="Download CSV">
            <Download className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          {data.deptStats.length === 0 ? (
            <p className="text-sm text-muted">No data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted">Department</th>
                    <th className="text-right py-2 font-medium text-muted">Open Jobs</th>
                    <th className="text-right py-2 font-medium text-muted">Applicants</th>
                    <th className="text-right py-2 font-medium text-muted">In Pipeline</th>
                    <th className="text-right py-2 font-medium text-muted">Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deptStats.map((d) => (
                    <tr key={d.department} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{d.department}</td>
                      <td className="py-3 text-right">{d.openJobs}</td>
                      <td className="py-3 text-right">{d.totalApplicants}</td>
                      <td className="py-3 text-right">
                        <Badge variant="info">{d.inPipeline}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant="success">{d.hired}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
