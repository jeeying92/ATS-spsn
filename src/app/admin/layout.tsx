import { AdminShell } from "@/components/layout/admin-shell";
import { AuthGuard } from "@/components/layout/auth-guard";

export const metadata = {
  title: "Admin - Recruitment Tracking System",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
