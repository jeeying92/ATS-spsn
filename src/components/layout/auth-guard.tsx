"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecked(true);
      setAuthenticated(true);
      return;
    }

    fetch("/api/auth/session")
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          router.replace("/admin/login");
        }
        setChecked(true);
      })
      .catch(() => {
        router.replace("/admin/login");
        setChecked(true);
      });
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
