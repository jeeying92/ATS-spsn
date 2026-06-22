"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function PublicHeader() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/careers"
              className="text-sm font-medium text-white/80 hover:text-accent transition-colors tracking-wide uppercase"
            >
              Careers
            </Link>
            <Link
              href="/careers"
              className="text-sm font-medium bg-accent text-primary-dark px-5 py-2 rounded hover:bg-accent-light transition-colors tracking-wide uppercase"
            >
              View Openings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
