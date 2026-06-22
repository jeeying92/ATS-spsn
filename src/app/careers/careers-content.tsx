"use client";

import { Job, CompanySettings } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { JobGrid } from "./job-grid";
import { MapPin, Users, Award, Factory, Cpu } from "lucide-react";

export function CareersContent({
  jobs,
  company,
}: {
  jobs: Job[];
  company: CompanySettings | null;
}) {
  const { t } = useLocale();

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-primary overflow-hidden">
        {company?.company_photo_url ? (
          <>
            <img
              src={company.company_photo_url}
              alt="Semipack Malaysia"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-primary" />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="section-divider mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {t("heroTitle1")}<br />
              <span className="text-accent">{t("heroTitle2")}</span>
            </h1>
            <p className="mt-5 text-lg text-white/70 leading-relaxed">
              {t("heroDesc")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#openings"
                className="inline-flex items-center px-7 py-3 bg-accent text-primary-dark font-semibold rounded hover:bg-accent-light transition-colors tracking-wide text-sm uppercase"
              >
                {t("viewOpeningsBtn")}
              </a>
              <a
                href="#about"
                className="inline-flex items-center px-7 py-3 border-2 border-white/30 text-white font-medium rounded hover:bg-white/10 transition-colors tracking-wide text-sm uppercase"
              >
                {t("learnMore")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              { icon: Factory, value: "Nilai, N.S.", label: t("headquarters") },
              { icon: Cpu, value: t("semiconductor"), label: t("industry") },
              { icon: Users, value: `${jobs.length}`, label: t("openPositions") },
              { icon: Award, value: t("isoCertified"), label: t("qualityStandard") },
            ].map((stat) => (
              <div key={stat.label} className="py-8 px-6 text-center">
                <stat.icon className="w-6 h-6 text-accent mx-auto mb-2" />
                <div className="text-xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Vision / Mission */}
      {company && (company.vision || company.mission) && (
        <section id="about" className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-14">
              <h2 className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">
                {t("whySemipack")}
              </h2>
              <p className="text-3xl font-bold text-primary">
                {t("exploreEngageExcel")}
              </p>
              <div className="section-divider mx-auto mt-4" />
            </div>
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {company.vision && (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
                  <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-5">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-3">{t("ourVision")}</h3>
                  <p className="text-muted leading-relaxed">{company.vision}</p>
                </div>
              )}
              {company.mission && (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-5">
                    <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-3">{t("ourMission")}</h3>
                  <p className="text-muted leading-relaxed">{company.mission}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Job Openings */}
      <section id="openings" className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">
              {t("opportunities")}
            </h2>
            <p className="text-3xl font-bold text-primary">
              {t("currentOpenings")}
            </p>
            <div className="section-divider mx-auto mt-4" />
          </div>
          <JobGrid jobs={jobs} />
        </div>
      </section>

      {/* Location / CTA */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t("discoverPotential")}
            </h2>
            <p className="text-white/60 text-lg mb-3">
              {t("ctaSubtitle")}
            </p>
            {company?.address && (
              <p className="text-white/40 text-sm flex items-center justify-center gap-2 mt-6">
                <MapPin className="w-4 h-4" />
                {company.address}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
