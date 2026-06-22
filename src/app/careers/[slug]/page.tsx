import { createServiceClient } from "@/lib/supabase/server";
import { Job } from "@/lib/types";
import { notFound } from "next/navigation";
import { MapPin, Clock, Banknote, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!job) notFound();

  const typedJob = job as Job;

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
            Back to all openings
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-3">
            {typedJob.title}
          </h1>
          <div className="flex flex-wrap items-center gap-5 mt-3 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-accent/70" />
              {typedJob.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent/70" />
              {typedJob.employment_type === "full_time" ? "Full Time" : typedJob.employment_type === "part_time" ? "Part Time" : "Contract"}
            </span>
            {(typedJob.salary_min || typedJob.salary_max) && (
              <span className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-accent/70" />
                {typedJob.salary_min && typedJob.salary_max
                  ? `RM ${typedJob.salary_min.toLocaleString()} – RM ${typedJob.salary_max.toLocaleString()}`
                  : typedJob.salary_min
                  ? `From RM ${typedJob.salary_min.toLocaleString()}`
                  : `Up to RM ${typedJob.salary_max!.toLocaleString()}`}
              </span>
            )}
            <span className="px-3 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
              {typedJob.department}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl border border-border p-8">
              <h2 className="text-lg font-bold text-primary mb-4">About the Role</h2>
              <div className="section-divider mb-5" />
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">{typedJob.description}</p>
            </div>

            {typedJob.requirements && (
              <div className="bg-white rounded-xl border border-border p-8">
                <h2 className="text-lg font-bold text-primary mb-4">Requirements</h2>
                <div className="section-divider mb-5" />
                <div className="text-gray-600 whitespace-pre-line leading-relaxed">{typedJob.requirements}</div>
              </div>
            )}

            {typedJob.benefits && (
              <div className="bg-white rounded-xl border border-border p-8">
                <h2 className="text-lg font-bold text-primary mb-4">Benefits</h2>
                <div className="section-divider mb-5" />
                <div className="text-gray-600 whitespace-pre-line leading-relaxed">{typedJob.benefits}</div>
              </div>
            )}
          </div>

          {/* Sidebar - Apply form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-border p-8 sticky top-8">
              <h2 className="text-lg font-bold text-primary mb-1">Apply Now</h2>
              <p className="text-sm text-muted mb-5">Fill in the form below to submit your application.</p>
              <div className="section-divider mb-6" />
              <ApplyForm jobId={typedJob.id} jobTitle={typedJob.title} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
