"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";

export function PublicHeader() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { locale, setLocale, t } = useLocale();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => { if (data.logo_url) setLogoUrl(data.logo_url); })
      .catch(() => {});
  }, []);

  return (
    <header className="bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          <Link href="/careers" className="flex items-center gap-3">
            <img
              src={logoUrl || "/semipack-logo.png"}
              alt="Semipack Malaysia"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
            <div className="hidden sm:block">
              <div className="text-white font-bold text-sm tracking-wide">SEMIPACK MALAYSIA SDN BHD</div>
            </div>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            {/* Language switcher */}
            <div className="flex items-center border border-white/20 rounded overflow-hidden text-xs">
              <button
                onClick={() => setLocale("en")}
                className={`px-2.5 py-1.5 font-medium transition-colors ${
                  locale === "en"
                    ? "bg-accent text-primary-dark"
                    : "text-white/60 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("zh")}
                className={`px-2.5 py-1.5 font-medium transition-colors ${
                  locale === "zh"
                    ? "bg-accent text-primary-dark"
                    : "text-white/60 hover:text-white"
                }`}
              >
                中文
              </button>
            </div>
            <Link
              href="/careers"
              className="hidden sm:inline-flex text-sm font-medium text-white/80 hover:text-accent transition-colors tracking-wide uppercase"
            >
              {t("careers")}
            </Link>
            <a
              href="#openings"
              className="text-sm font-medium bg-accent text-primary-dark px-5 py-2 rounded hover:bg-accent-light transition-colors tracking-wide uppercase"
            >
              {t("viewOpenings")}
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
