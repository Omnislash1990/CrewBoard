import type { Metadata } from "next";
import Link from "next/link";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata: Metadata = {
  title: "Dispatch",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-dvh bg-slate-50">
        <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              CrewBoard
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              Office portal
            </p>
          </div>
          <nav className="flex-1 px-3 py-4">
            <Link
              href="/admin"
              className="flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900"
            >
              Job Dispatch
            </Link>
          </nav>
        </aside>

        <div className="md:pl-64">
          <EmailVerificationBanner />
          <header className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <p className="text-sm font-semibold text-slate-900">Job Dispatch</p>
          </header>
          <main className="p-6 md:p-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
