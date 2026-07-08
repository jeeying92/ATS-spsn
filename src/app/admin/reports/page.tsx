"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  indeed: "Indeed",
  linkedin: "LinkedIn",
  referral: "Referral",
  jobstreet: "JobStreet",
  myfuturejobs: "MyFutureJobs",
  ricebowl: "Ricebowl",
  walk_in: "Walk-in",
  agency: "Agency",
};
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
  Star,
  ClipboardList,
  ExternalLink,
  CheckCircle2,
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
  mathScoreStats: {
    totalTested: number;
    avgScore: number;
    pass: number;
    borderline: number;
    fail: number;
    topScorers: { candidateName: string; jobTitle: string; mathScore: number; interviewType: string }[];
  };
  pretestScoreStats: {
    totalTested: number;
    avgScore: number;
    pass: number;
    borderline: number;
    fail: number;
    topScorers: { candidateName: string; jobTitle: string; pretestScore: number }[];
  };
  scoreStats: {
    totalScored: number;
    avgOverall: number;
    distribution: { excellent: number; good: number; average: number; poor: number };
    topCandidates: {
      name: string; score: number;
      experience: number; education: number; skills: number;
      communication: number; culture_fit: number;
    }[];
  };
}

interface PretestResponseData {
  configured: boolean;
  totalRespondents?: number;
  totalQuestions?: number;
  avgPercent?: number;
  pass?: number;
  borderline?: number;
  fail?: number;
  error?: string;
  respondents?: {
    name: string;
    position: string;
    score: string;
    percent: number | null;
    timestamp: string;
  }[];
  questionStats?: {
    text: string;
    counts: Record<string, number>;
    total: number;
  }[];
  positionCounts?: Record<string, number>;
  lastUpdated?: string;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pretestData, setPretestData] = useState<PretestResponseData | null>(null);
  const [pretestTab, setPretestTab] = useState<"overview" | "questions">("overview");

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
    fetch("/api/pretest-responses")
      .then((r) => r.json())
      .then((d) => setPretestData(d))
      .catch(() => setPretestData(null));
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

  function downloadMathStats() {
    const d = data!;
    downloadCSV("math_test_scores.csv",
      ["Candidate", "Job", "Round", "Math Score", "Result"],
      d.mathScoreStats.topScorers.map((s) => [
        s.candidateName, s.jobTitle,
        s.interviewType === "interview_1" ? "Round 1" : "Round 2",
        `${s.mathScore}%`,
        s.mathScore >= 70 ? "Pass" : s.mathScore >= 50 ? "Borderline" : "Fail",
      ])
    );
  }

  function downloadAll() {
    downloadSummary();
    setTimeout(downloadStageConversion, 200);
    setTimeout(downloadSourceStats, 400);
    setTimeout(downloadDeptStats, 600);
    setTimeout(downloadMathStats, 800);
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
                        <td className="py-2">{SOURCE_LABELS[s.source] || s.source}</td>
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

      {/* Math Test Score Analytics */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Math Test Results
            </h2>
            <button onClick={() => {
              const d = data!;
              downloadCSV("math_test_results.csv",
                ["Category", "Count"],
                [
                  ["Total Tested", String(d.mathScoreStats.totalTested)],
                  ["Average Score", `${d.mathScoreStats.avgScore}%`],
                  ["Pass (≥70%)", String(d.mathScoreStats.pass)],
                  ["Borderline (50–69%)", String(d.mathScoreStats.borderline)],
                  ["Fail (<50%)", String(d.mathScoreStats.fail)],
                ]
              );
            }} className="text-muted hover:text-primary transition-colors" title="Download CSV">
              <Download className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {data.mathScoreStats.totalTested === 0 ? (
              <p className="text-sm text-muted text-center py-4">No math test scores recorded yet.</p>
            ) : (
              <>
                <div className="text-center py-3 mb-4">
                  <div className={`text-3xl font-bold ${data.mathScoreStats.avgScore >= 70 ? "text-success" : data.mathScoreStats.avgScore >= 50 ? "text-warning" : "text-danger"}`}>
                    {data.mathScoreStats.avgScore}%
                  </div>
                  <div className="text-xs text-muted">Average Score ({data.mathScoreStats.totalTested} tested)</div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Pass (≥70%)", count: data.mathScoreStats.pass, color: "bg-green-400" },
                    { label: "Borderline (50–69%)", count: data.mathScoreStats.borderline, color: "bg-yellow-400" },
                    { label: "Fail (<50%)", count: data.mathScoreStats.fail, color: "bg-red-400" },
                  ].map((item) => {
                    const pct = data.mathScoreStats.totalTested > 0 ? Math.round((item.count / data.mathScoreStats.totalTested) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span className="text-muted">{item.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Top Math Scorers
            </h2>
            <button onClick={() => {
              const d = data!;
              downloadCSV("top_math_scorers.csv",
                ["Candidate", "Job", "Round", "Math Score"],
                d.mathScoreStats.topScorers.map((s) => [
                  s.candidateName, s.jobTitle,
                  s.interviewType === "interview_1" ? "Round 1" : "Round 2",
                  `${s.mathScore}%`,
                ])
              );
            }} className="text-muted hover:text-primary transition-colors" title="Download CSV">
              <Download className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {data.mathScoreStats.topScorers.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No math test scores recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {data.mathScoreStats.topScorers.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? "bg-primary/20 text-primary" : "bg-gray-200 text-gray-600"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{s.candidateName}</div>
                      <div className="text-xs text-muted truncate">{s.jobTitle} · {s.interviewType === "interview_1" ? "Round 1" : "Round 2"}</div>
                    </div>
                    <div className={`text-lg font-bold ${s.mathScore >= 70 ? "text-success" : s.mathScore >= 50 ? "text-warning" : "text-danger"}`}>
                      {s.mathScore}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pre-Test Score Analytics */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Pre-Test Results
            </h2>
            <button onClick={() => {
              const d = data!;
              downloadCSV("pretest_results.csv",
                ["Category", "Count"],
                [
                  ["Total Tested", String(d.pretestScoreStats.totalTested)],
                  ["Average Score", `${d.pretestScoreStats.avgScore}%`],
                  ["Pass (≥70%)", String(d.pretestScoreStats.pass)],
                  ["Borderline (50–69%)", String(d.pretestScoreStats.borderline)],
                  ["Fail (<50%)", String(d.pretestScoreStats.fail)],
                ]
              );
            }} className="text-muted hover:text-primary transition-colors" title="Download CSV">
              <Download className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {data.pretestScoreStats.totalTested === 0 ? (
              <p className="text-sm text-muted text-center py-4">No pre-test scores recorded yet.</p>
            ) : (
              <>
                <div className="text-center py-3 mb-4">
                  <div className={`text-3xl font-bold ${data.pretestScoreStats.avgScore >= 70 ? "text-success" : data.pretestScoreStats.avgScore >= 50 ? "text-warning" : "text-danger"}`}>
                    {data.pretestScoreStats.avgScore}%
                  </div>
                  <div className="text-xs text-muted">Average Score ({data.pretestScoreStats.totalTested} tested)</div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Pass (≥70%)", count: data.pretestScoreStats.pass, color: "bg-green-400" },
                    { label: "Borderline (50–69%)", count: data.pretestScoreStats.borderline, color: "bg-yellow-400" },
                    { label: "Fail (<50%)", count: data.pretestScoreStats.fail, color: "bg-red-400" },
                  ].map((item) => {
                    const pct = data.pretestScoreStats.totalTested > 0 ? Math.round((item.count / data.pretestScoreStats.totalTested) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span className="text-muted">{item.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Top Pre-Test Scorers
            </h2>
            <button onClick={() => {
              const d = data!;
              downloadCSV("top_pretest_scorers.csv",
                ["Candidate", "Job", "Pre-Test Score"],
                d.pretestScoreStats.topScorers.map((s) => [s.candidateName, s.jobTitle, `${s.pretestScore}%`])
              );
            }} className="text-muted hover:text-primary transition-colors" title="Download CSV">
              <Download className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {data.pretestScoreStats.topScorers.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No pre-test scores recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {data.pretestScoreStats.topScorers.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-600"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{s.candidateName}</div>
                      <div className="text-xs text-muted truncate">{s.jobTitle}</div>
                    </div>
                    <div className={`text-lg font-bold ${s.pretestScore >= 70 ? "text-success" : s.pretestScore >= 50 ? "text-warning" : "text-danger"}`}>
                      {s.pretestScore}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Math Test Survey & Responses Dashboard */}
      <div className="mt-8 bg-white rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Math Test Survey &amp; Responses
            </h2>
            {pretestData?.configured ? (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Connected to Google Forms
              </p>
            ) : (
              <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                Not connected
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pretestData?.configured && (
              <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                <button onClick={() => setPretestTab("overview")}
                  className={`px-4 py-1.5 font-medium transition-colors ${pretestTab === "overview" ? "bg-primary text-white" : "text-muted hover:bg-gray-50"}`}>
                  Overview
                </button>
                <button onClick={() => setPretestTab("questions")}
                  className={`px-4 py-1.5 font-medium transition-colors ${pretestTab === "questions" ? "bg-primary text-white" : "text-muted hover:bg-gray-50"}`}>
                  Questions
                </button>
              </div>
            )}
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSeeYlkpj4p55J3hlGPfy7-i7E6kNv7zlkYqpXi-kslw5vL0eQ/viewform"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Open Form
            </a>
          </div>
        </div>

        {/* Content */}
        {!pretestData ? (
          <div className="p-8 text-center text-sm text-muted">Loading...</div>
        ) : !pretestData.configured ? (
          <div className="p-10 text-center">
            <ClipboardList className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Google Sheet not linked</p>
            <p className="text-xs text-muted mt-1">Go to <strong>Settings → Pre-Test</strong> → paste the Google Sheet URL to enable response analytics.</p>
          </div>
        ) : pretestData.error ? (
          <div className="m-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{pretestData.error}</div>
        ) : (() => {
          const total = pretestData.totalRespondents ?? 0;
          const avgPercent = pretestData.avgPercent ?? 0;
          const scoredCount = (pretestData.pass ?? 0) + (pretestData.borderline ?? 0) + (pretestData.fail ?? 0);
          const passRate = scoredCount > 0 ? Math.round(((pretestData.pass ?? 0) / scoredCount) * 100) : 0;

          return (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
                {[
                  { label: "Average Score", value: `${avgPercent}%`, color: avgPercent >= 70 ? "text-green-600" : avgPercent >= 50 ? "text-amber-600" : "text-red-600" },
                  { label: "Total Responses", value: total, color: "text-primary" },
                  { label: "Questions", value: pretestData.totalQuestions ?? 0, color: "text-indigo-600" },
                  { label: "Pass Rate", value: `${passRate}%`, color: passRate >= 70 ? "text-green-600" : passRate >= 50 ? "text-amber-600" : "text-red-600" },
                ].map((s) => (
                  <div key={s.label} className="px-6 py-5 text-center">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-muted mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {total === 0 ? (
                <div className="p-8 text-center text-sm text-muted">No responses yet.</div>
              ) : pretestTab === "overview" ? (
                <div className="p-6 space-y-6">
                  {/* Respondent scores */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Respondent Scores</h3>
                    <div className="space-y-2">
                      {pretestData.respondents?.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            i === 0 && r.percent !== null ? "bg-primary/20 text-primary" : "bg-gray-200 text-gray-600"
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{r.name}</div>
                            <div className="text-xs text-muted truncate">{r.position} · {r.timestamp}</div>
                          </div>
                          <div className="text-xs text-muted">{r.score}</div>
                          {r.percent !== null ? (
                            <div className={`text-lg font-bold w-14 text-right ${r.percent >= 70 ? "text-success" : r.percent >= 50 ? "text-warning" : "text-danger"}`}>
                              {r.percent}%
                            </div>
                          ) : (
                            <div className="text-sm text-muted w-14 text-right">—</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Position breakdown */}
                  {pretestData.positionCounts && Object.keys(pretestData.positionCounts).length > 0 && (
                    <div className="border-t border-border pt-4">
                      <h3 className="text-sm font-semibold mb-3">Applied Position</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(pretestData.positionCounts).map(([pos, count], idx) => {
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          const colors = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b"];
                          return (
                            <div key={pos} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">{pos}</span>
                                <span className="text-lg font-bold" style={{ color: colors[idx % colors.length] }}>{count}</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }} />
                              </div>
                              <div className="text-xs text-muted mt-1 text-right">{pct}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pass / Borderline / Fail cards */}
                  <div className="border-t border-border pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Pass", desc: "≥70%", count: pretestData.pass ?? 0, color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
                        { label: "Borderline", desc: "50–69%", count: pretestData.borderline ?? 0, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
                        { label: "Fail", desc: "<50%", count: pretestData.fail ?? 0, color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                      ].map((band) => {
                        const pct = scoredCount > 0 ? Math.round((band.count / scoredCount) * 100) : 0;
                        return (
                          <div key={band.label} className="rounded-lg p-4 border" style={{ backgroundColor: band.bg, borderColor: band.border }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold" style={{ color: band.color }}>{band.label}</span>
                              <span className="text-xl font-bold" style={{ color: band.color }}>{pct}%</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{band.desc}</p>
                            <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: band.color }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">{band.count} respondent{band.count !== 1 ? "s" : ""}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Questions tab — answer distribution per question */
                <div className="p-6 space-y-4">
                  {pretestData.questionStats?.map((q, qi) => {
                    const answers = Object.entries(q.counts).sort((a, b) => b[1] - a[1]);
                    const topAnswer = answers[0]?.[0];
                    return (
                      <div key={qi} className="border border-border rounded-xl p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{qi + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{q.text}</p>
                            <span className="text-xs text-muted">{q.total} response{q.total !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {answers.map(([opt, count]) => {
                            const pct = q.total > 0 ? Math.round((count / q.total) * 100) : 0;
                            const isTop = opt === topAnswer;
                            return (
                              <div key={opt} className={`rounded-lg px-3 py-2 ${isTop ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={`text-xs flex items-center gap-1.5 ${isTop ? "text-blue-700 font-semibold" : "text-gray-700"}`}>
                                    {isTop && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                                    {opt}
                                  </span>
                                  <span className="text-xs text-muted">{count} ({pct}%)</span>
                                </div>
                                <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${isTop ? "bg-blue-500" : "bg-gray-300"}`}
                                    style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Candidate Score Analytics */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              Resume Score Distribution
            </h2>
            <button onClick={() => {
              const d = data!;
              downloadCSV("score_distribution.csv",
                ["Category", "Count"],
                [
                  ["Excellent (4-5)", String(d.scoreStats.distribution.excellent)],
                  ["Good (3-4)", String(d.scoreStats.distribution.good)],
                  ["Average (2-3)", String(d.scoreStats.distribution.average)],
                  ["Poor (<2)", String(d.scoreStats.distribution.poor)],
                ]
              );
            }} className="text-muted hover:text-primary transition-colors" title="Download CSV">
              <Download className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-3 mb-4">
              <div className="text-3xl font-bold text-primary">{data.scoreStats.avgOverall}</div>
              <div className="text-xs text-muted">Average Score ({data.scoreStats.totalScored} scored)</div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Excellent (4-5)", count: data.scoreStats.distribution.excellent, color: "bg-green-400" },
                { label: "Good (3-4)", count: data.scoreStats.distribution.good, color: "bg-blue-400" },
                { label: "Average (2-3)", count: data.scoreStats.distribution.average, color: "bg-yellow-400" },
                { label: "Poor (<2)", count: data.scoreStats.distribution.poor, color: "bg-red-400" },
              ].map((item) => {
                const pct = data.scoreStats.totalScored > 0 ? Math.round((item.count / data.scoreStats.totalScored) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="text-muted">{item.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              Top Candidates
            </h2>
            <button onClick={() => {
              const d = data!;
              downloadCSV("top_candidates.csv",
                ["Name", "Overall", "Experience", "Education", "Skills", "Communication", "Culture Fit"],
                d.scoreStats.topCandidates.map((c) => [
                  c.name, String(c.score), String(c.experience), String(c.education),
                  String(c.skills), String(c.communication), String(c.culture_fit),
                ])
              );
            }} className="text-muted hover:text-primary transition-colors" title="Download CSV">
              <Download className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {data.scoreStats.topCandidates.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No candidates scored yet.</p>
            ) : (
              <div className="space-y-3">
                {data.scoreStats.topCandidates.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? "bg-accent/20 text-accent" : "bg-gray-200 text-gray-600"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-muted">
                        Exp:{c.experience} Edu:{c.education} Skill:{c.skills} Comm:{c.communication} Fit:{c.culture_fit}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      c.score >= 4 ? "text-success" : c.score >= 3 ? "text-accent" : "text-warning"
                    }`}>
                      {c.score.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
