import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { STAGES, STAGE_LABELS, ApplicationStage } from "@/lib/types";

export async function GET() {
  const supabase = createServiceClient();

  const [
    { data: applications },
    { data: jobs },
    { data: candidates },
    { data: interviews },
    { data: candidateScores },
  ] = await Promise.all([
    supabase.from("applications").select("*, candidate:candidates(source), job:jobs(title, department)"),
    supabase.from("jobs").select("*"),
    supabase.from("candidates").select("*"),
    supabase.from("interviews").select("*"),
    supabase.from("candidate_scores").select("*, candidate:candidates(name)"),
  ]);

  const apps = applications || [];
  const allJobs = jobs || [];

  // Average time to hire (applied_at to stage_changed_at where stage = 'hired')
  const hiredApps = apps.filter((a) => a.stage === "hired");
  const avgTimeToHire = hiredApps.length > 0
    ? hiredApps.reduce((sum, a) => {
        const days = (new Date(a.stage_changed_at).getTime() - new Date(a.applied_at).getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / hiredApps.length
    : 0;

  // Stage conversion funnel
  const stageCounts: Record<string, number> = {};
  for (const stage of [...STAGES, "rejected" as ApplicationStage]) {
    stageCounts[stage] = apps.filter((a) => a.stage === stage).length;
  }
  // Also count all who passed through each stage (current stage or beyond)
  const stagePassthrough: Record<string, number> = {};
  const stageOrder = STAGES;
  for (let i = 0; i < stageOrder.length; i++) {
    stagePassthrough[stageOrder[i]] = apps.filter((a) => {
      if (a.stage === "rejected") {
        // Check stage_changed_at vs applied_at to infer they reached at least some stage
        return false; // Simplified: count only current
      }
      const appStageIdx = stageOrder.indexOf(a.stage as ApplicationStage);
      return appStageIdx >= i;
    }).length;
  }

  // Source effectiveness — show ALL sources, even with 0 applications
  const ALL_SOURCES = [
    "indeed", "website", "linkedin", "referral", "jobstreet",
    "myfuturejobs", "ricebowl", "walk_in", "agency",
  ];
  const activeSources = new Set(apps.map((a) => a.candidate?.source || "unknown"));
  const sources = [...new Set([...ALL_SOURCES, ...activeSources])];
  const sourceStats = sources.map((source) => {
    const sourceApps = apps.filter((a) => a.candidate?.source === source);
    const hired = sourceApps.filter((a) => a.stage === "hired").length;
    return {
      source,
      total: sourceApps.length,
      hired,
      conversion: sourceApps.length > 0 ? ((hired / sourceApps.length) * 100).toFixed(1) : "0",
    };
  });

  // Department progress
  const departments = [...new Set(allJobs.map((j) => j.department))];
  const deptStats = departments.map((dept) => {
    const deptJobs = allJobs.filter((j) => j.department === dept);
    const deptApps = apps.filter((a) => a.job?.department === dept);
    const deptHired = deptApps.filter((a) => a.stage === "hired").length;
    return {
      department: dept,
      openJobs: deptJobs.filter((j) => j.status === "published").length,
      totalApplicants: deptApps.length,
      hired: deptHired,
      inPipeline: deptApps.filter((a) => !["hired", "rejected"].includes(a.stage)).length,
    };
  });

  return NextResponse.json({
    summary: {
      totalJobs: allJobs.length,
      activeJobs: allJobs.filter((j) => j.status === "published").length,
      totalCandidates: (candidates || []).length,
      totalApplications: apps.length,
      avgTimeToHire: Math.round(avgTimeToHire * 10) / 10,
      totalInterviews: (interviews || []).length,
    },
    stageCounts,
    stagePassthrough,
    sourceStats,
    deptStats,
    scoreStats: {
      totalScored: (candidateScores || []).length,
      avgOverall: (candidateScores || []).length > 0
        ? Math.round(((candidateScores || []).reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.overall_score), 0) / (candidateScores || []).length) * 10) / 10
        : 0,
      distribution: {
        excellent: (candidateScores || []).filter((s: Record<string, unknown>) => Number(s.overall_score) >= 4).length,
        good: (candidateScores || []).filter((s: Record<string, unknown>) => Number(s.overall_score) >= 3 && Number(s.overall_score) < 4).length,
        average: (candidateScores || []).filter((s: Record<string, unknown>) => Number(s.overall_score) >= 2 && Number(s.overall_score) < 3).length,
        poor: (candidateScores || []).filter((s: Record<string, unknown>) => Number(s.overall_score) < 2).length,
      },
      topCandidates: (candidateScores || [])
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.overall_score) - Number(a.overall_score))
        .slice(0, 5)
        .map((s: Record<string, unknown>) => ({
          name: (s.candidate as Record<string, unknown>)?.name || "Unknown",
          score: Number(s.overall_score),
          experience: s.experience,
          education: s.education,
          skills: s.skills,
          communication: s.communication,
          culture_fit: s.culture_fit,
        })),
    },
  });
}
