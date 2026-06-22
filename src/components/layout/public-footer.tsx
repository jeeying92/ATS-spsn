"use client";

import { useLocale } from "@/lib/locale-context";

export function PublicFooter() {
  const { t } = useLocale();

  return (
    <footer className="bg-primary-dark text-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/semipack-logo.png"
              alt="Semipack"
              className="h-7 w-auto brightness-0 invert opacity-40"
            />
            <span className="text-sm">Semipack Malaysia Sdn Bhd</span>
          </div>
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Semipack Malaysia Sdn Bhd. {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
