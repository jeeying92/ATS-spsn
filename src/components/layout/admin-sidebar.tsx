"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  Zap,
  Settings,
  ChevronLeft,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/interviews", label: "Interviews", icon: Calendar },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/workflows", label: "Workflows", icon: Zap },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => { if (data.logo_url) setLogoUrl(data.logo_url); })
      .catch(() => {});
  }, []);

  return (
    <aside className="w-64 bg-primary flex flex-col min-h-screen">
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/admin/jobs" className="flex items-center gap-3">
          <img
            src={logoUrl || "/semipack-logo.png"}
            alt="Semipack"
            className="h-9 w-auto object-contain bg-white rounded-lg px-2 py-1"
          />
        </Link>
        <div className="text-[11px] text-white/30 mt-1.5 uppercase tracking-widest">
          Recruitment Tracking System
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/careers"
          className="flex items-center gap-2 px-4 py-2 text-sm text-white/30 hover:text-accent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          View Careers Page
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/admin/login");
            router.refresh();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white/30 hover:text-red-400 transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
