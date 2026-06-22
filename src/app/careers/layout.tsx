import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { LocaleProvider } from "@/lib/locale-context";

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </LocaleProvider>
  );
}
